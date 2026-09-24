import { Hono } from 'hono';
import { Env } from '../../types/env';
import { ScreeningEngine, ScreeningEvaluationInput } from '../../services/admissions/screeningEngine';

export const admissionsRoutes = new Hono<{ Bindings: Env }>();

admissionsRoutes.get('/cycles', async (c) => {
  return c.json({
    cycles: [
      {
        id: 'cycle-nce-2026',
        division: 'NCE',
        name: '2026/2027 NCE Regular Admissions',
        applicationFeeKobo: 250000, // ₦2,500.00
        isOpen: true,
        deadline: '2026-11-30',
      },
      {
        id: 'cycle-deg-2026',
        division: 'DEGREE',
        name: '2026/2027 Degree Affiliated Programmes (B.Ed / B.Sc Ed)',
        applicationFeeKobo: 300000, // ₦3,000.00
        isOpen: true,
        deadline: '2026-11-30',
      },
      {
        id: 'cycle-sec-2026',
        division: 'SECONDARY',
        name: 'Demonstration Secondary School JS1 & SS1 Entrance',
        applicationFeeKobo: 200000, // ₦2,000.00
        isOpen: true,
        deadline: '2026-10-15',
      },
      {
        id: 'cycle-pri-2026',
        division: 'PRIMARY',
        name: 'Staff Primary School Pupil Admissions',
        applicationFeeKobo: 150000, // ₦1,500.00
        isOpen: true,
        deadline: '2026-10-15',
      },
    ],
  });
});

admissionsRoutes.post('/apply', async (c) => {
  const body = await c.req.json();
  const { division, firstName, lastName, phone, oLevelSubjects, jambScore } = body;

  if (!division || !firstName || !lastName || !phone) {
    return c.json({ error: 'Missing mandatory applicant biodata fields' }, 400);
  }

  const applicationNumber = `COEKA/${division}/2026/${Math.floor(1000 + Math.random() * 9000)}`;

  // Evaluate screening status
  const evaluationInput: ScreeningEvaluationInput = {
    division,
    jambScore: jambScore || 145,
    oLevelSubjects: oLevelSubjects || [
      { subject: 'English Language', grade: 'C5' },
      { subject: 'Mathematics', grade: 'C4' },
      { subject: 'Biology', grade: 'B3' },
      { subject: 'Chemistry', grade: 'C6' },
      { subject: 'Physics', grade: 'C6' },
    ],
    departmentCutOff: division === 'DEGREE' ? 140 : 100,
  };

  const screening = ScreeningEngine.evaluateApplication(evaluationInput);

  return c.json({
    message: 'Application submitted successfully',
    application: {
      applicationNumber,
      applicantName: `${firstName} ${lastName}`,
      division,
      status: screening.isEligible ? 'ADMITTED' : 'SCREENED',
      screening,
      admissionLetterUrl: screening.isEligible
        ? `https://portal.coekatsinaala.edu.ng/admissions/letters/${applicationNumber}.pdf`
        : null,
      acceptanceFeeKobo: 1500000, // ₦15,000.00
    },
  });
});
