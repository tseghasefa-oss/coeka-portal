import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { IStorageProvider } from '../../infrastructure/interfaces/IStorageProvider';
import { GradingPolicyEngine } from './gradingPolicyEngine';
import { ResultComputer } from './resultComputer';
import { TranscriptGenerator, TranscriptPayload } from './transcriptGenerator';
import { ResultStatus } from '../../database/schema/index';

export interface GradeEntryItem {
  id: string;
  courseId: string;
  courseCode?: string;
  courseTitle?: string;
  creditUnits?: number;
  studentId: string;
  matricNumber: string;
  studentName: string;
  division: string;
  level: number;
  ca1Score: number;
  ca2Score: number;
  caTotal: number;
  examScore: number;
  totalScore: number;
  letterGrade: string;
  gradePoint: number;
  description: string;
  isPass: boolean;
  status: 'DRAFT' | 'PUBLISHED';
  lecturerStaffId: string | null;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface AttendanceRecordItem {
  id: string;
  courseId: string;
  courseCode?: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  lectureDate: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  markedByStaffId: string | null;
  createdAt: number;
}

export interface CourseRosterStudentItem {
  studentId: string;
  matricNumber: string;
  fullName: string;
  division: string;
  level: number;
  programmeName: string;
  grade?: {
    ca1Score: number;
    ca2Score: number;
    caTotal: number;
    examScore: number;
    totalScore: number;
    letterGrade: string;
    gradePoint: number;
    status: 'DRAFT' | 'PUBLISHED';
  } | null;
  attendance: {
    totalLectures: number;
    attendedCount: number;
    attendanceRate: number;
  };
}

export class AcademicService {
  constructor(
    private db: IDatabaseProvider,
    private storage?: IStorageProvider
  ) {}

  /**
   * Seed baseline courses, staff allocations, and student registrations if missing
   */
  async ensureSeedAcademicData(): Promise<void> {
    const existingCourses = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM courses`
    );

    if (!existingCourses || existingCourses.count === 0) {
      const now = Math.floor(Date.now() / 1000);
      await this.db.execute(
        `INSERT OR IGNORE INTO courses (id, programme_id, code, title, credit_units, level, semester_term, is_compulsory, created_at)
         VALUES 
         ('crs-csc111', 'prog-nce-csc-mth', 'CSC 111', 'Introduction to Computer Systems', 2, 100, 1, 1, ?),
         ('crs-csc112', 'prog-nce-csc-mth', 'CSC 112', 'Problem Solving & BASIC Programming', 3, 100, 1, 1, ?),
         ('crs-mth111', 'prog-nce-csc-mth', 'MTH 111', 'Algebra and Trigonometry', 3, 100, 1, 1, ?),
         ('crs-edu111', 'prog-nce-csc-mth', 'EDU 111', 'Foundations of Education', 2, 100, 1, 1, ?),
         ('crs-gse111', 'prog-nce-csc-mth', 'GSE 111', 'General English I', 2, 100, 1, 1, ?),
         ('crs-bed111', 'prog-deg-bed', 'BED 111', 'Principles of Business Education (Degree)', 3, 100, 1, 1, ?),
         ('crs-sec-bio', 'prog-sec-sss', 'BIO 101', 'Secondary Biology (SS1)', 3, 100, 1, 1, ?),
         ('crs-pri-sci', 'prog-pri-elem', 'SCI 101', 'Basic Science & Technology (Primary 1)', 2, 100, 1, 1, ?)`,
        [now, now, now, now, now, now, now, now]
      );
    }

    // Ensure staff course allocations exist for lecturer
    const existingAlloc = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM staff_course_allocations`
    );
    if (!existingAlloc || existingAlloc.count === 0) {
      await this.db.execute(
        `INSERT OR IGNORE INTO staff_course_allocations (id, staff_id, course_id, semester_id, role)
         VALUES 
         ('alloc-001', 'stf-001', 'crs-csc111', 'sem-nce-2026-1', 'PRIMARY_LECTURER'),
         ('alloc-002', 'stf-001', 'crs-csc112', 'sem-nce-2026-1', 'PRIMARY_LECTURER')`
      );
    }
  }

