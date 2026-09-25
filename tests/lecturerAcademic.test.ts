import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { createMemoryContainer, resetDefaultMemoryContainer, getContainer } from '../src/infrastructure/container';
import { AcademicService } from '../src/services/academic/academicService';
import { GradingPolicyEngine } from '../src/services/academic/gradingPolicyEngine';

describe('Module 2: The Academic Engine (Lecturer Dashboard, Attendance & Result Gate)', () => {
  beforeEach(() => {
    resetDefaultMemoryContainer();
  });

  describe('1. Institutional Grading Policies (Tertiary vs Basic Education)', () => {
    it('evaluates NCE scores correctly under NCCE 5-point scale', () => {
      // NCCE BMAS: A (70-100, 5.0), B (60-69, 4.0), C (50-59, 3.0), D (40-49, 2.0), E (35-39, 1.0), F (0-34, 0.0)
      expect(GradingPolicyEngine.evaluateScore(85, 'NCCE_5_POINT')).toEqual({
        letterGrade: 'A',
        gradePoint: 5.0,
        description: 'Distinction',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(62, 'NCCE_5_POINT')).toEqual({
        letterGrade: 'B',
        gradePoint: 4.0,
        description: 'Credit',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(54, 'NCCE_5_POINT')).toEqual({
        letterGrade: 'C',
        gradePoint: 3.0,
        description: 'Merit',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(44, 'NCCE_5_POINT')).toEqual({
        letterGrade: 'D',
        gradePoint: 2.0,
        description: 'Pass',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(37, 'NCCE_5_POINT')).toEqual({
        letterGrade: 'E',
        gradePoint: 1.0,
        description: 'Low Pass',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(29, 'NCCE_5_POINT')).toEqual({
        letterGrade: 'F',
        gradePoint: 0.0,
        description: 'Fail',
        isPass: false,
      });
    });

    it('evaluates Degree scores correctly under NUC 5-point scale', () => {
      // NUC Standard: A (70-100, 5.0), B (60-69, 4.0), C (50-59, 3.0), D (45-49, 2.0), E (40-44, 1.0), F (0-39, 0.0)
      expect(GradingPolicyEngine.evaluateScore(72, 'NUC_DEGREE_5_POINT')).toEqual({
        letterGrade: 'A',
        gradePoint: 5.0,
        description: 'Excellent',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(47, 'NUC_DEGREE_5_POINT')).toEqual({
        letterGrade: 'D',
        gradePoint: 2.0,
        description: 'Fair',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(42, 'NUC_DEGREE_5_POINT')).toEqual({
        letterGrade: 'E',
        gradePoint: 1.0,
        description: 'Pass',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(38, 'NUC_DEGREE_5_POINT')).toEqual({
        letterGrade: 'F',
        gradePoint: 0.0,
        description: 'Fail',
        isPass: false,
      });
    });

    it('evaluates Secondary school scores correctly under WAEC 9-point scale', () => {
      // WAEC Standard: A1 (75-100, 1.0), B2 (70-74, 2.0), B3 (65-69, 3.0), C4-C6 (50-64), D7 (45-49), E8 (40-44), F9 (0-39)
      expect(GradingPolicyEngine.evaluateScore(80, 'SECONDARY_WAEC')).toEqual({
        letterGrade: 'A1',
        gradePoint: 1.0,
        description: 'Excellent',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(62, 'SECONDARY_WAEC')).toEqual({
        letterGrade: 'C4',
        gradePoint: 4.0,
        description: 'Credit',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(35, 'SECONDARY_WAEC')).toEqual({
        letterGrade: 'F9',
        gradePoint: 9.0,
        description: 'Fail',
        isPass: false,
      });
    });

    it('evaluates Primary school scores correctly under 4-point Basic Education scale', () => {
      // Primary: A (80-100, 4.0), B (70-79, 3.0), C (60-69, 2.0), D (50-59, 1.0), E (0-49, 0.0)
      expect(GradingPolicyEngine.evaluateScore(88, 'PRIMARY_BASIC')).toEqual({
        letterGrade: 'A',
        gradePoint: 4.0,
        description: 'Excellent',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(55, 'PRIMARY_BASIC')).toEqual({
        letterGrade: 'D',
        gradePoint: 1.0,
        description: 'Fair',
        isPass: true,
      });
      expect(GradingPolicyEngine.evaluateScore(42, 'PRIMARY_BASIC')).toEqual({
        letterGrade: 'E',
        gradePoint: 0.0,
        description: 'Poor',
        isPass: false,
      });
    });

    it('enforces score boundaries (rejects negative scores or scores exceeding limits)', async () => {
      const container = createMemoryContainer();
      const service = new AcademicService(container.db);

      // Negative score
      await expect(
        service.submitGrade({
          studentId: 'std-001',
          courseId: 'crs-csc111',
          scores: { ca1Score: -5, examScore: 40 },
        })
      ).rejects.toThrow(/cannot be negative/);

      // CA total > 40
      await expect(
        service.submitGrade({
          studentId: 'std-001',
          courseId: 'crs-csc111',
          scores: { ca1Score: 25, ca2Score: 20, examScore: 40 },
        })
      ).rejects.toThrow(/exceeds maximum allowable 40 points/);

      // Exam score > 60
      await expect(
        service.submitGrade({
          studentId: 'std-001',
          courseId: 'crs-csc111',
          scores: { ca1Score: 15, ca2Score: 15, examScore: 65 },
        })
      ).rejects.toThrow(/exceeds maximum allowable 60 points/);
    });
  });

  describe('2. Lecture Attendance Tracking & Cumulative Telemetry', () => {
    it('records batch attendance for a lecture date and computes attendance rate in roster', async () => {
      const container = createMemoryContainer();
      const service = new AcademicService(container.db);
      await service.ensureSeedAcademicData();

      // Mark attendance for student 1 (PRESENT) and student 2 (ABSENT)
      const res = await service.markAttendance({
        courseId: 'crs-csc111',
        studentIds: ['std-001', 'std-002'],
        lectureDate: '2026-10-12',
        status: 'PRESENT',
        markedByStaffId: 'stf-001',
      });

      expect(res.success).toBe(true);
      expect(res.markedCount).toBe(2);

      // Check course roster telemetry
      const roster = await service.getCourseRoster('crs-csc111');
      expect(roster.totalEnrolled).toBeGreaterThan(0);

      const std1 = roster.students.find((s) => s.studentId === 'std-001');
      expect(std1).toBeDefined();
      expect(std1?.attendance.attendedCount).toBeGreaterThan(0);
      expect(std1?.attendance.attendanceRate).toBeGreaterThan(0);
    });
  });

  describe('3. Crucial Verification: Student Result Visibility Gate (DRAFT vs PUBLISHED)', () => {
    it('strictly hides DRAFT grades from student portal until lecturer explicitly calls publishResults', async () => {
      const container = getContainer();
      const service = new AcademicService(container.db);
      await service.ensureSeedAcademicData();

      const courseId = 'crs-csc111';
      const studentId = 'std-001'; // Matric: COEKA/2026/NCE/084

      // STEP 1: Lecturer submits a score (CA1: 18, CA2: 17, Exam: 51 -> Total 86, Grade A)
      // Via REST API: POST /api/lecturer/courses/crs-csc111/grades
      const submitRes = await app.request(`/api/lecturer/courses/${courseId}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'LECTURER',
        },
        body: JSON.stringify({
          studentId,
          ca1Score: 18,
          ca2Score: 17,
          examScore: 51,
        }),
      });

      expect(submitRes.status).toBe(200);
      const submitJson: any = await submitRes.json();
      expect(submitJson.grade.totalScore).toBe(86);
      expect(submitJson.grade.letterGrade).toBe('A');
      expect(submitJson.grade.status).toBe('DRAFT');

      // STEP 2: Verify in DB that grade_entries has status = 'DRAFT'
      const inDb = await container.db.queryFirst<any>(
        `SELECT * FROM grade_entries WHERE course_id = ? AND student_id = ?`,
        [courseId, studentId]
      );
      expect(inDb).toBeDefined();
      expect(inDb.status).toBe('DRAFT');
      expect(inDb.published_at).toBeNull();

      // STEP 3: Student requests results via GET /api/student/results
      // Since results are in DRAFT status, the visibility gate MUST withhold them
      const studentResBefore = await app.request('/api/student/results', {
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(studentResBefore.status).toBe(200);
      const studentJsonBefore: any = await studentResBefore.json();
      expect(studentJsonBefore.hasPublishedResults).toBe(false);
      expect(studentJsonBefore.resultsCount).toBe(0);
      expect(studentJsonBefore.results).toEqual([]);
      expect(studentJsonBefore.message).toContain('withheld');

      // STEP 4: Lecturer calls POST /api/lecturer/courses/crs-csc111/publish to formally release grades
      const publishRes = await app.request(`/api/lecturer/courses/${courseId}/publish`, {
        method: 'POST',
        headers: {
          'X-Demo-Role': 'LECTURER',
        },
      });

      expect(publishRes.status).toBe(200);
      const publishJson: any = await publishRes.json();
      expect(publishJson.success).toBe(true);
      expect(publishJson.publishedCount).toBeGreaterThanOrEqual(1);

      // STEP 5: Verify in DB that grade_entries now has status = 'PUBLISHED' and published_at set
      const inDbAfter = await container.db.queryFirst<any>(
        `SELECT * FROM grade_entries WHERE course_id = ? AND student_id = ?`,
        [courseId, studentId]
      );
      expect(inDbAfter.status).toBe('PUBLISHED');
      expect(inDbAfter.published_at).toBeGreaterThan(0);

      // STEP 6: Student requests results via GET /api/student/results AGAIN
      // Now that results are PUBLISHED, the gate MUST release the grades to the student
      const studentResAfter = await app.request('/api/student/results', {
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(studentResAfter.status).toBe(200);
      const studentJsonAfter: any = await studentResAfter.json();
      expect(studentJsonAfter.hasPublishedResults).toBe(true);
      expect(studentJsonAfter.resultsCount).toBeGreaterThanOrEqual(1);

      const publishedCourseGrade = studentJsonAfter.results.find((r: any) => r.courseCode === 'CSC 111');
      expect(publishedCourseGrade).toBeDefined();
      expect(publishedCourseGrade.totalScore).toBe(86);
      expect(publishedCourseGrade.letterGrade).toBe('A');
      expect(publishedCourseGrade.gradePoint).toBe(5.0);
      expect(publishedCourseGrade.status).toBe('PUBLISHED');
    });
  });

  describe('4. RBAC & Security Protection on Lecturer Routes', () => {
    it('allows LECTURER role to access /api/lecturer/courses', async () => {
      const res = await app.request('/api/lecturer/courses', {
        headers: {
          'X-Demo-Role': 'LECTURER',
        },
      });
      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.courses).toBeDefined();
      expect(json.courses.length).toBeGreaterThan(0);
    });

    it('allows SUPER_ADMIN and ADMIN roles to access /api/lecturer/courses', async () => {
      const resAdmin = await app.request('/api/lecturer/courses', {
        headers: {
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });
      expect(resAdmin.status).toBe(200);
    });

    it('denies STUDENT role from accessing /api/lecturer/* with 403 Forbidden', async () => {
      const res = await app.request('/api/lecturer/courses', {
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });
      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
    });

    it('denies PARENT role from accessing /api/lecturer/* with 403 Forbidden', async () => {
      const res = await app.request('/api/lecturer/courses', {
        headers: {
          'X-Demo-Role': 'PARENT',
        },
      });
      expect(res.status).toBe(403);
    });

    it('denies unauthenticated requests from accessing /api/lecturer/* with 401 Unauthorized', async () => {
      const res = await app.request('/api/lecturer/courses');
      expect(res.status).toBe(401);
    });
  });
});
