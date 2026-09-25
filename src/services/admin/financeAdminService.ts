import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { schema } from '../../database/client';
import { LedgerEngine } from '../finance/ledgerEngine';
import { eq, and } from 'drizzle-orm';
import { AuditService } from './auditService';

export interface FeeCategoryItem {
  id: string;
  divisionId: string;
  name: string;
  code: string;
  isRecurring: boolean;
}

export interface FeeScheduleItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  categoryCode?: string;
  divisionId?: string;
  sessionId: string;
  sessionName?: string;
  level: number;
  amountKobo: number;
  formattedAmount: string;
  dueDate: string | null;
  createdAt: number;
}

export class FinanceAdminService {
  private auditService: AuditService;

  constructor(private db: IDatabaseProvider, auditService?: AuditService) {
    this.auditService = auditService || new AuditService(db);
  }

  /**
   * Validate that an amount is strictly an integer in Kobo and non-negative.
   */
  private validateKoboAmount(amountKobo: number): void {
    if (!Number.isInteger(amountKobo)) {
      throw new Error(
        `Financial Engine Violation: Monetary amounts must be strictly integers in Kobo. Floating-point value received: ${amountKobo}`
      );
    }
    if (amountKobo < 0) {
      throw new Error(
        `Financial Engine Violation: Monetary amounts cannot be negative. Value received: ${amountKobo}`
      );
    }
  }

  // -------------------------------------------------------------
  // Fee Categories (Tuition, Registration, ICT Levy, etc.)
  // -------------------------------------------------------------

