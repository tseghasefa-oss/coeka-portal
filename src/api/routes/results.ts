import { Hono } from 'hono';
import { Env } from '../../types/env';
import { GradingPolicyEngine } from '../../services/academic/gradingPolicyEngine';
import { ResultComputer } from '../../services/academic/resultComputer';
import { TranscriptGenerator } from '../../services/academic/transcriptGenerator';

export const resultRoutes = new Hono<{ Bindings: Env }>();

// 1. Get Student Semester Result
resultRoutes.get('/student-result', async (c) => {
  const policy = 'NCCE_5_POINT';

  const rawCourses = [
    { code: 'CSC 111', title: 'Introduction to Computer Systems', units: 2, ca: 34, exam: 52 },
    { code: 'CSC 112', title: 'Problem Solving & BASIC Programming', units: 3, ca: 30, exam: 48 },
    { code: 'MTH 111', title: 'Algebra and Trigonometry', units: 3, ca: 28, exam: 42 },
    { code: 'EDU 111', title: 'Philosophy of Education', units: 2, ca: 36, exam: 44 },
    { code: 'GSE 111', title: 'General English I', units: 2, ca: 32, exam: 46 },
  ];

  const processedCourses = rawCourses.map(rc => {
    const total = rc.ca + rc.exam;
    const evaluated = GradingPolicyEngine.evaluateScore(total, policy);
    return {
      courseCode: rc.code,
      courseTitle: rc.title,
      creditUnits: rc.units,
      gradePoint: evaluated.gradePoint,
      letterGrade: evaluated.letterGrade,
      caScore: rc.ca,
      examScore: rc.exam,
      isPass: evaluated.isPass,
    };
  });

  const semesterSummary = ResultComputer.computeSemesterGPA(processedCourses);
  const cumulativeSummary = ResultComputer.computeCGPA([
    {
      registeredUnits: semesterSummary.totalCreditUnitsRegistered,
      earnedUnits: semesterSummary.totalCreditUnitsEarned,
      qualityPoints: semesterSummary.totalQualityPoints,
    },
  ], 'NCE');

  return c.json({
    student: {
      matricNumber: 'COEKA/2026/NCE/084',
      fullName: 'Aondoaver Moses Iorliam',
      division: 'NCE',
      programme: 'NCE Computer Science / Mathematics',
      level: 100,
      session: '2026/2027',
      semester: 'First Semester',
    },
    semester: semesterSummary,
    cumulative: cumulativeSummary,
    approvalStatus: 'SENATE_APPROVED',
  });
});

// 2. 4-Tier Approval State Transition Endpoint
resultRoutes.post('/approve', async (c) => {
  const body = await c.req.json();
  const { semesterId, departmentId, targetStage, comments } = body;

  const validStages = ['LECTURER_SUBMITTED', 'HOD_MODERATED', 'DEAN_VERIFIED', 'SENATE_APPROVED'];
  if (!validStages.includes(targetStage)) {
    return c.json({ error: `Invalid target stage: ${targetStage}` }, 400);
  }

  return c.json({
    message: `Result batch successfully transitioned to stage: ${targetStage}`,
    audit: {
      semesterId,
      departmentId,
      stage: targetStage,
      ratifiedAt: new Date().toISOString(),
      comments: comments || 'Approved without queries',
    },
  });
});

// 3. Transcript Generation Endpoint
resultRoutes.get('/transcript', async (c) => {
  const sampleTranscriptPayload = {
    student: {
      matricNumber: 'COEKA/2026/NCE/084',
      fullName: 'Aondoaver Moses Iorliam',
      gender: 'MALE',
      division: 'NCE',
      programme: 'NCE Computer Science / Mathematics',
      admissionYear: 2026,
    },
    academicHistory: [
      {
        session: '2026/2027',
        semester: 'First Semester',
        courses: [
          { code: 'CSC 111', title: 'Intro to Computer Systems', units: 2, score: 86, grade: 'A', point: 5.0 },
          { code: 'CSC 112', title: 'Problem Solving & BASIC', units: 3, score: 78, grade: 'A', point: 5.0 },
          { code: 'MTH 111', title: 'Algebra and Trigonometry', units: 3, score: 70, grade: 'A', point: 5.0 },
          { code: 'EDU 111', title: 'Philosophy of Education', units: 2, score: 80, grade: 'A', point: 5.0 },
          { code: 'GSE 111', title: 'General English I', units: 2, score: 78, grade: 'A', point: 5.0 },
        ],
        gpa: 5.0,
      },
    ],
    cumulative: {
      totalCreditsRegistered: 12,
      totalCreditsEarned: 12,
      cgpa: 5.0,
      classOfAward: 'Distinction',
    },
  };

  const verifiableTranscript = await TranscriptGenerator.generateVerifiableTranscript(sampleTranscriptPayload);
  return c.json(verifiableTranscript);
});