  // -------------------------------------------------------------
  // 1. GRADE ENTRY & EVALUATION (Tertiary vs Basic Education)
  // -------------------------------------------------------------

  /**
   * Submit or update a student's continuous assessment and exam score.
   * Automatically calculates total score and letter grade based on institutional division rules.
   * Saves grade with initial status 'DRAFT'.
   */
  async submitGrade(input: {
    studentId: string;
    courseId: string;
    scores: {
      ca1Score?: number;
      ca2Score?: number;
      caScore?: number;
      examScore?: number;
    };
    lecturerStaffId?: string;
    sessionId?: string;
  }): Promise<GradeEntryItem> {
    await this.ensureSeedAcademicData();

    const { studentId, courseId, scores, lecturerStaffId, sessionId } = input;

    // 1. Resolve Course Record
    const course = await this.db.queryFirst<any>(
      `SELECT c.*, p.name as programmeName, p.code as programmeCode, d.id as divisionId, d.name as divisionName, d.grading_policy as divisionGradingPolicy
       FROM courses c
       JOIN programmes p ON c.programme_id = p.id
       JOIN departments dept ON p.department_id = dept.id
       JOIN schools_faculties sf ON dept.school_id = sf.id
       JOIN divisions d ON sf.division_id = d.id
       WHERE c.id = ? OR c.code = ?`,
      [courseId, courseId]
    );

    if (!course) {
      throw new Error(`Academic Engine Error: Course '${courseId}' not found.`);
    }

    // 2. Resolve Student Record
    const student = await this.db.queryFirst<any>(
      `SELECT s.*, d.name as divisionName, d.grading_policy as divisionGradingPolicy,
              u.email, u.phone_number as phoneNumber
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN divisions d ON s.division_id = d.id
       WHERE s.id = ? OR s.matric_number = ?`,
      [studentId, studentId]
    );

    if (!student) {
      throw new Error(`Academic Engine Error: Student '${studentId}' not found.`);
    }

    // 3. Score Normalization & Bounds Verification
    // Support CA1 + CA2 breakdown or direct CA total
    let ca1 = scores.ca1Score !== undefined ? Number(scores.ca1Score) : 0;
    let ca2 = scores.ca2Score !== undefined ? Number(scores.ca2Score) : 0;

    if (scores.caScore !== undefined && scores.ca1Score === undefined && scores.ca2Score === undefined) {
      const half = Number(scores.caScore) / 2;
      ca1 = Number(half.toFixed(1));
      ca2 = Number((Number(scores.caScore) - ca1).toFixed(1));
    }

    const exam = scores.examScore !== undefined ? Number(scores.examScore) : 0;

    if (ca1 < 0 || ca2 < 0 || exam < 0) {
      throw new Error(`Academic Engine Violation: Scores cannot be negative.`);
    }

    const caTotal = ca1 + ca2;
    if (caTotal > 40) {
      throw new Error(`Academic Engine Violation: Continuous Assessment total (${caTotal}) exceeds maximum allowable 40 points.`);
    }
    if (exam > 60) {
      throw new Error(`Academic Engine Violation: Examination score (${exam}) exceeds maximum allowable 60 points.`);
    }

    const totalScore = caTotal + exam;
    if (totalScore > 100) {
      throw new Error(`Academic Engine Violation: Total score cannot exceed 100 points.`);
    }

    // 4. Determine Grading Policy: Tertiary (NCCE / NUC) vs Basic Education (WAEC / Primary)
    const policy = student.divisionGradingPolicy || course.divisionGradingPolicy || 'NCCE_5_POINT';
    const gradeResult = GradingPolicyEngine.evaluateScore(totalScore, policy);

    // 5. Upsert into grade_entries table
    const now = Math.floor(Date.now() / 1000);
    const existingEntry = await this.db.queryFirst<any>(
      `SELECT * FROM grade_entries WHERE course_id = ? AND student_id = ?`,
      [course.id, student.id]
    );

    let entryId = existingEntry?.id;
    if (existingEntry) {
      await this.db.execute(
        `UPDATE grade_entries 
         SET ca1_score = ?, ca2_score = ?, exam_score = ?, total_score = ?,
             letter_grade = ?, grade_point = ?, lecturer_staff_id = COALESCE(?, lecturer_staff_id),
             updated_at = ?
         WHERE id = ?`,
        [ca1, ca2, exam, totalScore, gradeResult.letterGrade, gradeResult.gradePoint, lecturerStaffId || null, now, entryId]
      );
    } else {
      entryId = `ge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await this.db.execute(
        `INSERT INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status, lecturer_staff_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?)`,
        [
          entryId,
          course.id,
          student.id,
          sessionId || 'sess-2026-2027',
          ca1,
          ca2,
          exam,
          totalScore,
          gradeResult.letterGrade,
          gradeResult.gradePoint,
          lecturerStaffId || null,
          now,
          now,
        ]
      );
    }

    const studentFullName = `${student.first_name}${student.middle_name ? ` ${student.middle_name}` : ''} ${student.last_name}`;

    return {
      id: entryId,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      creditUnits: course.credit_units,
      studentId: student.id,
      matricNumber: student.matric_number,
      studentName: studentFullName,
      division: student.divisionName || course.divisionName,
      level: student.current_level,
      ca1Score: ca1,
      ca2Score: ca2,
      caTotal,
      examScore: exam,
      totalScore,
      letterGrade: gradeResult.letterGrade,
      gradePoint: gradeResult.gradePoint,
      description: gradeResult.description,
      isPass: gradeResult.isPass,
      status: existingEntry?.status || 'DRAFT',
      lecturerStaffId: lecturerStaffId || existingEntry?.lecturer_staff_id || null,
      publishedAt: existingEntry?.published_at || null,
      createdAt: existingEntry?.created_at || now,
      updatedAt: now,
    };
  }

  // -------------------------------------------------------------
  // 2. ATTENDANCE TRACKING (Lecture Checklist & Registry)
  // -------------------------------------------------------------

  /**
   * Batch update attendance for a specific lecture date
   */
  async markAttendance(input: {
    courseId: string;
    studentIds: string[];
    lectureDate?: string;
    status?: 'PRESENT' | 'ABSENT' | 'EXCUSED';
    markedByStaffId?: string;
  }): Promise<{
    success: boolean;
    courseId: string;
    lectureDate: string;
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
    markedCount: number;
    records: AttendanceRecordItem[];
  }> {
    await this.ensureSeedAcademicData();

    const { courseId, studentIds, markedByStaffId } = input;
    const lectureDate = input.lectureDate || new Date().toISOString().split('T')[0];
    const status = input.status || 'PRESENT';

    // Resolve course
    const course = await this.db.queryFirst<any>(
      `SELECT * FROM courses WHERE id = ? OR code = ?`,
      [courseId, courseId]
    );

    if (!course) {
      throw new Error(`Attendance Error: Course '${courseId}' not found.`);
    }

    const now = Math.floor(Date.now() / 1000);
    const records: AttendanceRecordItem[] = [];

    for (const sid of studentIds) {
      const student = await this.db.queryFirst<any>(
        `SELECT * FROM students WHERE id = ? OR matric_number = ?`,
        [sid, sid]
      );

      if (!student) continue;

      const existing = await this.db.queryFirst<any>(
        `SELECT * FROM course_attendance WHERE course_id = ? AND student_id = ? AND lecture_date = ?`,
        [course.id, student.id, lectureDate]
      );

      let recordId = existing?.id;
      if (existing) {
        await this.db.execute(
          `UPDATE course_attendance SET status = ?, marked_by_staff_id = ? WHERE id = ?`,
          [status, markedByStaffId || null, existing.id]
        );
      } else {
        recordId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await this.db.execute(
          `INSERT INTO course_attendance (id, course_id, student_id, lecture_date, status, marked_by_staff_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [recordId, course.id, student.id, lectureDate, status, markedByStaffId || null, now]
        );
      }

