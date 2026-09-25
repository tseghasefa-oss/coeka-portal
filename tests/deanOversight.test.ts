import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api';
import { getContainer } from '../src/infrastructure/container';
import { DeanService } from '../src/services/academic/deanService';
import { AcademicService } from '../src/services/academic/academicService';

describe('Module 6: Dean Academic Oversight & Verification Suite', () => {
  const container = getContainer();
  const deanService = new DeanService(container.db);
  const academicService = new AcademicService(container.db);

  beforeEach(async () => {
    await academicService.ensureSeedAcademicData();
  });

  describe('1. Dean Result Review & Statistics Engine (reviewResults)', () => {
    it('fetches draft scores and computes accurate class metrics and grade distribution', async () => {
      const courseId = 'crs-csc111';

      // Submit sample draft scores for 2 students
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES 
         ('ge-rev-1', ?, 'std-001', 'sess-2026-2027', 15, 15, 50, 80, 'A', 5.0, 'DRAFT'),
         ('ge-rev-2', ?, 'std-002', 'sess-2026-2027', 10, 10, 35, 55, 'C', 3.0, 'DRAFT')`,
        [courseId, courseId]
      );

      const review = await deanService.reviewResults(courseId);

      expect(review.course.code).toBe('CSC 111');
      expect(review.metrics.totalStudents).toBeGreaterThanOrEqual(2);
      expect(review.metrics.draftCount).toBeGreaterThanOrEqual(2);
      expect(review.metrics.averageScore).toBeGreaterThan(0);
      expect(review.metrics.passRate).toBeGreaterThan(0);
      expect(review.metrics.gradeDistribution['A']).toBeGreaterThanOrEqual(1);
      expect(review.metrics.gradeDistribution['C']).toBeGreaterThanOrEqual(1);
      expect(review.results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('2. Master Switch Approval: Transition DRAFT -> PUBLISHED (approveResults)', () => {
    it('approves course results and writes persistent audit log to result_approvals', async () => {
      const courseId = 'crs-csc111';
      const deanUserId = 'usr-dean-001';

      // Ensure at least 1 DRAFT grade exists
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES ('ge-app-test', ?, 'std-001', 'sess-2026-2027', 18, 17, 45, 80, 'A', 5.0, 'DRAFT')`,
        [courseId]
      );

      const approval = await deanService.approveResults(
        courseId,
        deanUserId,
        'Senate verified and approved for release'
      );

      expect(approval.success).toBe(true);
      expect(approval.courseCode).toBe('CSC 111');
      expect(approval.approvedCount).toBeGreaterThanOrEqual(1);
      expect(approval.approvalId).toBeDefined();

      // Check grade_entries status in DB
      const updatedGrade = await container.db.queryFirst<any>(
        `SELECT status, published_at FROM grade_entries WHERE id = 'ge-app-test'`
      );
      expect(updatedGrade.status).toBe('PUBLISHED');
      expect(updatedGrade.published_at).toBeGreaterThan(0);

      // Check result_approvals entry in DB
      const approvalRecord = await container.db.queryFirst<any>(
        `SELECT * FROM result_approvals WHERE id = ?`,
        [approval.approvalId]
      );
      expect(approvalRecord).toBeDefined();
      expect(approvalRecord.course_id).toBe(courseId);
      expect(approvalRecord.dean_user_id).toBe(deanUserId);
      expect(approvalRecord.approval_status).toBe('APPROVED');
      expect(approvalRecord.comments).toContain('Senate verified');
    });
  });

  describe('3. Student Grade Appeal Lifecycle (submit, list, resolve)', () => {
    it('submits appeal, retrieves tickets, and applies Dean score correction upon approval', async () => {
      const studentId = 'std-001';
      const courseId = 'crs-csc111';
      const deanId = 'usr-dean-001';

      // Seed student grade with low score
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES ('ge-appeal-orig', ?, ?, 'sess-2026-2027', 10, 10, 25, 45, 'E', 1.0, 'PUBLISHED')`,
        [courseId, studentId]
      );

      // Step A: Student submits an appeal
      const appealSubmission = await deanService.submitAppeal({
        studentId,
        courseId,
        reason: 'Marking error on Question 4 regarding sorting algorithms.',
        desiredCorrection: 'Score was calculated as 25 instead of 45 on Exam.',
      });

      expect(appealSubmission.status).toBe('PENDING');
      expect(appealSubmission.appealId).toBeDefined();

      // Step B: Dean lists appeals
      const appealsList = await deanService.listAppeals({ courseId });
      const myAppeal = appealsList.find((a) => a.id === appealSubmission.appealId);
      expect(myAppeal).toBeDefined();
      expect(myAppeal?.reason).toContain('sorting algorithms');
      expect(myAppeal?.studentMatric).toBeDefined();

      // Step C: Dean approves the appeal with corrected Exam score (45 instead of 25)
      // New total: 10 + 10 + 45 = 65 -> Grade B
      const resolution = await deanService.handleAppeal(
        appealSubmission.appealId,
        'APPROVED',
        deanId,
        {
          examScore: 45,
          decisionNotes: 'Script re-assessed by external moderator. 20 marks restored to Exam.',
        }
      );

      expect(resolution.success).toBe(true);
      expect(resolution.decision).toBe('APPROVED');
      expect(resolution.correctedGrade.totalScore).toBe(65);
      expect(resolution.correctedGrade.letterGrade).toBe('B');

      // Verify DB persistence of corrected grade
      const dbGrade = await container.db.queryFirst<any>(
        `SELECT total_score, letter_grade, grade_point FROM grade_entries WHERE student_id = ? AND course_id = ?`,
        [studentId, courseId]
      );
      expect(dbGrade.total_score).toBe(65);
      expect(dbGrade.letter_grade).toBe('B');

      // Verify appeal ticket status in DB
      const dbAppeal = await container.db.queryFirst<any>(
        `SELECT status, decision_notes, resolved_by_dean_id FROM student_appeals WHERE id = ?`,
        [appealSubmission.appealId]
      );
      expect(dbAppeal.status).toBe('APPROVED');
      expect(dbAppeal.decision_notes).toContain('external moderator');
      expect(dbAppeal.resolved_by_dean_id).toBe(deanId);
    });

    it('processes rejected grade appeal and records Dean rejection rationale', async () => {
      const studentId = 'std-002';
      const courseId = 'crs-csc111';
      const deanId = 'usr-dean-001';

      const appealSubmission = await deanService.submitAppeal({
        studentId,
        courseId,
        reason: 'I feel I deserved a better score.',
      });

      const resolution = await deanService.handleAppeal(
        appealSubmission.appealId,
        'REJECTED',
        deanId,
        {
          decisionNotes: 'Original exam script verified. No calculation or scoring discrepancy found.',
        }
      );

      expect(resolution.success).toBe(true);
      expect(resolution.decision).toBe('REJECTED');

      const dbAppeal = await container.db.queryFirst<any>(
        `SELECT status, decision_notes FROM student_appeals WHERE id = ?`,
        [appealSubmission.appealId]
      );
      expect(dbAppeal.status).toBe('REJECTED');
      expect(dbAppeal.decision_notes).toContain('No calculation or scoring discrepancy');
    });
  });

  describe('4. Faculty Course Assignments (manageFacultyAssignments)', () => {
    it('assigns lecturer to course and retrieves map for Drag-and-Drop allocation UI', async () => {
      const courseId = 'crs-csc112';
      const staffId = 'usr-staff-001';

      const assignment = await deanService.manageFacultyAssignments({
        courseId,
        staffId,
        semesterId: 'sem-nce-2026-1',
        role: 'PRIMARY_LECTURER',
      });

      expect(assignment.courseId).toBe(courseId);
      expect(assignment.staffId).toBe('stf-001');
      expect(assignment.role).toBe('PRIMARY_LECTURER');

      const map = await deanService.listFacultyAssignments();
      expect(map.allocations.length).toBeGreaterThan(0);
      expect(map.courses.length).toBeGreaterThan(0);
      expect(map.lecturers.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 5. CRUCIAL VERIFICATION: Lecturer Cannot Publish; Only DEAN Can Publish
  // =========================================================================
  describe('5. CRUCIAL VERIFICATION: Publication Gate & RBAC Enforcement', () => {
    const courseId = 'crs-csc111';

    beforeEach(async () => {
      // Put a score into DRAFT
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES ('ge-gate-test', ?, 'std-001', 'sess-2026-2027', 15, 15, 50, 80, 'A', 5.0, 'DRAFT')`,
        [courseId]
      );
    });

    it('DENIES LECTURER from publishing/approving results via Dean API with 403 Forbidden', async () => {
      // Lecturer attempts to call Dean approval endpoint
      const lecturerRes = await app.request(`/api/dean/courses/${courseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'LECTURER', // Lecturer attempting Dean approval
        },
        body: JSON.stringify({ comments: 'Lecturer attempting unauthorized publication' }),
      });

      expect(lecturerRes.status).toBe(403);
      const resJson: any = await lecturerRes.json();
      expect(resJson.error).toContain('Forbidden');

      // Verify in DB that grade is STILL DRAFT (not published)
      const gradeInDb = await container.db.queryFirst<any>(
        `SELECT status FROM grade_entries WHERE id = 'ge-gate-test'`
      );
      expect(gradeInDb.status).toBe('DRAFT');
    });

    it('DENIES STUDENT from approving results via Dean API with 403 Forbidden', async () => {
      const studentRes = await app.request(`/api/dean/courses/${courseId}/approve`, {
        method: 'POST',
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(studentRes.status).toBe(403);
    });

    it('DENIES unauthenticated request from approving results with 401 Unauthorized', async () => {
      const unauthRes = await app.request(`/api/dean/courses/${courseId}/approve`, {
        method: 'POST',
      });

      expect(unauthRes.status).toBe(401);
    });

    it('ALLOWS DEAN role to trigger the Master Switch and publish results (200 OK)', async () => {
      // Dean triggers final publication
      const deanRes = await app.request(`/api/dean/courses/${courseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'DEAN', // Authorized Dean persona
        },
        body: JSON.stringify({ comments: 'Faculty Board of Studies formal sign-off' }),
      });

      expect(deanRes.status).toBe(200);
      const deanJson: any = await deanRes.json();
      expect(deanJson.success).toBe(true);
      expect(deanJson.approvedCount).toBeGreaterThanOrEqual(1);

      // Verify in DB that status is now PUBLISHED
      const publishedGrade = await container.db.queryFirst<any>(
        `SELECT status, published_at FROM grade_entries WHERE id = 'ge-gate-test'`
      );
      expect(publishedGrade.status).toBe('PUBLISHED');
      expect(publishedGrade.published_at).toBeGreaterThan(0);

      // Verify that student can now view the published result
      const studentViewRes = await app.request('/api/student/results', {
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(studentViewRes.status).toBe(200);
      const studentViewJson: any = await studentViewRes.json();
      expect(studentViewJson.hasPublishedResults).toBe(true);
      const mathOrCsc = studentViewJson.results.find((r: any) => r.courseCode === 'CSC 111');
      expect(mathOrCsc).toBeDefined();
    });

    it('ALLOWS SUPER_ADMIN to approve results via Dean API (200 OK)', async () => {
      const adminRes = await app.request(`/api/dean/courses/${courseId}/approve`, {
        method: 'POST',
        headers: {
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(adminRes.status).toBe(200);
    });
  });

  describe('6. Dean REST Endpoints Integration', () => {
    it('GET /api/dean/queue returns pending queue', async () => {
      const res = await app.request('/api/dean/queue', {
        headers: { 'X-Demo-Role': 'DEAN' },
      });
      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.queue)).toBe(true);
    });

    it('GET /api/dean/courses/:id/review returns statistical review', async () => {
      const res = await app.request('/api/dean/courses/crs-csc111/review', {
        headers: { 'X-Demo-Role': 'DEAN' },
      });
      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.metrics).toBeDefined();
      expect(json.course).toBeDefined();
    });

    it('GET /api/dean/appeals returns appeals list', async () => {
      const res = await app.request('/api/dean/appeals', {
        headers: { 'X-Demo-Role': 'DEAN' },
      });
      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.appeals)).toBe(true);
    });

    it('GET /api/dean/faculty/assignments returns allocation map', async () => {
      const res = await app.request('/api/dean/faculty/assignments', {
        headers: { 'X-Demo-Role': 'DEAN' },
      });
      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.allocations).toBeDefined();
      expect(json.courses).toBeDefined();
      expect(json.lecturers).toBeDefined();
    });
  });
});
