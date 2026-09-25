import { Hono } from 'hono';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { requireAuth, requireRole } from '../middleware/rbac';
import { AcademicAdminService } from '../../services/admin/academicAdminService';
import { FinanceAdminService } from '../../services/admin/financeAdminService';
import { SystemAdminService } from '../../services/admin/systemAdminService';
import { UserAdminService } from '../../services/admin/userAdminService';
import { AuditService } from '../../services/admin/auditService';
import { PromotionService } from '../../services/academic/promotionService';
import { SessionBillingService } from '../../services/finance/sessionBillingService';

export const adminRoutes = new Hono<{ Bindings: Env }>();

// Enforce authentication & RBAC on all admin routes
adminRoutes.use('*', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']));

// =============================================================
// 1. ACADEMIC MANAGEMENT (Courses, Departments, Faculty Allocations)
// =============================================================

// List Courses
adminRoutes.get('/courses', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicAdminService(container.db);

  const programmeId = c.req.query('programmeId');
  const level = c.req.query('level') ? parseInt(c.req.query('level')!, 10) : undefined;
  const semesterTerm = c.req.query('semesterTerm') ? parseInt(c.req.query('semesterTerm')!, 10) : undefined;

  const courses = await service.listCourses({ programmeId, level, semesterTerm });
  return c.json({ courses });
});

