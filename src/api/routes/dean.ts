import { Hono } from 'hono';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { requireAuth, requireRole } from '../middleware/rbac';
import { DeanService } from '../../services/academic/deanService';

export const deanRoutes = new Hono<{ Bindings: Env }>();

// 1. Appeal submission can also be used by students
deanRoutes.post('/appeals/submit', async (c) => {
  const container = getContainer(c.env);
  const service = new DeanService(container.db);
  const body = await c.req.json();
  const { studentId, courseId, reason, desiredCorrection } = body;

  try {
    const result = await service.submitAppeal({
      studentId,
      courseId,
      reason,
      desiredCorrection,
    });
    return c.json(result, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to submit grade appeal' }, 400);
  }
});

// All Dean oversight routes below are strictly protected with DEAN / ADMIN / SUPER_ADMIN role requirement
deanRoutes.use('*', requireAuth, requireRole(['DEAN', 'SUPER_ADMIN', 'ADMIN']));

/**
 * GET /api/dean/queue
 * Returns list of courses waiting for Dean review and approval
 */
deanRoutes.get('/queue', async (c) => {
  const container = getContainer(c.env);
  const service = new DeanService(container.db);

  try {
    const queue = await service.getPendingApprovalQueue();
    return c.json({
      success: true,
      count: queue.length,
      queue,
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch approval queue' }, 500);
  }
});

/**
 * GET /api/dean/courses/:courseId/review
 * Review course broadsheet (draft & published results) with metrics and grade distribution
 */
deanRoutes.get('/courses/:courseId/review', async (c) => {
  const container = getContainer(c.env);
  const service = new DeanService(container.db);
  const courseId = c.req.param('courseId');

  try {
    const summary = await service.reviewResults(courseId);
    return c.json(summary);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to review course results' }, 400);
  }
});

/**
 * POST /api/dean/courses/:courseId/approve
 * MASTER SWITCH: Dean approves course results, transitioning them from DRAFT -> PUBLISHED
 */
deanRoutes.post('/courses/:courseId/approve', async (c) => {
  const container = getContainer(c.env);
  const service = new DeanService(container.db);
  const courseId = c.req.param('courseId');
  const user = c.get('user');
  const deanUserId = user?.userId || 'usr-dean-001';

  try {
    let comments = undefined;
    try {
      const body = await c.req.json();
      comments = body?.comments;
    } catch {
      // Body is optional
    }

    const result = await service.approveResults(courseId, deanUserId, comments);
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to approve results' }, 400);
  }
});

/**
 * GET /api/dean/appeals
 * List student grade complaints/appeals
 */
deanRoutes.get('/appeals', async (c) => {
  const container = getContainer(c.env);
  const service = new DeanService(container.db);
  const status = c.req.query('status');
  const courseId = c.req.query('courseId');
  const studentId = c.req.query('studentId');

  try {
    const appeals = await service.listAppeals({ status, courseId, studentId });
    return c.json({
      success: true,
      count: appeals.length,
      appeals,
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to list appeals' }, 500);
  }
});

/**
 * POST /api/dean/appeals/:appealId/resolve
 * Resolve a student grade appeal with score correction or rejection
 */
deanRoutes.post('/appeals/:appealId/resolve', async (c) => {
  const container = getContainer(c.env);
  const service = new DeanService(container.db);
  const appealId = c.req.param('appealId');
  const user = c.get('user');
  const deanUserId = user?.userId || 'usr-dean-001';

  try {
    const body = await c.req.json();
    const { decision, ca1Score, ca2Score, examScore, decisionNotes } = body;

    if (!decision || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
      return c.json({ error: "Validation Error: decision must be 'APPROVED' or 'REJECTED'" }, 400);
    }

    const result = await service.handleAppeal(appealId, decision, deanUserId, {
      ca1Score,
      ca2Score,
      examScore,
      decisionNotes,
    });

    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to resolve appeal' }, 400);
  }
});

/**
 * GET /api/dean/faculty/assignments
 * List faculty allocations and available course/lecturer maps
 */
deanRoutes.get('/faculty/assignments', async (c) => {
  const container = getContainer(c.env);
  const service = new DeanService(container.db);

  try {
    const data = await service.listFacultyAssignments();
    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch faculty assignments' }, 500);
  }
});

/**
 * POST /api/dean/faculty/assign
 * Allocate a lecturer to a course
 */
deanRoutes.post('/faculty/assign', async (c) => {
  const container = getContainer(c.env);
  const service = new DeanService(container.db);

  try {
    const body = await c.req.json();
    const { courseId, staffId, semesterId, role } = body;

    if (!courseId || !staffId) {
      return c.json({ error: 'Validation Error: courseId and staffId are required' }, 400);
    }

    const allocation = await service.manageFacultyAssignments({
      courseId,
      staffId,
      semesterId,
      role,
    });

    return c.json({
      success: true,
      message: `Successfully allocated course ${allocation.courseCode} to faculty staff`,
      allocation,
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to allocate faculty to course' }, 400);
  }
});

/**
 * DELETE /api/dean/faculty/assign/:id
 * Remove a course allocation
 */
deanRoutes.delete('/faculty/assign/:id', async (c) => {
  const container = getContainer(c.env);
  const service = new DeanService(container.db);
  const id = c.req.param('id');

  try {
    await service.unassignFaculty(id);
    return c.json({ success: true, message: 'Faculty allocation removed successfully' });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to remove faculty allocation' }, 400);
  }
});
