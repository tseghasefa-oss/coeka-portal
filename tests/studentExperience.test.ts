import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { createMemoryContainer, resetDefaultMemoryContainer, getContainer } from '../src/infrastructure/container';
import { CourseRegistrationEngine, CourseToRegister } from '../src/services/students/courseRegistrationEngine';
import { FinanceService } from '../src/services/finance/financeService';

describe('Module 3: The Student Experience (Tertiary & Basic)', () => {
  beforeEach(() => {
    resetDefaultMemoryContainer();
  });

  describe('1. Course Registration Validation Engine (Unit Tests)', () => {
    const validCourses: CourseToRegister[] = [
      { courseId: 'c1', code: 'CSC 111', title: 'Intro to Computer Systems', creditUnits: 3 },
      { courseId: 'c2', code: 'CSC 112', title: 'Problem Solving & Programming', creditUnits: 3 },
      { courseId: 'c3', code: 'MTH 111', title: 'Algebra & Trigonometry', creditUnits: 3 },
      { courseId: 'c4', code: 'MTH 112', title: 'Basic Calculus', creditUnits: 3 },
      { courseId: 'c5', code: 'EDU 111', title: 'Philosophy of Education', creditUnits: 2 },
      { courseId: 'c6', code: 'EDU 112', title: 'Educational Psychology', creditUnits: 2 },
      { courseId: 'c7', code: 'GSE 111', title: 'General English I', creditUnits: 2 },
    ]; // Total = 18 credit units

    it('rejects course registration if student has NOT cleared school fees', () => {
      const result = CourseRegistrationEngine.validateRegistration({
        hasPaidSchoolFees: false,
        selectedCourses: validCourses,
        passedCourseIds: new Set<string>(['c0']),
        minCreditLoad: 15,
        maxCreditLoad: 24,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Course registration locked: Student must possess a verified Bursary fee payment record for the current session.'
      );
      expect(result.totalCreditUnits).toBe(18);
    });

    it('rejects registration if credit load is below minimum allowable units (underload)', () => {
      const underloadCourses: CourseToRegister[] = [
        { courseId: 'c1', code: 'CSC 111', title: 'Intro to Computer Systems', creditUnits: 3 },
        { courseId: 'c2', code: 'CSC 112', title: 'Problem Solving', creditUnits: 3 },
      ]; // Total = 6 units (< 15)

      const result = CourseRegistrationEngine.validateRegistration({
        hasPaidSchoolFees: true,
        selectedCourses: underloadCourses,
        passedCourseIds: new Set<string>(['c0']),
        minCreditLoad: 15,
        maxCreditLoad: 24,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('below the required minimum threshold of 15 units'))).toBe(true);
      expect(result.totalCreditUnits).toBe(6);
    });

    it('rejects registration if credit load exceeds maximum allowable units (overload)', () => {
      const overloadCourses: CourseToRegister[] = [
        ...validCourses, // 18 units
        { courseId: 'c8', code: 'GSE 112', title: 'Use of Library', creditUnits: 2 },
        { courseId: 'c9', code: 'PHY 111', title: 'Mechanics & Heat', creditUnits: 3 },
        { courseId: 'c10', code: 'CHM 111', title: 'General Chemistry', creditUnits: 3 },
      ]; // Total = 26 units (> 24)

      const result = CourseRegistrationEngine.validateRegistration({
        hasPaidSchoolFees: true,
        selectedCourses: overloadCourses,
        passedCourseIds: new Set<string>(['c0']),
        minCreditLoad: 15,
        maxCreditLoad: 24,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('exceeds the statutory maximum limit of 24 units'))).toBe(true);
      expect(result.totalCreditUnits).toBe(26);
    });

    it('approves registration when fee is cleared and credit load is between 15 and 24 units', () => {
      const result = CourseRegistrationEngine.validateRegistration({
        hasPaidSchoolFees: true,
        selectedCourses: validCourses,
        passedCourseIds: new Set<string>(['c0']),
        minCreditLoad: 15,
        maxCreditLoad: 24,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.totalCreditUnits).toBe(18);
    });
  });

  describe('2. Crucial Verification: Registration Fee Gate via REST API', () => {
    const sampleCoursesToRegister = [
      { courseId: 'crs-csc111', code: 'CSC 111', title: 'Introduction to Computer Systems', creditUnits: 2 },
      { courseId: 'crs-csc112', code: 'CSC 112', title: 'Problem Solving & BASIC Programming', creditUnits: 3 },
      { courseId: 'crs-mth111', code: 'MTH 111', title: 'Algebra and Trigonometry', creditUnits: 3 },
      { courseId: 'crs-mth112', code: 'MTH 112', title: 'Basic Calculus', creditUnits: 3 },
      { courseId: 'crs-edu111', code: 'EDU 111', title: 'Introduction to Foundations of Education', creditUnits: 2 },
      { courseId: 'crs-edu112', code: 'EDU 112', title: 'Educational Psychology', creditUnits: 2 },
      { courseId: 'crs-gse111', code: 'GSE 111', title: 'General English I', creditUnits: 2 },
    ]; // Total = 17 credit units (valid load 15-24)

    it('STRICTLY BLOCKS course registration submission with HTTP 422 if student has outstanding debt', async () => {
      // With default test data, student std-001 has an unpaid invoice of ₦45,000 (balance > 0)
      const res = await app.request('/api/student/courses/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'STUDENT',
        },
        body: JSON.stringify({
          selectedCourses: sampleCoursesToRegister,
        }),
      });

      expect(res.status).toBe(422);
      const json: any = await res.json();
      expect(json.hasOutstandingDebt).toBe(true);
      expect(json.outstandingBalanceKobo).toBeGreaterThan(0);
      expect(json.errors.some((e: string) => e.includes('Course registration locked') || e.toLowerCase().includes('bursary'))).toBe(true);
    });

    it('allows course registration submission with HTTP 200 once fees are cleared', async () => {
      // Simulate fee clearance flag (hasPaidSchoolFees: true)
      const res = await app.request('/api/student/courses/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'STUDENT',
        },
        body: JSON.stringify({
          selectedCourses: sampleCoursesToRegister,
          hasPaidSchoolFees: true,
        }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.message).toContain('completed successfully');
      expect(json.registeredCourses).toHaveLength(7);
      expect(json.totalCreditUnits).toBe(17);
      expect(json.submittedAt).toBeDefined();
    });

    it('rejects submission even if fee is cleared if credit load is invalid (< 15 units)', async () => {
      const res = await app.request('/api/student/courses/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'STUDENT',
        },
        body: JSON.stringify({
          selectedCourses: [
            { courseId: 'crs-csc111', code: 'CSC 111', title: 'Introduction to Computer Systems', creditUnits: 2 },
          ], // Only 2 units
          hasPaidSchoolFees: true,
        }),
      });

      expect(res.status).toBe(422);
      const json: any = await res.json();
      expect(json.errors.some((e: string) => e.includes('below the required minimum threshold of 15 units'))).toBe(true);
    });
  });

  describe('3. Student Profile & Course Catalog Endpoints', () => {
    it('returns student academic profile via GET /api/student/profile', async () => {
      const res = await app.request('/api/student/profile', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.student).toBeDefined();
      expect(json.student.matricNumber).toBeDefined();
      expect(json.student.fullName).toBeDefined();
      expect(json.student.division).toBeDefined();
      expect(json.student.programme).toBeDefined();
      expect(json.student.level).toBeDefined();
    });

    it('returns available course pool via GET /api/student/courses/available', async () => {
      const res = await app.request('/api/student/courses/available', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.courses).toBeDefined();
      expect(json.courses.length).toBeGreaterThan(0);
      expect(json.minCreditUnits).toBe(15);
      expect(json.maxCreditUnits).toBe(24);
    });

    it('returns registered courses via GET /api/student/courses/registered', async () => {
      const res = await app.request('/api/student/courses/registered', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.registeredCourses).toBeDefined();
      expect(json.registeredCourses.length).toBeGreaterThan(0);
      expect(json.totalCreditUnits).toBeGreaterThan(0);
    });
  });

  describe('4. Student Financials & Payment Integration', () => {
    it('returns student invoices and financial debt summary via GET /api/student/invoices', async () => {
      const res = await app.request('/api/student/invoices', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.invoices).toBeDefined();
      expect(json.summary).toBeDefined();
      expect(json.summary.totalDueKobo).toBeGreaterThan(0);
      expect(json.summary.outstandingBalanceKobo).toBeGreaterThan(0);
      expect(json.summary.hasOutstandingDebt).toBe(true);
      expect(json.summary.formattedOutstandingBalance).toContain('₦');
    });

    it('generates dedicated dynamic virtual bank account via GET /api/student/virtual-account', async () => {
      const res = await app.request('/api/student/virtual-account', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.virtualAccount).toBeDefined();
      expect(json.virtualAccount.accountNumber).toHaveLength(10);
      expect(json.virtualAccount.bankName).toBeDefined();
      expect(json.instructions).toContain('bank transfer');
    });

    it('initializes online invoice payment with failover gateway via POST /api/student/invoices/:id/pay', async () => {
      const res = await app.request('/api/student/invoices/inv-001/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'STUDENT',
        },
        body: JSON.stringify({ gateway: 'PAYSTACK' }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.payment).toBeDefined();
      expect(json.payment.paymentUrl).toBeDefined();
      expect(json.surcharge).toBeDefined();
    });

    it('issues verifiable official receipt with cryptographic hash via GET /api/student/invoices/:id/receipt', async () => {
      const res = await app.request('/api/student/invoices/inv-001/receipt', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.receipt).toBeDefined();
      expect(json.receipt.receiptNumber).toContain('REC-COEKA-');
      expect(json.verification.hash).toBeDefined();
      expect(json.verification.verificationUrl).toContain('/verify/receipt/');
    });
  });

  describe('5. Academic Transcripts & Basic Education Report Cards', () => {
    it('returns official certified Tertiary transcript via GET /api/student/transcript', async () => {
      const res = await app.request('/api/student/transcript', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(json.transcript).toBeDefined();
      expect(json.transcript.student.matricNumber).toBeDefined();
      expect(json.transcript.academicHistory).toBeInstanceOf(Array);
      expect(json.transcript.cumulative).toBeDefined();
      expect(json.transcript.cumulative.cgpa).toBeGreaterThanOrEqual(0);
      expect(json.transcript.verificationHash).toBeDefined();
    });

    it('returns comprehensive Basic Education report card via GET /api/student/report-card', async () => {
      const res = await app.request('/api/student/report-card', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(json.reportCard).toBeDefined();
      expect(json.reportCard.studentInfo.regNo).toBeDefined();
      expect(json.reportCard.subjects).toBeInstanceOf(Array);
      expect(json.reportCard.subjects.length).toBeGreaterThan(0);
      expect(json.reportCard.affectiveTraits).toBeInstanceOf(Array);
      expect(json.reportCard.psychomotorSkills).toBeInstanceOf(Array);
      expect(json.reportCard.remarks.principalRemark).toBeDefined();
      expect(json.reportCard.verificationHash).toBeDefined();
    });
  });

  describe('6. Timetable & Multi-Unit Digital Clearance', () => {
    it('returns weekly class schedule via GET /api/student/timetable', async () => {
      const res = await app.request('/api/student/timetable', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(json.timetable.days).toBeInstanceOf(Array);
      expect(json.timetable.days.length).toBe(5); // Mon to Fri
      const monday = json.timetable.days.find((d: any) => d.day === 'Monday');
      expect(monday).toBeDefined();
      expect(monday.periods.length).toBeGreaterThan(0);
    });

    it('returns digital clearance checklist reflecting Bursary fee status via GET /api/student/clearance', async () => {
      const res = await app.request('/api/student/clearance', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.studentId).toBeDefined();
      expect(json.checklist).toBeInstanceOf(Array);
      expect(json.totalUnits).toBe(5); // Bursary, Dept, Library, Hostel, Medical

      // With default debt balance > 0, Bursary should be PENDING
      const bursaryUnit = json.checklist.find((item: any) => item.unit === 'BURSARY');
      expect(bursaryUnit).toBeDefined();
      expect(bursaryUnit.status).toBe('PENDING');
      expect(json.isFullyCleared).toBe(false);
    });
  });

  describe('7. RBAC & Security Protection on Student Routes', () => {
    it('rejects unauthenticated requests to student endpoints with HTTP 401', async () => {
      const res = await app.request('/api/student/profile');
      expect(res.status).toBe(401);
    });

    it('rejects non-STUDENT roles (e.g. LECTURER) from accessing student endpoints with HTTP 403', async () => {
      const res = await app.request('/api/student/profile', {
        headers: {
          'X-Demo-Role': 'LECTURER',
        },
      });
      expect(res.status).toBe(403);
    });
  });
});