// Create Course
adminRoutes.post('/courses', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicAdminService(container.db);
  const body = await c.req.json();

  if (!body.programmeId || !body.code || !body.title || body.creditUnits === undefined || body.level === undefined || body.semesterTerm === undefined) {
    return c.json({
      error: 'Validation Error: Required fields: programmeId, code, title, creditUnits, level, semesterTerm',
    }, 400);
  }

  try {
    const course = await service.createCourse({
      programmeId: body.programmeId,
      code: body.code,
      title: body.title,
      creditUnits: Number(body.creditUnits),
      level: Number(body.level),
      semesterTerm: Number(body.semesterTerm),
      isCompulsory: body.isCompulsory !== undefined ? Boolean(body.isCompulsory) : true,
      prerequisiteCourseId: body.prerequisiteCourseId,
    });

    return c.json({
      message: 'Course created successfully',
      course,
    }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// Update Course
adminRoutes.patch('/courses/:id', async (c) => {
  const id = c.req.param('id');
  const container = getContainer(c.env);
  const service = new AcademicAdminService(container.db);
  const body = await c.req.json();

  try {
    const course = await service.updateCourse(id, {
      ...(body.programmeId && { programmeId: body.programmeId }),
      ...(body.code && { code: body.code }),
      ...(body.title && { title: body.title }),
      ...(body.creditUnits !== undefined && { creditUnits: Number(body.creditUnits) }),
      ...(body.level !== undefined && { level: Number(body.level) }),
      ...(body.semesterTerm !== undefined && { semesterTerm: Number(body.semesterTerm) }),
      ...(body.isCompulsory !== undefined && { isCompulsory: Boolean(body.isCompulsory) }),
      ...(body.prerequisiteCourseId !== undefined && { prerequisiteCourseId: body.prerequisiteCourseId }),
    });

    return c.json({
      message: 'Course updated successfully',
      course,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 404);
  }
});

// Delete Course
adminRoutes.delete('/courses/:id', async (c) => {
  const id = c.req.param('id');
  const container = getContainer(c.env);
  const service = new AcademicAdminService(container.db);

  const deleted = await service.deleteCourse(id);
  if (!deleted) {
    return c.json({ error: `Course ${id} not found or could not be deleted` }, 404);
  }

  return c.json({ message: 'Course deleted successfully', courseId: id });
});

// Assign Course to Faculty
adminRoutes.post('/courses/assign', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicAdminService(container.db);
  const body = await c.req.json();

  if (!body.staffId || !body.courseId || !body.semesterId) {
    return c.json({ error: 'Validation Error: staffId, courseId, and semesterId are required' }, 400);
  }

  try {
    const allocation = await service.assignCourseToFaculty({
      staffId: body.staffId,
      courseId: body.courseId,
      semesterId: body.semesterId,
      role: body.role,
    });

    return c.json({
      message: 'Course assigned to faculty member successfully',
      allocation,
    }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// Department Management Endpoints
adminRoutes.get('/departments', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicAdminService(container.db);
  const schoolId = c.req.query('schoolId');
  const departments = await service.listDepartments(schoolId);
  return c.json({ departments });
});

adminRoutes.post('/departments', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicAdminService(container.db);
  const body = await c.req.json();

  if (!body.schoolId || !body.name || !body.code) {
    return c.json({ error: 'Validation Error: schoolId, name, and code are required' }, 400);
  }

  try {
    const department = await service.createDepartment({
      schoolId: body.schoolId,
      name: body.name,
      code: body.code,
      hodStaffId: body.hodStaffId,
    });
    return c.json({ message: 'Department created successfully', department }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

adminRoutes.patch('/departments/:id', async (c) => {
  const id = c.req.param('id');
  const container = getContainer(c.env);
  const service = new AcademicAdminService(container.db);
  const body = await c.req.json();

  try {
    const department = await service.updateDepartment(id, body);
    return c.json({ message: 'Department updated successfully', department });
  } catch (err: any) {
    return c.json({ error: err.message }, 404);
  }
});

// =============================================================
// 2. FINANCIAL PRICE SETTING (Fee Schedules & Tariffs)
// =============================================================

// List Fee Schedules & Categories
adminRoutes.get('/fees', async (c) => {
  const container = getContainer(c.env);
  const service = new FinanceAdminService(container.db);

  const sessionId = c.req.query('sessionId');
  const categoryId = c.req.query('categoryId');
  const level = c.req.query('level') ? parseInt(c.req.query('level')!, 10) : undefined;
  const divisionId = c.req.query('divisionId');

  const [feeSchedules, feeCategories] = await Promise.all([
    service.listFeeSchedules({ sessionId, categoryId, level, divisionId }),
    service.listFeeCategories(divisionId),
  ]);

  return c.json({ feeSchedules, feeCategories });
});

// Set Fee Schedule Price (Strict Kobo-Integer or Naira-Converted)
adminRoutes.post('/fees', async (c) => {
  const container = getContainer(c.env);
  const service = new FinanceAdminService(container.db);
  const body = await c.req.json();

  if (!body.categoryId || !body.sessionId || body.level === undefined) {
    return c.json({ error: 'Validation Error: categoryId, sessionId, and level are required' }, 400);
  }

  if (body.amountKobo === undefined && body.amountNaira === undefined) {
    return c.json({ error: 'Validation Error: Either amountKobo or amountNaira must be provided' }, 400);
  }

  try {
    let feeSchedule;
    if (body.amountNaira !== undefined) {
      feeSchedule = await service.setFeePriceInNaira({
        categoryId: body.categoryId,
        sessionId: body.sessionId,
        level: Number(body.level),
        amountNaira: Number(body.amountNaira),
        dueDate: body.dueDate,
      });
    } else {
      feeSchedule = await service.setFeePrice({
        categoryId: body.categoryId,
        sessionId: body.sessionId,
        level: Number(body.level),
        amountKobo: Number(body.amountKobo),
        dueDate: body.dueDate,
      });
    }

    return c.json({
      message: 'Fee schedule price set successfully',
      feeSchedule,
    }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// Update Existing Fee Schedule Price
adminRoutes.patch('/fees/:id', async (c) => {
  const id = c.req.param('id');
  const container = getContainer(c.env);
  const service = new FinanceAdminService(container.db);
  const body = await c.req.json();

  try {
    const feeSchedule = await service.updateFeeSchedule(id, {
      ...(body.amountKobo !== undefined && { amountKobo: Number(body.amountKobo) }),
      ...(body.amountNaira !== undefined && { amountNaira: Number(body.amountNaira) }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
      ...(body.level !== undefined && { level: Number(body.level) }),
    });

    return c.json({
      message: 'Fee schedule updated successfully',
      feeSchedule,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// Delete Fee Schedule
adminRoutes.delete('/fees/:id', async (c) => {
  const id = c.req.param('id');
  const container = getContainer(c.env);
  const service = new FinanceAdminService(container.db);

  const deleted = await service.deleteFeeSchedule(id);
  if (!deleted) {
    return c.json({ error: `Fee schedule ${id} not found or could not be deleted` }, 404);
  }

  return c.json({ message: 'Fee schedule deleted successfully', feeScheduleId: id });
});

// =============================================================
// 3. USER MANAGEMENT & ACCESS CONTROL
// =============================================================

// List Users with Filters
adminRoutes.get('/users', async (c) => {
  const container = getContainer(c.env);
  const service = new UserAdminService(container.db);

  const role = c.req.query('role');
  const division = c.req.query('division');
  const search = c.req.query('search');
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : undefined;

  const users = await service.listUsers({ role, division, search, limit });
  return c.json({ users });
});

// Promote User to Admin / Super Admin
adminRoutes.patch('/users/:id/promote', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const container = getContainer(c.env);
  const service = new UserAdminService(container.db);
  const body = await c.req.json();

  const newRole = body.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

  try {
    const updatedUser = await service.promoteUser(id, newRole, user?.username || 'admin');
    return c.json({
      message: `User ${updatedUser.name} has been promoted to ${newRole}`,
      user: updatedUser,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// Suspend / Activate User Account
adminRoutes.patch('/users/:id/status', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const container = getContainer(c.env);
  const service = new UserAdminService(container.db);
  const body = await c.req.json();

  if (body.isActive === undefined) {
    return c.json({ error: 'Validation Error: isActive (boolean) is required' }, 400);
  }

  try {
    const result = await service.setUserStatus(id, Boolean(body.isActive), user?.username || 'admin');
    return c.json({
      message: `User account ${result.isActive ? 'activated' : 'suspended'} successfully`,
      ...result,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// Reset User Password
adminRoutes.post('/users/:id/reset-password', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const container = getContainer(c.env);
  const service = new UserAdminService(container.db);

  try {
    const result = await service.resetPassword(id, user?.username || 'admin');
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// =============================================================
// 4. CRYPTOGRAPHIC AUDIT TRAIL
// =============================================================

// Get Cryptographic Audit Logs
adminRoutes.get('/audit', async (c) => {
  const container = getContainer(c.env);
  const service = new AuditService(container.db);
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 50;

  const logs = await service.getAuditLogs(limit);
  return c.json({ auditLogs: logs });
});

// Verify Cryptographic Signature of an Audit Log
adminRoutes.post('/audit/verify/:id', async (c) => {
  const id = c.req.param('id');
  const container = getContainer(c.env);
  const service = new AuditService(container.db);

  const verification = await service.verifyAuditLog(id);
  return c.json(verification);
});

// =============================================================
// 5. SYSTEM CONFIGURATION & INSTITUTIONAL SETTINGS
// =============================================================

// Get System Settings, Portal Controls, Academic Calendar, & Maintenance Mode
adminRoutes.get('/settings', async (c) => {
  const container = getContainer(c.env);
  const service = new SystemAdminService(container.db);
  const category = c.req.query('category');

  const [settings, admissionsOpen, regOpen, resultOpen, calendar, maintenanceMode] = await Promise.all([
    service.getSettingsList(category),
    service.getPortalStatus('admissions'),
    service.getPortalStatus('course_registration'),
    service.getPortalStatus('result_upload'),
    service.getAcademicCalendar(),
    service.getMaintenanceMode(),
  ]);

  return c.json({
    settings,
    portalStatus: {
      admissions: admissionsOpen,
      courseRegistration: regOpen,
      resultUpload: resultOpen,
    },
    academicCalendar: calendar,
    maintenanceMode,
  });
});

// Update Settings / Portal Controls / Academic Calendar / Maintenance Mode
adminRoutes.patch('/settings', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const service = new SystemAdminService(container.db);
  const body = await c.req.json();

  const results: any = {};

  // 1. Maintenance Mode Toggle
  if (body.maintenanceMode !== undefined) {
    const mmResult = await service.setMaintenanceMode(
      Boolean(body.maintenanceMode),
      user?.username
    );
    results.maintenanceMode = mmResult.maintenanceMode;
  }

  // 2. Portal Status Switch (e.g., open/close admissions, course reg, result upload)
  if (body.portalModule && body.isOpen !== undefined) {
    const statusResult = await service.setPortalStatus(
      body.portalModule,
      Boolean(body.isOpen),
      user?.username
    );
    results.portalStatus = statusResult;
  }

  // 3. Academic Calendar Update
  if (body.calendarSessionId && body.startDate && body.endDate) {
    const calResult = await service.setAcademicCalendarDates({
      sessionId: body.calendarSessionId,
      startDate: body.startDate,
      endDate: body.endDate,
      examStartDate: body.examStartDate,
      examEndDate: body.examEndDate,
      updatedBy: user?.username,
    });
    results.academicCalendar = calResult;
  }

  // 4. Key-Value Configuration
  if (body.key && body.value !== undefined) {
    await service.setSetting(
      body.key,
      String(body.value),
      body.category || 'GENERAL',
      body.description,
      user?.username
    );
    results.setting = { key: body.key, value: body.value };
  }

  return c.json({
    message: 'System settings updated successfully',
    updated: results,
  });
});

// =============================================================
// 6. STUDENT LIFECYCLE & SESSION PROGRESSION (Promotion, Billing Reset, Onboarding Stats)
// =============================================================

// Batch Student Promotion
adminRoutes.post('/session/promote', async (c) => {
  const container = getContainer(c.env);
  const service = new PromotionService(container.db);
  const body = await c.req.json().catch(() => ({}));

  try {
    const result = await service.promoteAllEligibleStudents({
      divisionCode: body.divisionCode,
      fromLevel: body.fromLevel ? Number(body.fromLevel) : undefined,
    });

    return c.json({
      success: true,
      message: `Batch promotion executed: ${result.promotedCount} promoted, ${result.probationCount} on probation, ${result.graduatedCount} graduated.`,
      result,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// Financial Reset: Apply New Session Fee Matrix
adminRoutes.post('/session/billing-reset', async (c) => {
  const container = getContainer(c.env);
  const service = new SessionBillingService(container.db, container.cache);
  const body = await c.req.json().catch(() => ({}));

  const session = body.newSession || '2027/2028';

  try {
    const result = await service.applySessionFeeMatrix({
      newSession: session,
      divisionCode: body.divisionCode,
      targetLevel: body.targetLevel ? Number(body.targetLevel) : undefined,
    });

    return c.json({
      success: true,
      message: `Session fee matrix applied for ${session}: ${result.totalInvoicesCreated} student invoices generated totaling ${result.formattedTotalBilled}.`,
      result,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// Admissions & Onboarding Lifecycle Statistics
adminRoutes.get('/admissions/stats', async (c) => {
  const container = getContainer(c.env);

  const students = (await container.db.query<any>(
    `SELECT s.id, s.matric_number, s.first_name, s.last_name, s.current_level, s.academic_status, s.state_of_origin, s.date_of_birth, s.passport_photo_url, d.code as divisionCode
     FROM students s
     LEFT JOIN divisions d ON s.division_id = d.id
     ORDER BY s.id DESC`
  )) || [];

  const totalAdmitted = students.length;
  const provisionalCount = students.filter((s) => s.academic_status === 'PROVISIONAL_ADMISSION').length;
  const biodataCompletedCount = students.filter(
    (s) => s.academic_status === 'BIODATA_COMPLETED' || (s.state_of_origin && s.date_of_birth)
  ).length;
  const activeCount = students.filter((s) => s.academic_status === 'ACTIVE').length;

  const acceptanceInvoices =
    (await container.db.query<any>(
      `SELECT * FROM student_invoices WHERE (fee_schedule_id = 'fs-acceptance' OR invoice_number LIKE '%ACC%')`
    )) || [];

  const paidInvoices = acceptanceInvoices.filter((inv) => inv.status === 'PAID');
  const acceptancePaidCount = paidInvoices.length;
  const acceptanceTotalKobo = paidInvoices.reduce((sum, inv) => sum + (inv.amount_paid_kobo || 0), 0);

  const completionPercentage = totalAdmitted > 0 ? Math.round((activeCount / totalAdmitted) * 100) : 0;

  return c.json({
    totalAdmitted,
    provisionalCount,
    biodataCompletedCount,
    activeCount,
    acceptancePaidCount,
    acceptanceTotalKobo,
    completionPercentage,
    students: students.slice(0, 50).map((s) => ({
      id: s.id,
      matricNumber: s.matric_number,
      fullName: `${s.first_name} ${s.last_name}`,
      division: s.divisionCode || 'NCE',
      level: s.current_level || 100,
      academicStatus: s.academic_status || 'PROVISIONAL_ADMISSION',
      hasPassport: Boolean(s.passport_photo_url && !s.passport_photo_url.includes('placeholder')),
      hasBiodata: Boolean(s.state_of_origin && s.date_of_birth),
    })),
  });
});

