import { Hono } from 'hono';
import { Env } from '../../types/env';
import { CourseRegistrationEngine, CourseToRegister } from '../../services/students/courseRegistrationEngine';
import { requireAuth, requireRole } from '../middleware/rbac';

export const simsRoutes = new Hono<{ Bindings: Env }>();

// Only students can access SIMS operations
simsRoutes.use('*', requireAuth, requireRole(['STUDENT']));

simsRoutes.get('/profile', async (c) => {
  return c.json({
    student: {
      matricNumber: 'COEKA/2026/NCE/084',
      fullName: 'Aondoaver Moses Iorliam',
      division: 'NCE',
      programme: 'NCE Computer Science / Mathematics',
      level: 100,
      gender: 'MALE',
      stateOfOrigin: 'Benue',
      lgaOfOrigin: 'Katsina-Ala',
      academicStatus: 'ACTIVE',
      passportPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      digitalIdVerificationUrl: 'https://portal.coekatsinaala.edu.ng/verify/id/COEKA-2026-NCE-084',
    },
  });
});

simsRoutes.get('/courses/available', async (c) => {
  const courses: CourseToRegister[] = [
    { courseId: 'c1', code: 'CSC 111', title: 'Introduction to Computer Systems', creditUnits: 2 },
    { courseId: 'c2', code: 'CSC 112', title: 'Problem Solving & BASIC Programming', creditUnits: 3 },
    { courseId: 'c3', code: 'MTH 111', title: 'Algebra and Trigonometry', creditUnits: 3 },
    { courseId: 'c4', code: 'MTH 112', title: 'Basic Calculus', creditUnits: 3 },
    { courseId: 'c5', code: 'EDU 111', title: 'Introduction to Foundations of Education', creditUnits: 2 },
    { courseId: 'c6', code: 'EDU 112', title: 'Educational Psychology', creditUnits: 2 },
    { courseId: 'c7', code: 'GSE 111', title: 'General English I', creditUnits: 2 },
  ];

  return c.json({
    courses,
    minCreditUnits: 15,
    maxCreditUnits: 24,
  });
});

simsRoutes.post('/courses/register', async (c) => {
  const body = await c.req.json();
  const { selectedCourses, hasPaidSchoolFees } = body;

  const validation = CourseRegistrationEngine.validateRegistration({
    hasPaidSchoolFees: hasPaidSchoolFees ?? true,
    selectedCourses: selectedCourses || [],
    passedCourseIds: new Set<string>(['c0']),
    minCreditLoad: 15,
    maxCreditLoad: 24,
  });

  if (!validation.isValid) {
    return c.json({
      error: 'Registration validation failed',
      errors: validation.errors,
    }, 422);
  }

  return c.json({
    message: 'Course registration submitted successfully',
    totalCreditUnits: validation.totalCreditUnits,
    status: 'SUBMITTED_FOR_ADVISER_APPROVAL',
    courseFormUrl: `https://portal.coekatsinaala.edu.ng/sims/course-form/COEKA-2026-NCE-084.pdf`,
  });
});
