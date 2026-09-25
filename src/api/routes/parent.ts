import { Hono } from 'hono';
import { Env } from '../../types/env';
import { LedgerEngine } from '../../services/finance/ledgerEngine';
import { requireAuth, requireRole } from '../middleware/rbac';

export const parentRoutes = new Hono<{ Bindings: Env }>();

// Only parents can access parent dashboard endpoints
parentRoutes.use('*', requireAuth, requireRole(['PARENT']));

// 1. Parent Wards Telemetry
parentRoutes.get('/wards', async (c) => {
  return c.json({
    parent: {
      parentId: 'prt-001',
      fullName: 'Mr. Joshua T. Tsegha',
      email: 'j.tsegha@gmail.com',
      phone: '08064377594',
    },
    wards: [
      {
        studentId: 'std-001',
        fullName: 'Aondoaver Moses Iorliam',
        division: 'NCE',
        programme: 'NCE Computer Science / Mathematics',
        level: 100,
        matricNumber: 'COEKA/2026/NCE/084',
        currentGPA: 4.83,
        attendanceRate: '96%',
        feeStatus: 'UNPAID',
        outstandingKobo: 4500000,
        outstandingFormatted: LedgerEngine.koboToNaira(4500000),
        virtualAccount: '9910840184 (Wema Bank)',
      },
      {
        studentId: 'std-002',
        fullName: 'Ngodoo Blessing Tsegha',
        division: 'SECONDARY',
        programme: 'Demonstration Secondary School (SS2 Science)',
        level: 200,
        matricNumber: 'COEKA/DSS/2024/042',
        terminalAverage: '78.5%',
        terminalPosition: '3rd of 45',
        attendanceRate: '98%',
        feeStatus: 'PAID',
        outstandingKobo: 0,
        outstandingFormatted: LedgerEngine.koboToNaira(0),
        virtualAccount: '9910840185 (Wema Bank)',
      },
      {
        studentId: 'std-003',
        fullName: 'Terhide Kelvin Tsegha',
        division: 'PRIMARY',
        programme: 'Staff Primary School (Basic 4)',
        level: 4,
        matricNumber: 'COEKA/SPS/2022/019',
        terminalAverage: '84.0%',
        terminalPosition: '1st of 32',
        attendanceRate: '100%',
        feeStatus: 'PAID',
        outstandingKobo: 0,
        outstandingFormatted: LedgerEngine.koboToNaira(0),
        virtualAccount: '9910840186 (Wema Bank)',
      },
    ],
  });
});

// 2. Ward Terminal Report Card (Secondary & Primary)
parentRoutes.get('/wards/:id/report-card', async (c) => {
  const wardId = c.req.param('id');

  if (wardId === 'std-002') {
    // Demonstration Secondary Report Card (WAEC style)
    return c.json({
      division: 'SECONDARY',
      school: 'COEKA Demonstration Secondary School',
      studentName: 'Ngodoo Blessing Tsegha',
      class: 'SS2 Science Track',
      term: 'Third Term • 2025/2026',
      subjects: [
        { subject: 'English Language', ca1: 18, ca2: 17, exam: 48, total: 83, grade: 'A1', remark: 'Excellent' },
        { subject: 'Mathematics', ca1: 16, ca2: 18, exam: 46, total: 80, grade: 'A1', remark: 'Excellent' },
        { subject: 'Biology', ca1: 15, ca2: 16, exam: 44, total: 75, grade: 'A1', remark: 'Distinction' },
        { subject: 'Chemistry', ca1: 14, ca2: 15, exam: 42, total: 71, grade: 'B2', remark: 'Very Good' },
        { subject: 'Physics', ca1: 15, ca2: 15, exam: 40, total: 70, grade: 'B2', remark: 'Very Good' },
      ],
      psychomotor: {
        punctuality: 5,
        neatness: 5,
        leadership: 4,
        attentiveness: 5,
      },
      classTeacherRemark: 'An exceptionally brilliant and disciplined student. Keep it up!',
      principalSign: 'VERIFIED',
    });
  }

  return c.json({
    message: 'Report card loaded',
    wardId,
  });
});