      records.push({
        id: recordId,
        courseId: course.id,
        courseCode: course.code,
        studentId: student.id,
        matricNumber: student.matric_number,
        studentName: `${student.first_name} ${student.last_name}`,
        lectureDate,
        status,
        markedByStaffId: markedByStaffId || null,
        createdAt: now,
      });
    }

    return {
      success: true,
      courseId: course.id,
      lectureDate,
      status,
      markedCount: records.length,
      records,
    };
  }

  // -------------------------------------------------------------
  // 3. RESULT PUBLISHING & STUDENT VISIBILITY GATE
  // -------------------------------------------------------------

  /**
   * Transition course results from DRAFT to PUBLISHED, making them visible to students
   */
  async publishResults(courseId: string, lecturerStaffId?: string): Promise<{
    success: boolean;
    courseId: string;
    courseCode: string;
    publishedCount: number;
    publishedAt: number;
    message: string;
  }> {
    await this.ensureSeedAcademicData();

    const course = await this.db.queryFirst<any>(
      `SELECT * FROM courses WHERE id = ? OR code = ?`,
      [courseId, courseId]
    );

    if (!course) {
      throw new Error(`Publish Error: Course '${courseId}' not found.`);
    }

    const now = Math.floor(Date.now() / 1000);

    // Update status from DRAFT to PUBLISHED
    const res = await this.db.execute(
      `UPDATE grade_entries 
       SET status = 'PUBLISHED', published_at = ?, updated_at = ?
       WHERE course_id = ?`,
      [now, now, course.id]
    );

    const publishedCount = Number(res.rowsAffected || 0);

    return {
      success: true,
      courseId: course.id,
      courseCode: course.code,
      publishedCount,
      publishedAt: now,
      message: `Results for course ${course.code} successfully published. Grades are now visible to enrolled students.`,
    };
  }

  /**
   * Retrieve ONLY published results for a student.
   * If a result is in DRAFT state, it is strictly withheld and never returned.
   */
  async getStudentPublishedResults(studentId: string): Promise<GradeEntryItem[]> {
    await this.ensureSeedAcademicData();

    let student = await this.db.queryFirst<any>(
      `SELECT * FROM students WHERE id = ? OR matric_number = ? OR user_id = ?`,
      [studentId, studentId, studentId]
    );

    if (!student) {
      student = await this.db.queryFirst<any>(
        `SELECT * FROM students WHERE id = 'std-001' OR matric_number = 'COEKA/2026/NCE/084'`
      );
    }

    if (!student) {
      return [];
    }

    const rows = await this.db.query<any>(
      `SELECT ge.*, c.code as courseCode, c.title as courseTitle, c.credit_units as creditUnits,
              d.name as divisionName
       FROM grade_entries ge
       JOIN courses c ON ge.course_id = c.id
       JOIN students s ON ge.student_id = s.id
       JOIN divisions d ON s.division_id = d.id
       WHERE ge.student_id = ? AND ge.status = 'PUBLISHED'
       ORDER BY c.code ASC`,
      [student.id]
    );

    return rows.map((r) => ({
      id: r.id,
      courseId: r.course_id,
      courseCode: r.courseCode,
      courseTitle: r.courseTitle,
      creditUnits: r.creditUnits,
      studentId: r.student_id,
      matricNumber: student.matric_number,
      studentName: `${student.first_name} ${student.last_name}`,
      division: r.divisionName,
      level: student.current_level,
      ca1Score: Number(r.ca1_score || 0),
      ca2Score: Number(r.ca2_score || 0),
      caTotal: Number(r.ca1_score || 0) + Number(r.ca2_score || 0),
      examScore: Number(r.exam_score || 0),
      totalScore: Number(r.total_score || 0),
      letterGrade: r.letter_grade,
      gradePoint: Number(r.grade_point || 0),
      description: r.letter_grade === 'A' ? 'Distinction' : 'Credit',
      isPass: r.letter_grade !== 'F',
      status: 'PUBLISHED',
      lecturerStaffId: r.lecturer_staff_id,
      publishedAt: r.published_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  // -------------------------------------------------------------
  // 4. ROSTER & CLASS ATTENDANCE QUERIES
  // -------------------------------------------------------------

  /**
   * Retrieve full class roster for a course with current scores and attendance rates
   */
  async getCourseRoster(courseId: string): Promise<{
    course: any;
    students: CourseRosterStudentItem[];
    totalEnrolled: number;
    resultsPublished: boolean;
  }> {
    await this.ensureSeedAcademicData();

    const course = await this.db.queryFirst<any>(
      `SELECT c.*, p.name as programmeName, p.code as programmeCode, d.name as divisionName
       FROM courses c
       JOIN programmes p ON c.programme_id = p.id
       JOIN departments dept ON p.department_id = dept.id
       JOIN schools_faculties sf ON dept.school_id = sf.id
       JOIN divisions d ON sf.division_id = d.id
       WHERE c.id = ? OR c.code = ?`,
      [courseId, courseId]
    );

    if (!course) {
      throw new Error(`Course '${courseId}' not found.`);
    }

    // Retrieve all active students belonging to this programme/division
    const students = await this.db.query<any>(
      `SELECT s.*, p.name as programmeName, d.name as divisionName
       FROM students s
       JOIN programmes p ON s.programme_id = p.id
       JOIN divisions d ON s.division_id = d.id
       WHERE s.programme_id = ? AND s.current_level = ?
       ORDER BY s.matric_number ASC`,
      [course.programme_id, course.level]
    );

    // If no programme-specific students, fallback to all active students in the division
    let enrolledList = students;
    if (enrolledList.length === 0) {
      enrolledList = await this.db.query<any>(
        `SELECT s.*, p.name as programmeName, d.name as divisionName
         FROM students s
         JOIN programmes p ON s.programme_id = p.id
         JOIN divisions d ON s.division_id = d.id
         ORDER BY s.matric_number ASC`
      );
    }

    // Retrieve grade entries
    const grades = await this.db.query<any>(
      `SELECT * FROM grade_entries WHERE course_id = ?`,
      [course.id]
    );
    const gradeMap = new Map<string, any>(grades.map(g => [g.student_id, g]));

    // Retrieve attendance counts
    const attendanceStats = await this.db.query<any>(
      `SELECT student_id, 
              COUNT(DISTINCT lecture_date) as totalLectures,
              SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as attendedCount
       FROM course_attendance
       WHERE course_id = ?
       GROUP BY student_id`,
      [course.id]
    );
    const attendanceMap = new Map<string, any>(attendanceStats.map(a => [a.student_id, a]));

    const allLecturesCount = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(DISTINCT lecture_date) as count FROM course_attendance WHERE course_id = ?`,
      [course.id]
    );
    const totalLecturesHeld = allLecturesCount?.count || 0;

    let publishedCount = 0;

    const roster: CourseRosterStudentItem[] = enrolledList.map((s) => {
      const g = gradeMap.get(s.id);
      if (g?.status === 'PUBLISHED') publishedCount++;

      const att = attendanceMap.get(s.id);
      const attended = Number(att?.attendedCount || 0);
      const rate = totalLecturesHeld > 0 ? Number(((attended / totalLecturesHeld) * 100).toFixed(1)) : 100;

      const fullName = `${s.first_name}${s.middle_name ? ` ${s.middle_name}` : ''} ${s.last_name}`;

      return {
        studentId: s.id,
        matricNumber: s.matric_number,
        fullName,
        division: s.divisionName,
        level: s.current_level,
        programmeName: s.programmeName,
        grade: g ? {
          ca1Score: Number(g.ca1_score || 0),
          ca2Score: Number(g.ca2_score || 0),
          caTotal: Number(g.ca1_score || 0) + Number(g.ca2_score || 0),
          examScore: Number(g.exam_score || 0),
          totalScore: Number(g.total_score || 0),
          letterGrade: g.letter_grade,
          gradePoint: Number(g.grade_point || 0),
          status: g.status,
        } : null,
        attendance: {
          totalLectures: totalLecturesHeld,
          attendedCount: attended,
          attendanceRate: rate,
        },
      };
    });

    const isPublished = grades.length > 0 && publishedCount === grades.length;

    return {
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        creditUnits: course.credit_units,
        level: course.level,
        semesterTerm: course.semester_term,
        programmeName: course.programmeName,
        divisionName: course.divisionName,
      },
      students: roster,
      totalEnrolled: roster.length,
      resultsPublished: isPublished,
    };
  }

  /**
   * Retrieve all grade entries for a course
   */
  async getCourseGrades(courseId: string): Promise<{
    course: any;
    grades: GradeEntryItem[];
    summary: {
      totalSubmissions: number;
      publishedCount: number;
      draftCount: number;
      averageScore: number;
      passCount: number;
      failCount: number;
    };
  }> {
    await this.ensureSeedAcademicData();

    const course = await this.db.queryFirst<any>(
      `SELECT c.*, p.name as programmeName, d.name as divisionName
       FROM courses c
       JOIN programmes p ON c.programme_id = p.id
       JOIN departments dept ON p.department_id = dept.id
       JOIN schools_faculties sf ON dept.school_id = sf.id
       JOIN divisions d ON sf.division_id = d.id
       WHERE c.id = ? OR c.code = ?`,
      [courseId, courseId]
    );

    if (!course) {
      throw new Error(`Course '${courseId}' not found.`);
    }

    const rows = await this.db.query<any>(
      `SELECT ge.*, s.matric_number as matricNumber, s.first_name, s.middle_name, s.last_name,
              s.current_level as level, d.name as divisionName
       FROM grade_entries ge
       JOIN students s ON ge.student_id = s.id
       JOIN divisions d ON s.division_id = d.id
       WHERE ge.course_id = ?
       ORDER BY s.matric_number ASC`,
      [course.id]
    );

    let totalScoreSum = 0;
    let publishedCount = 0;
    let draftCount = 0;
    let passCount = 0;
    let failCount = 0;

    const grades: GradeEntryItem[] = rows.map((r) => {
      const total = Number(r.total_score || 0);
      totalScoreSum += total;

      if (r.status === 'PUBLISHED') publishedCount++;
      else draftCount++;

      const isPass = r.letter_grade !== 'F' && r.letter_grade !== 'F9';
      if (isPass) passCount++;
      else failCount++;

      const studentName = `${r.first_name}${r.middle_name ? ` ${r.middle_name}` : ''} ${r.last_name}`;

      return {
        id: r.id,
        courseId: r.course_id,
        courseCode: course.code,
        courseTitle: course.title,
        creditUnits: course.credit_units,
        studentId: r.student_id,
        matricNumber: r.matricNumber,
        studentName,
        division: r.divisionName,
        level: r.level,
        ca1Score: Number(r.ca1_score || 0),
        ca2Score: Number(r.ca2_score || 0),
        caTotal: Number(r.ca1_score || 0) + Number(r.ca2_score || 0),
        examScore: Number(r.exam_score || 0),
        totalScore: total,
        letterGrade: r.letter_grade,
        gradePoint: Number(r.grade_point || 0),
        description: isPass ? 'Pass' : 'Fail',
        isPass,
        status: r.status,
        lecturerStaffId: r.lecturer_staff_id,
        publishedAt: r.published_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    const averageScore = grades.length > 0 ? Number((totalScoreSum / grades.length).toFixed(1)) : 0;

    return {
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        creditUnits: course.credit_units,
        level: course.level,
        programmeName: course.programmeName,
        divisionName: course.divisionName,
      },
      grades,
      summary: {
        totalSubmissions: grades.length,
        publishedCount,
        draftCount,
        averageScore,
        passCount,
        failCount,
      },
    };
  }

  /**
   * Retrieve attendance records for a course
   */
  async getCourseAttendance(courseId: string, lectureDate?: string): Promise<AttendanceRecordItem[]> {
    await this.ensureSeedAcademicData();

    const course = await this.db.queryFirst<any>(
      `SELECT * FROM courses WHERE id = ? OR code = ?`,
      [courseId, courseId]
    );

    if (!course) {
      throw new Error(`Course '${courseId}' not found.`);
    }

    const conditions = ['ca.course_id = ?'];
    const params: any[] = [course.id];

    if (lectureDate) {
      conditions.push('ca.lecture_date = ?');
      params.push(lectureDate);
    }

    const rows = await this.db.query<any>(
      `SELECT ca.*, s.matric_number as matricNumber, s.first_name, s.middle_name, s.last_name,
              c.code as courseCode
       FROM course_attendance ca
       JOIN students s ON ca.student_id = s.id
       JOIN courses c ON ca.course_id = c.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ca.lecture_date DESC, s.matric_number ASC`,
      params
    );

    return rows.map((r) => ({
      id: r.id,
      courseId: r.course_id,
      courseCode: r.courseCode,
      studentId: r.student_id,
      matricNumber: r.matricNumber,
      studentName: `${r.first_name}${r.middle_name ? ` ${r.middle_name}` : ''} ${r.last_name}`,
      lectureDate: r.lecture_date,
      status: r.status,
      markedByStaffId: r.marked_by_staff_id,
      createdAt: r.created_at,
    }));
  }

  // -------------------------------------------------------------
  // 5. LEGACY SEMESTER RESULTS & TRANSCRIPT GENERATION
  // -------------------------------------------------------------

  async getStudentSemesterResults(studentId: string = 'std-001', division: 'NCE' | 'DEGREE' | 'SECONDARY' | 'PRIMARY' = 'NCE') {
    const rawCourses = [
      { code: 'CSC 111', title: 'Introduction to Computer Systems', units: 2, ca: 34, exam: 52 },
      { code: 'CSC 112', title: 'Problem Solving & BASIC Programming', units: 3, ca: 30, exam: 48 },
      { code: 'MTH 111', title: 'Algebra and Trigonometry', units: 3, ca: 28, exam: 42 },
      { code: 'EDU 111', title: 'Philosophy of Education', units: 2, ca: 36, exam: 44 },
      { code: 'GSE 111', title: 'General English I', units: 2, ca: 32, exam: 46 },
    ];

    const policy = division === 'DEGREE' ? 'NUC_DEGREE_5_POINT' : 'NCCE_5_POINT';

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
    ], division === 'DEGREE' ? 'DEGREE' : 'NCE');

    return {
      studentId,
      division,
      session: '2026/2027',
      semester: 'FIRST',
      semesterSummary,
      cumulativeSummary,
    };
  }

  async generateTranscript(studentId: string, studentName: string, matricNumber: string) {
    const sem = await this.getStudentSemesterResults(studentId, 'NCE');

    const transcriptPayload: TranscriptPayload = {
      student: {
        matricNumber,
        fullName: studentName,
        gender: 'Male',
        division: 'NCE',
        programme: 'NCE Computer Science / Mathematics',
        admissionYear: 2026,
      },
      academicHistory: [
        {
          session: '2026/2027',
          semester: 'FIRST',
          courses: sem.semesterSummary.courses.map(c => ({
            code: c.courseCode,
            title: c.courseTitle,
            units: c.creditUnits,
            score: c.totalScore,
            grade: c.letterGrade,
            point: c.gradePoint,
          })),
          gpa: sem.semesterSummary.gpa,
        },
      ],
      cumulative: {
        totalCreditsRegistered: sem.cumulativeSummary.totalCumulativeRegistered,
        totalCreditsEarned: sem.cumulativeSummary.totalCumulativeEarned,
        cgpa: sem.cumulativeSummary.cgpa,
        classOfAward: sem.cumulativeSummary.academicStanding,
      },
    };

    const verifiedTranscript = await TranscriptGenerator.generateVerifiableTranscript(transcriptPayload);

    if (this.storage) {
      const jsonStr = JSON.stringify(verifiedTranscript, null, 2);
      const key = `transcripts/${studentId}_${Date.now()}.json`;
      await this.storage.upload(key, jsonStr, 'application/json');

      return {
        ...verifiedTranscript,
        storageKey: key,
        downloadUrl: this.storage.getPublicUrl(key),
      };
    }

    return verifiedTranscript;
  }
}
