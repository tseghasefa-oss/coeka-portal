import { Hono } from 'hono';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { requireAuth, requireRole } from '../middleware/rbac';
import { AcademicService } from '../../services/academic/academicService';

export const lecturerRoutes = new Hono<{ Bindings: Env }>();

// Only Academic staff (Lecturer, HOD, Dean) and Administrators can access Lecturer endpoints
lecturerRoutes.use('*', requireAuth, requireRole(['LECTURER', 'DEAN', 'HOD', 'SUPER_ADMIN', 'ADMIN']));

/**
 * GET /api/lecturer/courses
 * List courses assigned to the logged-in lecturer
 */
lecturerRoutes.get('/courses', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicService(container.db);
  await service.ensureSeedAcademicData();

  const courses = await container.db.query<any>(
    `SELECT c.*, p.name as programmeName, d.name as divisionName
     FROM courses c
     JOIN programmes p ON c.programme_id = p.id
     JOIN departments dept ON p.department_id = dept.id
     JOIN schools_faculties sf ON dept.school_id = sf.id
     JOIN divisions d ON sf.division_id = d.id
     ORDER BY c.code ASC`
  );

  return c.json({ courses });
});

/**
 * GET /api/lecturer/courses/:courseId/roster
 * Retrieve class roster of all enrolled students, their scores, and attendance rate
 */
lecturerRoutes.get('/courses/:courseId/roster', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicService(container.db);
  const courseId = c.req.param('courseId');

  try {
    const data = await service.getCourseRoster(courseId);
    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch course roster' }, 404);
  }
});

/**
 * GET /api/lecturer/courses/:courseId/grades
 * Retrieve all grade entries and summary statistics for a course
 */
lecturerRoutes.get('/courses/:courseId/grades', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicService(container.db);
  const courseId = c.req.param('courseId');

  try {
    const data = await service.getCourseGrades(courseId);
    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch course grades' }, 404);
  }
});

/**
 * POST /api/lecturer/courses/:courseId/grades
 * Submit or update scores (CA1, CA2, Exam) for a single student or batch of students in a course
 */
lecturerRoutes.post('/courses/:courseId/grades', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicService(container.db);
  const courseId = c.req.param('courseId');
  const user = c.get('user');
  const lecturerStaffId = user?.userId || 'usr-staff-001';

  try {
    const body = await c.req.json();

    // Check if batch submission
    if (body.grades && Array.isArray(body.grades)) {
      const results = [];
      for (const item of body.grades) {
        const res = await service.submitGrade({
          studentId: item.studentId,
          courseId,
          scores: {
            ca1Score: item.ca1Score,
            ca2Score: item.ca2Score,
            caScore: item.caScore,
            examScore: item.examScore,
          },
          lecturerStaffId,
        });
        results.push(res);
      }
      return c.json({
        message: `Successfully processed ${results.length} student scores in DRAFT status`,
        grades: results,
      }, 200);
    }

    // Single student submission
    const { studentId, ca1Score, ca2Score, caScore, examScore } = body;
    if (!studentId) {
      return c.json({ error: 'Validation Error: studentId is required' }, 400);
    }

    const grade = await service.submitGrade({
      studentId,
      courseId,
      scores: { ca1Score, ca2Score, caScore, examScore },
      lecturerStaffId,
    });

    return c.json({
      message: `Score for ${grade.studentName} saved in DRAFT status`,
      grade,
    }, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to submit grade' }, 400);
  }
});

/**
 * GET /api/lecturer/courses/:courseId/attendance
 * Retrieve attendance history for a course
 */
lecturerRoutes.get('/courses/:courseId/attendance', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicService(container.db);
  const courseId = c.req.param('courseId');
  const lectureDate = c.req.query('date');

  try {
    const records = await service.getCourseAttendance(courseId, lectureDate || undefined);
    return c.json({ attendance: records });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch attendance' }, 400);
  }
});

/**
 * POST /api/lecturer/courses/:courseId/attendance
 * Batch update attendance for a lecture date
 */
lecturerRoutes.post('/courses/:courseId/attendance', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicService(container.db);
  const courseId = c.req.param('courseId');
  const user = c.get('user');
  const markedByStaffId = user?.userId || 'usr-staff-001';

  try {
    const body = await c.req.json();
    const { studentIds, lectureDate, status } = body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return c.json({ error: 'Validation Error: studentIds array is required' }, 400);
    }

    const result = await service.markAttendance({
      courseId,
      studentIds,
      lectureDate,
      status: status || 'PRESENT',
      markedByStaffId,
    });

    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to mark attendance' }, 400);
  }
});

/**
 * POST /api/lecturer/courses/:courseId/publish
 * Transition course results from DRAFT to PUBLISHED, making them visible to students
 */
lecturerRoutes.post('/courses/:courseId/publish', async (c) => {
  const container = getContainer(c.env);
  const service = new AcademicService(container.db);
  const courseId = c.req.param('courseId');
  const user = c.get('user');
  const lecturerStaffId = user?.userId || 'usr-staff-001';

  try {
    const result = await service.publishResults(courseId, lecturerStaffId);
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to publish results' }, 400);
  }
});
