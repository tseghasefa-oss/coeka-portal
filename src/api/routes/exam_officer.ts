import { Hono } from 'hono';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { requireAuth, requireRole } from '../middleware/rbac';
import { ExamOfficerService } from '../../services/academic/examService';
import * as Sentry from '@sentry/cloudflare';
import { examOfficerBreadcrumb } from '../../lib/sentryBreadcrumbs';

export const examOfficerRoutes = new Hono<{ Bindings: Env }>();

// All Exam Officer endpoints are strictly guarded
examOfficerRoutes.use('*', requireAuth, requireRole(['EXAM_OFFICER', 'SUPER_ADMIN', 'ADMIN', 'DEAN']));

/**
 * GET /api/exam-officer/stats
 * Overview KPIs for Examination Officer Broadsheet Hub
 */
examOfficerRoutes.get('/stats', async (c) => {
  const container = getContainer(c.env);
  const service = new ExamOfficerService(container.db);

  try {
    const stats = await service.getExamOfficerStats();
    return c.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch examination statistics' }, 500);
  }
});

/**
 * GET /api/exam-officer/broadsheet
 * Compile master session broadsheet for a department and level.
 * Strictly excludes unapproved draft results from GPA/CGPA.
 */
examOfficerRoutes.get('/broadsheet', async (c) => {
  const container = getContainer(c.env);
  const service = new ExamOfficerService(container.db);
  const user = c.get('user');

  const departmentId = c.req.query('departmentId') || 'dept-csc';
  const levelParam = c.req.query('level') || '100';
  const session = c.req.query('session');
  const level = parseInt(levelParam, 10) || 100;

  Sentry.addBreadcrumb(examOfficerBreadcrumb('broadsheet_compile_start', { departmentId, level, session }));

  try {
    const broadsheet = await service.compileBroadsheet(
      departmentId,
      level,
      session,
      user?.userId || 'usr-admin-001'
    );
    Sentry.addBreadcrumb(examOfficerBreadcrumb('broadsheet_compile_success', { departmentId, level }));
    return c.json(broadsheet, 200);
  } catch (error: any) {
    Sentry.captureException(error, { tags: { route: 'exam-officer/broadsheet', departmentId, level: String(level) } });
    return c.json({ error: error.message || 'Failed to compile examination broadsheet' }, 400);
  }
});

/**
 * POST /api/exam-officer/broadsheet/certify
 * Lock and certify an official broadsheet
 */
examOfficerRoutes.post('/broadsheet/certify', async (c) => {
  const container = getContainer(c.env);
  const service = new ExamOfficerService(container.db);
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { broadsheetId } = body;
    if (!broadsheetId) {
      return c.json({ error: 'broadsheetId is required' }, 400);
    }

    const result = await service.certifyBroadsheet(
      broadsheetId,
      user?.userId || 'usr-admin-001'
    );
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to certify broadsheet' }, 400);
  }
});

/**
 * GET /api/exam-officer/probation
 * Query all students currently flagged for academic probation (CGPA < 1.50) or carry-overs
 */
examOfficerRoutes.get('/probation', async (c) => {
  const container = getContainer(c.env);
  const service = new ExamOfficerService(container.db);

  const departmentId = c.req.query('departmentId');
  const sessionId = c.req.query('session');

  try {
    const students = await service.flagProbationStudents(departmentId, sessionId);
    return c.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to retrieve academic probation records' }, 500);
  }
});

/**
 * POST /api/exam-officer/probation/:studentId/warn
 * Dispatch formal academic probation warning to student
 */
examOfficerRoutes.post('/probation/:studentId/warn', async (c) => {
  const container = getContainer(c.env);
  const service = new ExamOfficerService(container.db);
  const user = c.get('user');
  const studentId = c.req.param('studentId');

  try {
    let sessionId: string | undefined;
    try {
      const body = await c.req.json();
      sessionId = body?.sessionId;
    } catch {
      // Optional body
    }

    const result = await service.sendProbationWarning(
      studentId,
      user?.userId || 'usr-admin-001',
      sessionId
    );
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to issue academic probation warning' }, 400);
  }
});

/**
 * GET /api/exam-officer/graduation
 * Generate graduation eligibility list for final year students
 */
examOfficerRoutes.get('/graduation', async (c) => {
  const container = getContainer(c.env);
  const service = new ExamOfficerService(container.db);

  const departmentId = c.req.query('departmentId');
  const sessionId = c.req.query('session');

  try {
    const list = await service.generateGraduationList(departmentId, sessionId);
    return c.json(list, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to generate graduation eligibility list' }, 500);
  }
});

/**
 * GET /api/exam-officer/students/:studentId/final-cgpa
 * The "Final Word" calculation determining degree/diploma qualification
 */
examOfficerRoutes.get('/students/:studentId/final-cgpa', async (c) => {
  const container = getContainer(c.env);
  const service = new ExamOfficerService(container.db);
  const studentId = c.req.param('studentId');

  try {
    const audit = await service.calculateFinalCGPA(studentId);
    return c.json(audit, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to audit student final CGPA' }, 400);
  }
});
