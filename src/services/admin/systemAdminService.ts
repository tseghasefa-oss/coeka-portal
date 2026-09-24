import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { schema } from '../../database/client';
import { eq } from 'drizzle-orm';

export interface SystemSettingItem {
  key: string;
  value: string;
  description: string | null;
  category: string;
  updatedBy: string | null;
  updatedAt: number;
}

export class SystemAdminService {
  constructor(private db: IDatabaseProvider) {}

  // -------------------------------------------------------------
  // Key-Value Institutional Configuration
  // -------------------------------------------------------------

  async getSetting(key: string, defaultValue: string | null = null): Promise<string | null> {
    const row = await this.db.queryFirst<{ value: string }>(
      `SELECT value FROM system_settings WHERE key = ?`,
      [key]
    );
    return row ? row.value : defaultValue;
  }

  async setSetting(
    key: string,
    value: string,
    category: string = 'GENERAL',
    description?: string,
    updatedBy?: string
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    if (this.db.drizzle) {
      try {
        await this.db.drizzle
          .insert(schema.systemSettings)
          .values({
            key,
            value,
            description: description || null,
            category,
            updatedBy: updatedBy || null,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: schema.systemSettings.key,
            set: {
              value,
              description: description || null,
              category,
              updatedBy: updatedBy || null,
              updatedAt: now,
            },
          });
        return;
      } catch {
        // Fallback to SQLite INSERT OR REPLACE
      }
    }

    await this.db.execute(
      `INSERT INTO system_settings (key, value, description, category, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         description = COALESCE(excluded.description, system_settings.description),
         category = excluded.category,
         updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`,
      [key, value, description || null, category, updatedBy || null, now]
    );
  }

  async getAllSettings(category?: string): Promise<Record<string, string>> {
    const rows = await this.getSettingsList(category);
    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }
    return map;
  }

  async getSettingsList(category?: string): Promise<SystemSettingItem[]> {
    const sql = category
      ? `SELECT key, value, description, category, updated_by as updatedBy, updated_at as updatedAt FROM system_settings WHERE category = ? ORDER BY key ASC`
      : `SELECT key, value, description, category, updated_by as updatedBy, updated_at as updatedAt FROM system_settings ORDER BY category ASC, key ASC`;
    return await this.db.query<SystemSettingItem>(sql, category ? [category] : []);
  }

  // -------------------------------------------------------------
  // Portal Operational Status (Open / Closed Controls)
  // -------------------------------------------------------------

  async setPortalStatus(
    module: 'admissions' | 'course_registration' | 'result_upload',
    isOpen: boolean,
    updatedBy?: string
  ): Promise<{ module: string; isOpen: boolean }> {
    const strVal = isOpen ? 'true' : 'false';
    const intVal = isOpen ? 1 : 0;

    await this.setSetting(
      `portal_status_${module}`,
      strVal,
      'PORTAL_CONTROLS',
      `Master switch determining if the ${module} subsystem is actively open for traffic`,
      updatedBy
    );

    // Synchronize underlying domain state in relational tables
    if (module === 'admissions') {
      await this.db.execute(`UPDATE admissions_cycles SET is_open = ?`, [intVal]);
    } else if (module === 'course_registration') {
      await this.db.execute(`UPDATE semesters_terms SET registration_open = ? WHERE is_current = 1`, [intVal]);
    } else if (module === 'result_upload') {
      await this.db.execute(`UPDATE semesters_terms SET result_upload_open = ? WHERE is_current = 1`, [intVal]);
    }

    return { module, isOpen };
  }

  async getPortalStatus(
    module: 'admissions' | 'course_registration' | 'result_upload'
  ): Promise<boolean> {
    const val = await this.getSetting(`portal_status_${module}`);
    if (val !== null) {
      return val === 'true';
    }

    // Default heuristics based on current database records
    if (module === 'admissions') {
      const cycle = await this.db.queryFirst<{ is_open: number }>(
        `SELECT is_open FROM admissions_cycles ORDER BY created_at DESC LIMIT 1`
      );
      return cycle ? Boolean(cycle.is_open) : true;
    } else if (module === 'course_registration') {
      const sem = await this.db.queryFirst<{ registration_open: number }>(
        `SELECT registration_open FROM semesters_terms WHERE is_current = 1 LIMIT 1`
      );
      return sem ? Boolean(sem.registration_open) : true;
    } else if (module === 'result_upload') {
      const sem = await this.db.queryFirst<{ result_upload_open: number }>(
        `SELECT result_upload_open FROM semesters_terms WHERE is_current = 1 LIMIT 1`
      );
      return sem ? Boolean(sem.result_upload_open) : true;
    }

    return true;
  }

  // -------------------------------------------------------------
  // Academic Calendar & Sessions Management
  // -------------------------------------------------------------

  async setAcademicCalendarDates(data: {
    sessionId: string;
    startDate: string;
    endDate: string;
    updatedBy?: string;
  }): Promise<{ sessionId: string; startDate: string; endDate: string }> {
    // 1. Update academic_sessions record
    await this.db.execute(
      `UPDATE academic_sessions SET start_date = ?, end_date = ? WHERE id = ?`,
      [data.startDate, data.endDate, data.sessionId]
    );

    // 2. Persist in system_settings audit key-value
    await this.setSetting(
      `academic_calendar_${data.sessionId}_start`,
      data.startDate,
      'ACADEMIC_CALENDAR',
      `Start date for Academic Session ${data.sessionId}`,
      data.updatedBy
    );
    await this.setSetting(
      `academic_calendar_${data.sessionId}_end`,
      data.endDate,
      'ACADEMIC_CALENDAR',
      `End date for Academic Session ${data.sessionId}`,
      data.updatedBy
    );

    return {
      sessionId: data.sessionId,
      startDate: data.startDate,
      endDate: data.endDate,
    };
  }

  async getAcademicCalendar(sessionId?: string): Promise<{
    currentSession: any;
    allSessions: any[];
    semesters: any[];
  }> {
    const currentSession = await this.db.queryFirst<any>(
      sessionId
        ? `SELECT * FROM academic_sessions WHERE id = ?`
        : `SELECT * FROM academic_sessions WHERE is_current = 1 LIMIT 1`,
      sessionId ? [sessionId] : []
    );

    const allSessions = await this.db.query<any>(
      `SELECT * FROM academic_sessions ORDER BY start_date DESC`
    );

    const currentSessionId = currentSession?.id || allSessions[0]?.id;
    const semesters = currentSessionId
      ? await this.db.query<any>(
          `SELECT * FROM semesters_terms WHERE session_id = ? ORDER BY term_number ASC`,
          [currentSessionId]
        )
      : [];

    return {
      currentSession,
      allSessions,
      semesters,
    };
  }
}
