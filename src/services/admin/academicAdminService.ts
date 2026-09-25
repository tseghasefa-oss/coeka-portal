import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { schema } from '../../database/client';
import { eq, and } from 'drizzle-orm';
import { AuditService } from './auditService';

export interface DepartmentItem {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  hodStaffId: string | null;
  createdAt: number;
}

export interface CourseItem {
  id: string;
  programmeId: string;
  code: string;
  title: string;
  creditUnits: number;
  level: number;
  semesterTerm: number;
  isCompulsory: boolean;
  prerequisiteCourseId: string | null;
  createdAt: number;
}

export interface FacultyCourseAllocationItem {
  id: string;
  staffId: string;
  courseId: string;
  semesterId: string;
  role: string;
}

export class AcademicAdminService {
  private auditService: AuditService;

  constructor(private db: IDatabaseProvider, auditService?: AuditService) {
    this.auditService = auditService || new AuditService(db);
  }

  // -------------------------------------------------------------
  // Department Management
  // -------------------------------------------------------------

  async createDepartment(data: {
    schoolId: string;
    name: string;
    code: string;
    hodStaffId?: string;
  }): Promise<DepartmentItem> {
    const id = `dept-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = Math.floor(Date.now() / 1000);

    if (this.db.drizzle) {
      try {
        const res = await this.db.drizzle
          .insert(schema.departments)
          .values({
            id,
            schoolId: data.schoolId,
            name: data.name,
            code: data.code.toUpperCase(),
            hodStaffId: data.hodStaffId || null,
            createdAt: now,
          })
          .returning();
        if (res && res.length > 0) return res[0] as DepartmentItem;
      } catch (err: any) {
        // Fallback to raw SQL execution if returning not supported
      }
    }

    await this.db.execute(
      `INSERT INTO departments (id, school_id, name, code, hod_staff_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.schoolId, data.name, data.code.toUpperCase(), data.hodStaffId || null, now]
    );