  async createFeeCategory(data: {
    divisionId: string;
    name: string;
    code: string;
    isRecurring?: boolean;
  }): Promise<FeeCategoryItem> {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const isRecurring = data.isRecurring !== undefined ? (data.isRecurring ? 1 : 0) : 1;

    if (this.db.drizzle) {
      try {
        const res = await this.db.drizzle
          .insert(schema.feeCategories)
          .values({
            id,
            divisionId: data.divisionId,
            name: data.name,
            code: data.code.toUpperCase(),
            isRecurring,
          })
          .returning();
        if (res && res.length > 0) {
          const row = res[0];
          return {
            id: row.id,
            divisionId: row.divisionId,
            name: row.name,
            code: row.code,
            isRecurring: Boolean(row.isRecurring),
          };
        }
      } catch {
        // Fallback to raw SQL
      }
    }

    await this.db.execute(
      `INSERT INTO fee_categories (id, division_id, name, code, is_recurring)
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.divisionId, data.name, data.code.toUpperCase(), isRecurring]
    );

    return {
      id,
      divisionId: data.divisionId,
      name: data.name,
      code: data.code.toUpperCase(),
      isRecurring: Boolean(isRecurring),
    };
  }

  async listFeeCategories(divisionId?: string): Promise<FeeCategoryItem[]> {
    const sql = divisionId
      ? `SELECT id, division_id as divisionId, name, code, is_recurring as isRecurring FROM fee_categories WHERE division_id = ? ORDER BY name ASC`
      : `SELECT id, division_id as divisionId, name, code, is_recurring as isRecurring FROM fee_categories ORDER BY name ASC`;
    const rows = await this.db.query<any>(sql, divisionId ? [divisionId] : []);
    return rows.map(r => ({
      ...r,
      isRecurring: Boolean(r.isRecurring),
    }));
  }

  // -------------------------------------------------------------
  // Fee Schedules (Price Setting per Category, Session & Level)
  // -------------------------------------------------------------

  /**
   * Set or update a fee schedule price using strictly Kobo-integer arithmetic
   */
  async setFeePrice(data: {
    categoryId: string;
    sessionId: string;
    level: number;
    amountKobo: number;
    dueDate?: string;
  }): Promise<FeeScheduleItem> {
    this.validateKoboAmount(data.amountKobo);

    // Check if a fee schedule already exists for this (category, session, level)
    const existing = await this.db.queryFirst<any>(
      `SELECT id FROM fee_schedules WHERE category_id = ? AND session_id = ? AND level = ?`,
      [data.categoryId, data.sessionId, data.level]
    );

    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      // Update existing schedule
      if (this.db.drizzle) {
        try {
          await this.db.drizzle
            .update(schema.feeSchedules)
            .set({
              amountKobo: data.amountKobo,
              ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
            })
            .where(eq(schema.feeSchedules.id, existing.id));
        } catch {
          // Fallback
        }
      }

      await this.db.execute(
        `UPDATE fee_schedules SET amount_kobo = ?, due_date = COALESCE(?, due_date) WHERE id = ?`,
        [data.amountKobo, data.dueDate || null, existing.id]
      );

      const feeSchedule = (await this.getFeeScheduleById(existing.id))!;
      await this.auditService.logAdminAction({
        actorUserId: 'system-admin',
        action: 'UPDATE_FEE_SCHEDULE',
        entityName: 'fee_schedules',
        entityId: existing.id,
        newValue: { amountKobo: data.amountKobo, dueDate: data.dueDate, level: data.level },
      });
      return feeSchedule;
    } else {
      // Create new schedule
      const id = `fs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      if (this.db.drizzle) {
        try {
          const res = await this.db.drizzle
            .insert(schema.feeSchedules)
            .values({
              id,
              categoryId: data.categoryId,
              sessionId: data.sessionId,
              level: data.level,
              amountKobo: data.amountKobo,
              dueDate: data.dueDate || null,
              createdAt: now,
            })
            .returning();
          if (res && res.length > 0) {
            const feeSchedule = (await this.getFeeScheduleById(id))!;
            await this.auditService.logAdminAction({
              actorUserId: 'system-admin',
              action: 'CREATE_FEE_SCHEDULE',
              entityName: 'fee_schedules',
              entityId: id,
              newValue: { amountKobo: data.amountKobo, level: data.level, categoryId: data.categoryId },
            });
            return feeSchedule;
          }
        } catch {
          // Fallback
        }
      }

      await this.db.execute(
        `INSERT INTO fee_schedules (id, category_id, session_id, level, amount_kobo, due_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, data.categoryId, data.sessionId, data.level, data.amountKobo, data.dueDate || null, now]
      );

      const feeSchedule = (await this.getFeeScheduleById(id))!;
      await this.auditService.logAdminAction({
        actorUserId: 'system-admin',
        action: 'CREATE_FEE_SCHEDULE',
        entityName: 'fee_schedules',
        entityId: id,
        newValue: { amountKobo: data.amountKobo, level: data.level, categoryId: data.categoryId },
      });
      return feeSchedule;
    }
  }

  /**
   * Set fee price using Nigerian Naira, safely converted to integer Kobo
   */
  async setFeePriceInNaira(data: {
    categoryId: string;
    sessionId: string;
    level: number;
    amountNaira: number;
    dueDate?: string;
  }): Promise<FeeScheduleItem> {
    const amountKobo = LedgerEngine.nairaToKobo(data.amountNaira);
    return await this.setFeePrice({
      categoryId: data.categoryId,
      sessionId: data.sessionId,
      level: data.level,
      amountKobo,
      dueDate: data.dueDate,
    });
  }

  async updateFeeSchedule(
    id: string,
    data: Partial<{
      amountKobo: number;
      amountNaira: number;
      dueDate: string | null;
      level: number;
    }>
  ): Promise<FeeScheduleItem> {
    const existing = await this.getFeeScheduleById(id);
    if (!existing) {
      throw new Error(`FeeSchedule with ID ${id} not found`);
    }

    let finalAmountKobo = existing.amountKobo;

    if (data.amountNaira !== undefined) {
      finalAmountKobo = LedgerEngine.nairaToKobo(data.amountNaira);
    } else if (data.amountKobo !== undefined) {
      this.validateKoboAmount(data.amountKobo);
      finalAmountKobo = data.amountKobo;
    }

    if (this.db.drizzle) {
      try {
        await this.db.drizzle
          .update(schema.feeSchedules)
          .set({
            amountKobo: finalAmountKobo,
            ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
            ...(data.level !== undefined && { level: data.level }),
          })
          .where(eq(schema.feeSchedules.id, id));
      } catch {
        // Fallback
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.amountKobo !== undefined || data.amountNaira !== undefined) {
      updates.push('amount_kobo = ?');
      params.push(finalAmountKobo);
    }
    if (data.dueDate !== undefined) {
      updates.push('due_date = ?');
      params.push(data.dueDate);
    }
    if (data.level !== undefined) {
      updates.push('level = ?');
      params.push(data.level);
    }

    if (updates.length > 0) {
      params.push(id);
      await this.db.execute(`UPDATE fee_schedules SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    return (await this.getFeeScheduleById(id))!;
  }

  async deleteFeeSchedule(id: string): Promise<boolean> {
    const existing = await this.getFeeScheduleById(id);
    if (this.db.drizzle) {
      try {
        await this.db.drizzle.delete(schema.feeSchedules).where(eq(schema.feeSchedules.id, id));
      } catch {
        // Fallback
      }
    }
    const res = await this.db.execute(`DELETE FROM fee_schedules WHERE id = ?`, [id]);
    const success = (res.rowsAffected ?? 0) > 0;
    if (success && existing) {
      await this.auditService.logAdminAction({
        actorUserId: 'system-admin',
        action: 'DELETE_FEE_SCHEDULE',
        entityName: 'fee_schedules',
        entityId: id,
        oldValue: { amountKobo: existing.amountKobo, categoryId: existing.categoryId },
      });
    }
    return success;
  }

  async getFeeScheduleById(id: string): Promise<FeeScheduleItem | null> {
    const row = await this.db.queryFirst<any>(
      `SELECT fs.id, fs.category_id as categoryId, fs.session_id as sessionId, fs.level,
              fs.amount_kobo as amountKobo, fs.due_date as dueDate, fs.created_at as createdAt,
              fc.name as categoryName, fc.code as categoryCode, fc.division_id as divisionId,
              s.name as sessionName
       FROM fee_schedules fs
       LEFT JOIN fee_categories fc ON fs.category_id = fc.id
       LEFT JOIN academic_sessions s ON fs.session_id = s.id
       WHERE fs.id = ?`,
      [id]
    );

    if (!row) return null;

    return {
      ...row,
      formattedAmount: LedgerEngine.koboToNaira(row.amountKobo),
    };
  }

  async listFeeSchedules(filters?: {
    sessionId?: string;
    categoryId?: string;
    level?: number;
    divisionId?: string;
  }): Promise<FeeScheduleItem[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.sessionId) {
      conditions.push('fs.session_id = ?');
      params.push(filters.sessionId);
    }
    if (filters?.categoryId) {
      conditions.push('fs.category_id = ?');
      params.push(filters.categoryId);
    }
    if (filters?.level) {
      conditions.push('fs.level = ?');
      params.push(filters.level);
    }
    if (filters?.divisionId) {
      conditions.push('fc.division_id = ?');
      params.push(filters.divisionId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await this.db.query<any>(
      `SELECT fs.id, fs.category_id as categoryId, fs.session_id as sessionId, fs.level,
              fs.amount_kobo as amountKobo, fs.due_date as dueDate, fs.created_at as createdAt,
              fc.name as categoryName, fc.code as categoryCode, fc.division_id as divisionId,
              s.name as sessionName
       FROM fee_schedules fs
       LEFT JOIN fee_categories fc ON fs.category_id = fc.id
       LEFT JOIN academic_sessions s ON fs.session_id = s.id
       ${whereClause}
       ORDER BY fc.name ASC, fs.level ASC`,
      params
    );

    return rows.map(r => ({
      ...r,
      formattedAmount: LedgerEngine.koboToNaira(r.amountKobo),
    }));
  }
}
