import { Hono } from 'hono';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { authenticateSession } from '../middleware/rbac';
import { HostelService } from '../../services/hostels/hostelService';
import { HostelAllocationEngine } from '../../services/hostels/allocationEngine';

export const hostelRoutes = new Hono<{ Bindings: Env }>();

/**
 * 1. Hostel Overview & Real-Time Bed Availability
 * GET /api/hostels/overview
 * GET /api/hostels/rooms (legacy route)
 */
hostelRoutes.get('/overview', async (c) => {
  const container = getContainer(c.env);
  const service = new HostelService(container.db, container.cache);
  const gender = c.req.query('gender');

  try {
    const hostels = await service.getHostelOverview(gender);
    return c.json({ hostels, success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to fetch hostel inventory' }, 500);
  }
});

// Backward compatibility with legacy /rooms route
hostelRoutes.get('/rooms', async (c) => {
  const container = getContainer(c.env);
  const service = new HostelService(container.db, container.cache);
  const gender = c.req.query('gender');

  try {
    const hostels = await service.getHostelOverview(gender);
    const rooms = hostels.flatMap(h => h.rooms);
    return c.json({ rooms, hostels, success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to fetch hostel rooms' }, 500);
  }
});

/**
 * 2. Check Student Reservation / Allocation Status
 * GET /api/hostels/student-status
 */
hostelRoutes.get('/student-status', async (c) => {
  const container = getContainer(c.env);
  const service = new HostelService(container.db, container.cache);
  const user = await authenticateSession(c);

  let studentId = c.req.query('studentId');
  if (!studentId && user?.userId) {
    // Look up student from user ID
    const student = await container.db.queryFirst<{ id: string }>(
      `SELECT id FROM students WHERE user_id = ? LIMIT 1`,
      [user.userId]
    );
    if (student) {
      studentId = student.id;
    }
  }

  // Fallback demo student if none provided
  if (!studentId) {
    const firstStudent = await container.db.queryFirst<{ id: string }>(
      `SELECT id FROM students ORDER BY matric_number ASC LIMIT 1`
    );
    studentId = firstStudent?.id;
  }

  if (!studentId) {
    return c.json({ error: 'No student identifier provided or resolved' }, 400);
  }

  try {
    const status = await service.getStudentStatus(studentId);
    return c.json({ success: true, ...status });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 404);
  }
});

/**
 * 3. Concurrency-Safe 15-Minute Bed Reservation Lock
 * POST /api/hostels/reserve
 */
hostelRoutes.post('/reserve', async (c) => {
  const container = getContainer(c.env);
  const service = new HostelService(container.db, container.cache);
  const user = await authenticateSession(c);

  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON request body' }, 400);
  }

  const { bedspaceId } = body;
  if (!bedspaceId) {
    return c.json({ error: 'bedspaceId is required' }, 400);
  }

  let studentId = body.studentId;
  if (!studentId && user?.userId) {
    const student = await container.db.queryFirst<{ id: string }>(
      `SELECT id FROM students WHERE user_id = ? LIMIT 1`,
      [user.userId]
    );
    if (student) {
      studentId = student.id;
    }
  }

  // Fallback demo student if unauthenticated in preview/testing
  if (!studentId) {
    // If bed is in female hostel, find a female student; else male student
    const bed = await container.db.queryFirst<{ hostel_gender: string }>(
      `SELECT h.gender as hostel_gender 
       FROM hostel_bedspaces b
       JOIN hostel_rooms r ON b.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE b.id = ? LIMIT 1`,
      [bedspaceId]
    );

    const genderTarget = bed?.hostel_gender?.toUpperCase().startsWith('F') ? 'FEMALE' : 'MALE';
    const demoStudent = await container.db.queryFirst<{ id: string }>(
      `SELECT id FROM students WHERE gender = ? ORDER BY matric_number ASC LIMIT 1`,
      [genderTarget]
    );
    studentId = demoStudent?.id;
  }

  if (!studentId) {
    return c.json({ error: 'Could not resolve eligible student for reservation.' }, 400);
  }

  try {
    const lockResult = await service.acquireBedLock(studentId, bedspaceId);
    return c.json(lockResult);
  } catch (err: any) {
    const message = err.message || 'Failed to acquire reservation lock.';
    const isConflict =
      message.includes('occupied') ||
      message.includes('locked') ||
      message.includes('another student') ||
      message.includes('already has an active');

    return c.json(
      {
        success: false,
        error: message,
        bedspaceId,
      },
      isConflict ? 409 : 400
    );
  }
});

/**
 * 4. Permanent Allocation Confirmation
 * POST /api/hostels/confirm
 */
hostelRoutes.post('/confirm', async (c) => {
  const container = getContainer(c.env);
  const service = new HostelService(container.db, container.cache);
  const user = await authenticateSession(c);

  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON request body' }, 400);
  }

  const { bedspaceId, paymentReference, sessionId } = body;
  if (!bedspaceId) {
    return c.json({ error: 'bedspaceId is required' }, 400);
  }

  let studentId = body.studentId;
  if (!studentId && user?.userId) {
    const student = await container.db.queryFirst<{ id: string }>(
      `SELECT id FROM students WHERE user_id = ? LIMIT 1`,
      [user.userId]
    );
    if (student) {
      studentId = student.id;
    }
  }

  if (!studentId) {
    // Find lock holder on this bedspace
    const lock = await container.db.queryFirst<{ student_id: string }>(
      `SELECT student_id FROM allocation_locks WHERE bedspace_id = ? AND status = 'LOCKED' ORDER BY locked_at DESC LIMIT 1`,
      [bedspaceId]
    );
    studentId = lock?.student_id;
  }

  if (!studentId) {
    return c.json({ error: 'Could not resolve reserving student for confirmation.' }, 400);
  }

  try {
    const result = await service.confirmAllocation(studentId, bedspaceId, paymentReference, sessionId);
    return c.json(result);
  } catch (err: any) {
    return c.json(
      {
        success: false,
        error: err.message || 'Failed to confirm bedspace allocation.',
      },
      400
    );
  }
});

/**
 * 5. Expired Locks Sweep
 * POST /api/hostels/cleanup-locks
 */
hostelRoutes.post('/cleanup-locks', async (c) => {
  const container = getContainer(c.env);
  const service = new HostelService(container.db, container.cache);

  try {
    const result = await service.releaseExpiredLocks();
    return c.json({
      success: true,
      message: `Successfully released ${result.expiredCount} expired lock(s).`,
      ...result,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * 6. Warden Occupant Roster
 * GET /api/hostels/warden/roster
 */
hostelRoutes.get('/warden/roster', async (c) => {
  const container = getContainer(c.env);
  const service = new HostelService(container.db, container.cache);
  const user = await authenticateSession(c);

  const roomParam = c.req.query('roomNumber') || '101';
  const hostelParam = c.req.query('hostelId');

  try {
    const report = await service.generateRoomList(roomParam, hostelParam);
    return c.json({ success: true, report });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 404);
  }
});

/**
 * 7. Warden Manual Reassignment
 * POST /api/hostels/warden/reassign
 */
hostelRoutes.post('/warden/reassign', async (c) => {
  const container = getContainer(c.env);
  const service = new HostelService(container.db, container.cache);
  const user = await authenticateSession(c);

  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON request body' }, 400);
  }

  const { studentId, targetBedspaceId, reason } = body;
  if (!studentId || !targetBedspaceId) {
    return c.json({ error: 'studentId and targetBedspaceId are required' }, 400);
  }

  const wardenStaffId = user?.userId || body.wardenStaffId || 'stf-warden-001';

  try {
    const result = await service.reassignStudentBed(studentId, targetBedspaceId, wardenStaffId, reason);
    return c.json(result);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/**
 * 8. Warden Allocation Revocation
 * POST /api/hostels/warden/revoke
 */
hostelRoutes.post('/warden/revoke', async (c) => {
  const container = getContainer(c.env);
  const service = new HostelService(container.db, container.cache);
  const user = await authenticateSession(c);

  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON request body' }, 400);
  }

  const { allocationId, reason } = body;
  if (!allocationId || !reason) {
    return c.json({ error: 'allocationId and reason are required' }, 400);
  }

  const wardenStaffId = user?.userId || body.wardenStaffId || 'stf-warden-001';

  try {
    const result = await service.revokeAllocation(allocationId, wardenStaffId, reason);
    return c.json(result);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});