    return {
      id,
      schoolId: data.schoolId,
      name: data.name,
      code: data.code.toUpperCase(),
      hodStaffId: data.hodStaffId || null,
      createdAt: now,
    };
  }

  async updateDepartment(
    id: string,
    data: Partial<{
      schoolId: string;
      name: string;
      code: string;
      hodStaffId: string | null;
    }>
  ): Promise<DepartmentItem> {
    const existing = await this.getDepartmentById(id);
    if (!existing) {
      throw new Error(`Department with ID ${id} not found`);
    }

    if (this.db.drizzle) {
      try {
        await this.db.drizzle
          .update(schema.departments)
          .set({
            ...(data.schoolId && { schoolId: data.schoolId }),
            ...(data.name && { name: data.name }),
            ...(data.code && { code: data.code.toUpperCase() }),
            ...(data.hodStaffId !== undefined && { hodStaffId: data.hodStaffId }),
          })
          .where(eq(schema.departments.id, id));
      } catch {
        // Fallback to raw SQL
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.schoolId) {
      updates.push('school_id = ?');
      params.push(data.schoolId);
    }
    if (data.name) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.code) {
      updates.push('code = ?');
      params.push(data.code.toUpperCase());
    }
    if (data.hodStaffId !== undefined) {
      updates.push('hod_staff_id = ?');
      params.push(data.hodStaffId);
    }

    if (updates.length > 0) {
      params.push(id);
      await this.db.execute(`UPDATE departments SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    return (await this.getDepartmentById(id))!;
  }

  async deleteDepartment(id: string): Promise<boolean> {
    if (this.db.drizzle) {
      try {
        await this.db.drizzle.delete(schema.departments).where(eq(schema.departments.id, id));
      } catch {
        // Fallback
      }
    }
    const res = await this.db.execute(`DELETE FROM departments WHERE id = ?`, [id]);
    return (res.rowsAffected ?? 0) > 0;
  }

  async getDepartmentById(id: string): Promise<DepartmentItem | null> {
    return await this.db.queryFirst<DepartmentItem>(`SELECT id, school_id as schoolId, name, code, hod_staff_id as hodStaffId, created_at as createdAt FROM departments WHERE id = ?`, [id]);
  }

  async listDepartments(schoolId?: string): Promise<DepartmentItem[]> {
    if (schoolId) {
      return await this.db.query<DepartmentItem>(
        `SELECT id, school_id as schoolId, name, code, hod_staff_id as hodStaffId, created_at as createdAt FROM departments WHERE school_id = ? ORDER BY name ASC`,
        [schoolId]
      );
    }
    return await this.db.query<DepartmentItem>(
      `SELECT id, school_id as schoolId, name, code, hod_staff_id as hodStaffId, created_at as createdAt FROM departments ORDER BY name ASC`
    );
  }

  // -------------------------------------------------------------
  // Course Management
  // -------------------------------------------------------------

  async createCourse(data: {
    programmeId: string;
    code: string;
    title: string;
    creditUnits: number;
    level: number;
    semesterTerm: number;
    isCompulsory?: boolean;
    prerequisiteCourseId?: string;
  }): Promise<CourseItem> {
    if (data.creditUnits <= 0) {
      throw new Error(`Credit units must be positive: received ${data.creditUnits}`);
    }
    if (data.level <= 0) {
      throw new Error(`Level must be positive: received ${data.level}`);
    }

    const id = `crs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = Math.floor(Date.now() / 1000);
    const isCompulsory = data.isCompulsory !== undefined ? (data.isCompulsory ? 1 : 0) : 1;

    if (this.db.drizzle) {
      try {
        const res = await this.db.drizzle
          .insert(schema.courses)
          .values({
            id,
            programmeId: data.programmeId,
            code: data.code.toUpperCase(),
            title: data.title,
            creditUnits: data.creditUnits,
            level: data.level,
            semesterTerm: data.semesterTerm,
            isCompulsory,
            prerequisiteCourseId: data.prerequisiteCourseId || null,
            createdAt: now,
          })
          .returning();
        if (res && res.length > 0) {
          const row = res[0];
          return {
            id: row.id,
            programmeId: row.programmeId,
            code: row.code,
            title: row.title,
            creditUnits: row.creditUnits,
            level: row.level,
            semesterTerm: row.semesterTerm,
            isCompulsory: Boolean(row.isCompulsory),
            prerequisiteCourseId: row.prerequisiteCourseId,
            createdAt: row.createdAt,
          };
        }
      } catch {
        // Fallback
      }
    }

    await this.db.execute(
      `INSERT INTO courses (id, programme_id, code, title, credit_units, level, semester_term, is_compulsory, prerequisite_course_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.programmeId,
        data.code.toUpperCase(),
        data.title,
        data.creditUnits,
        data.level,
        data.semesterTerm,
        isCompulsory,
        data.prerequisiteCourseId || null,
        now,
      ]
    );

    const courseItem: CourseItem = {
      id,
      programmeId: data.programmeId,
      code: data.code.toUpperCase(),
      title: data.title,
      creditUnits: data.creditUnits,
      level: data.level,
      semesterTerm: data.semesterTerm,
      isCompulsory: Boolean(isCompulsory),
      prerequisiteCourseId: data.prerequisiteCourseId || null,
      createdAt: now,
    };

    await this.auditService.logAdminAction({
      actorUserId: 'system-admin',
      action: 'CREATE_COURSE',
      entityName: 'courses',
      entityId: id,
      newValue: {
        code: data.code.toUpperCase(),
        title: data.title,
        creditUnits: data.creditUnits,
        level: data.level,
        programmeId: data.programmeId,
      },
    });

    return courseItem;
  }

  async updateCourse(
    id: string,
    data: Partial<{
      programmeId: string;
      code: string;
      title: string;
      creditUnits: number;
      level: number;
      semesterTerm: number;
      isCompulsory: boolean;
      prerequisiteCourseId: string | null;
    }>
  ): Promise<CourseItem> {
    const existing = await this.getCourseById(id);
    if (!existing) {
      throw new Error(`Course with ID ${id} not found`);
    }

    if (data.creditUnits !== undefined && data.creditUnits <= 0) {
      throw new Error(`Credit units must be positive`);
    }

    if (this.db.drizzle) {
      try {
        await this.db.drizzle
          .update(schema.courses)
          .set({
            ...(data.programmeId && { programmeId: data.programmeId }),
            ...(data.code && { code: data.code.toUpperCase() }),
            ...(data.title && { title: data.title }),
            ...(data.creditUnits !== undefined && { creditUnits: data.creditUnits }),
            ...(data.level !== undefined && { level: data.level }),
            ...(data.semesterTerm !== undefined && { semesterTerm: data.semesterTerm }),
            ...(data.isCompulsory !== undefined && { isCompulsory: data.isCompulsory ? 1 : 0 }),
            ...(data.prerequisiteCourseId !== undefined && { prerequisiteCourseId: data.prerequisiteCourseId }),
          })
          .where(eq(schema.courses.id, id));
      } catch {
        // Fallback
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.programmeId) {
      updates.push('programme_id = ?');
      params.push(data.programmeId);
    }
    if (data.code) {
      updates.push('code = ?');
      params.push(data.code.toUpperCase());
    }
    if (data.title) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.creditUnits !== undefined) {
      updates.push('credit_units = ?');
      params.push(data.creditUnits);
    }
    if (data.level !== undefined) {
      updates.push('level = ?');
      params.push(data.level);
    }
    if (data.semesterTerm !== undefined) {
      updates.push('semester_term = ?');
      params.push(data.semesterTerm);
    }
    if (data.isCompulsory !== undefined) {
      updates.push('is_compulsory = ?');
      params.push(data.isCompulsory ? 1 : 0);
    }
    if (data.prerequisiteCourseId !== undefined) {
      updates.push('prerequisite_course_id = ?');
      params.push(data.prerequisiteCourseId);
    }

    if (updates.length > 0) {
      params.push(id);
      await this.db.execute(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    return (await this.getCourseById(id))!;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const existing = await this.getCourseById(id);
    if (this.db.drizzle) {
      try {
        await this.db.drizzle.delete(schema.courses).where(eq(schema.courses.id, id));
      } catch {
        // Fallback
      }
    }
    const res = await this.db.execute(`DELETE FROM courses WHERE id = ?`, [id]);
    const success = (res.rowsAffected ?? 0) > 0;
    if (success && existing) {
      await this.auditService.logAdminAction({
        actorUserId: 'system-admin',
        action: 'DELETE_COURSE',
        entityName: 'courses',
        entityId: id,
        oldValue: { code: existing.code, title: existing.title },
      });
    }
    return success;
  }

  async getCourseById(id: string): Promise<CourseItem | null> {
    const row = await this.db.queryFirst<any>(
      `SELECT id, programme_id as programmeId, code, title, credit_units as creditUnits,
              level, semester_term as semesterTerm, is_compulsory as isCompulsory,
              prerequisite_course_id as prerequisiteCourseId, created_at as createdAt
       FROM courses WHERE id = ?`,
      [id]
    );
    if (!row) return null;
    return {
      ...row,
      isCompulsory: Boolean(row.isCompulsory),
    };
  }

  async listCourses(filters?: {
    programmeId?: string;
    level?: number;
    semesterTerm?: number;
  }): Promise<CourseItem[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.programmeId) {
      conditions.push('programme_id = ?');
      params.push(filters.programmeId);
    }
    if (filters?.level) {
      conditions.push('level = ?');
      params.push(filters.level);
    }
    if (filters?.semesterTerm) {
      conditions.push('semester_term = ?');
      params.push(filters.semesterTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await this.db.query<any>(
      `SELECT id, programme_id as programmeId, code, title, credit_units as creditUnits,
              level, semester_term as semesterTerm, is_compulsory as isCompulsory,
              prerequisite_course_id as prerequisiteCourseId, created_at as createdAt
       FROM courses ${whereClause} ORDER BY code ASC`,
      params
    );

    return rows.map(r => ({
      ...r,
      isCompulsory: Boolean(r.isCompulsory),
    }));
  }

  // -------------------------------------------------------------
  // Course-to-Faculty Mappings
  // -------------------------------------------------------------

  async assignCourseToFaculty(data: {
    staffId: string;
    courseId: string;
    semesterId: string;
    role?: 'PRIMARY_LECTURER' | 'ASSISTANT_LECTURER' | 'TUTOR';
  }): Promise<FacultyCourseAllocationItem> {
    const id = `sca-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const role = data.role || 'PRIMARY_LECTURER';

    if (this.db.drizzle) {
      try {
        const res = await this.db.drizzle
          .insert(schema.staffCourseAllocations)
          .values({
            id,
            staffId: data.staffId,
            courseId: data.courseId,
            semesterId: data.semesterId,
            role,
          })
          .returning();
        if (res && res.length > 0) return res[0] as FacultyCourseAllocationItem;
      } catch {
        // Fallback
      }
    }

    await this.db.execute(
      `INSERT INTO staff_course_allocations (id, staff_id, course_id, semester_id, role)
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.staffId, data.courseId, data.semesterId, role]
    );

    return {
      id,
      staffId: data.staffId,
      courseId: data.courseId,
      semesterId: data.semesterId,
      role,
    };
  }

  async removeCourseFromFaculty(allocationId: string): Promise<boolean> {
    if (this.db.drizzle) {
      try {
        await this.db.drizzle.delete(schema.staffCourseAllocations).where(eq(schema.staffCourseAllocations.id, allocationId));
      } catch {
        // Fallback
      }
    }
    const res = await this.db.execute(`DELETE FROM staff_course_allocations WHERE id = ?`, [allocationId]);
    return (res.rowsAffected ?? 0) > 0;
  }

  async listFacultyCourseAllocations(filters?: {
    staffId?: string;
    courseId?: string;
    semesterId?: string;
  }): Promise<FacultyCourseAllocationItem[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.staffId) {
      conditions.push('staff_id = ?');
      params.push(filters.staffId);
    }
    if (filters?.courseId) {
      conditions.push('course_id = ?');
      params.push(filters.courseId);
    }
    if (filters?.semesterId) {
      conditions.push('semester_id = ?');
      params.push(filters.semesterId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return await this.db.query<FacultyCourseAllocationItem>(
      `SELECT id, staff_id as staffId, course_id as courseId, semester_id as semesterId, role
       FROM staff_course_allocations ${whereClause}`,
      params
    );
  }
}
