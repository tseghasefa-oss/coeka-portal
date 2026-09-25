import { Hono } from 'hono';
import { Env } from '../../types/env';
import { requireAuth, requireRole } from '../middleware/rbac';

export const staffRoutes = new Hono<{ Bindings: Env }>();

// Only Academic & Administrative Staff can access staff endpoints
staffRoutes.use('*', requireAuth, requireRole(['LECTURER', 'DEAN', 'HOD']));

// 1. Staff Profile & Workload Allocation
staffRoutes.get('/profile', async (c) => {
  return c.json({
    staff: {
      staffId: 'COEKA/ACA/2018/142',
      fullName: 'Dr. Terver Kange',
      cadre: 'ACADEMIC',
      designation: 'Senior Lecturer',
      department: 'Department of Computer Science',
      school: 'School of Sciences',
      email: 't.kange@coekatsinaala.edu.ng',
      phone: '08031234567',
      assignedCourses: [
        { code: 'CSC 111', title: 'Introduction to Computer Systems', level: 100, units: 2, enrolledCount: 184 },
        { code: 'CSC 112', title: 'Problem Solving & BASIC Programming', level: 100, units: 3, enrolledCount: 184 },
        { code: 'CSC 211', title: 'Data Structures and Algorithms', level: 200, units: 3, enrolledCount: 142 },
      ],
    },
  });
});

// 2. Score Upload by Lecturer
staffRoutes.post('/scores/upload', async (c) => {
  const body = await c.req.json();
  const { courseCode, scores } = body;

  if (!courseCode || !scores || !Array.isArray(scores)) {
    return c.json({ error: 'Course code and score array are required' }, 400);
  }

  // Validate score bounds (CA <= 40, Exam <= 60)
  for (const s of scores) {
    if (s.caScore > 40 || s.caScore < 0 || s.examScore > 60 || s.examScore < 0) {
      return c.json({
        error: `Score bounds violation for student ${s.matricNumber}: CA must be 0-40, Exam must be 0-60`,
      }, 422);
    }
  }

  return c.json({
    message: `Successfully saved ${scores.length} scores for ${courseCode}`,
    status: 'SAVED_DRAFT',
    submissionReference: `SUB-${courseCode}-${Date.now()}`,
  });
});

// 3. Leave Applications
staffRoutes.get('/leave/history', async (c) => {
  return c.json({
    leaves: [
      {
        id: 'lv-001',
        leaveType: 'ANNUAL_LEAVE',
        startDate: '2026-08-01',
        endDate: '2026-08-30',
        status: 'APPROVED',
        approvedBy: 'Registrar',
      },
    ],
  });
});

staffRoutes.post('/leave/apply', async (c) => {
  const body = await c.req.json();
  const { leaveType, startDate, endDate, reason } = body;

  return c.json({
    message: 'Leave application submitted to HOD Computer Science for recommendation',
    leave: {
      id: `lv-${Date.now()}`,
      leaveType,
      startDate,
      endDate,
      status: 'PENDING_HOD_RECOMMENDATION',
    },
  });
});
