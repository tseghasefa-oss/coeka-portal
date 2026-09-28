import { Hono } from 'hono';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { edgeCache } from '../middleware/edgeCache';

export const coursesRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /api/courses
 * Institutional Public Course Catalogue
 * Cached at the Cloudflare Edge for 1 hour with stale-while-revalidate for instant loading.
 */
coursesRoutes.get('/', edgeCache({ ttlSeconds: 3600, staleWhileRevalidateSeconds: 86400 }), async (c) => {
  const container = getContainer(c.env);
  const programmeId = c.req.query('programmeId');
  const levelParam = c.req.query('level');
  const semesterParam = c.req.query('semester');

  let queryStr = `
    SELECT 
      c.id,
      c.code,
      c.title,
      c.credit_units as creditUnits,
      c.semester_term as semester,
      c.level,
      c.programme_id as programmeId,
      p.name as programmeName
    FROM courses c
    LEFT JOIN programmes p ON c.programme_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (programmeId) {
    queryStr += ` AND c.programme_id = ?`;
    params.push(programmeId);
  }
  if (levelParam) {
    queryStr += ` AND c.level = ?`;
    params.push(parseInt(levelParam, 10));
  }
  if (semesterParam) {
    queryStr += ` AND c.semester_term = ?`;
    params.push(parseInt(semesterParam, 10));
  }

  queryStr += ` ORDER BY c.level ASC, c.semester_term ASC, c.code ASC`;

  try {
    const courses = await container.db.query(queryStr, params);

    // Fallback seed courses if DB is empty
    const responseCourses = courses.length > 0 ? courses : [
      {
        id: 'crs-csc111',
        code: 'CSC 111',
        title: 'Introduction to Computer Science & Information Systems',
        creditUnits: 2,
        semester: 1,
        level: 100,
        programmeName: 'NCE Computer Science / Mathematics',
        description: 'Foundational concepts of computing, binary representation, and operating systems.',
      },
      {
        id: 'crs-mth111',
        code: 'MTH 111',
        title: 'Elementary Algebra and Trigonometry',
        creditUnits: 2,
        semester: 1,
        level: 100,
        programmeName: 'NCE Computer Science / Mathematics',
        description: 'Polynomials, binomial theorem, trigonometric functions and logarithmic principles.',
      },
      {
        id: 'crs-edu111',
        code: 'EDU 111',
        title: 'History and Philosophy of Education in Nigeria',
        creditUnits: 2,
        semester: 1,
        level: 100,
        programmeName: 'General Education Foundation',
        description: 'Development of indigenous and modern teacher education in Nigeria.',
      },
      {
        id: 'crs-gse111',
        code: 'GSE 111',
        title: 'General English & Use of Library I',
        creditUnits: 2,
        semester: 1,
        level: 100,
        programmeName: 'General Studies in Education',
        description: 'Grammar mechanics, vocabulary development, reading comprehension and library search skills.',
      },
      {
        id: 'crs-csc121',
        code: 'CSC 121',
        title: 'Structured Programming with C / Python',
        creditUnits: 3,
        semester: 2,
        level: 100,
        programmeName: 'NCE Computer Science / Mathematics',
        description: 'Algorithms, pseudocode, variables, control structures, and structured programming paradigms.',
      },
      {
        id: 'crs-mth121',
        code: 'MTH 121',
        title: 'Differential and Integral Calculus',
        creditUnits: 2,
        semester: 2,
        level: 100,
        programmeName: 'NCE Computer Science / Mathematics',
        description: 'Limits, derivatives, differentiation rules, integration techniques and geometric applications.',
      },
    ];

    return c.json({
      institution: 'College of Education, Katsina-Ala',
      totalCourses: responseCourses.length,
      cachedAt: new Date().toISOString(),
      courses: responseCourses,
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to retrieve course catalogue', detail: err.message }, 500);
  }
});
