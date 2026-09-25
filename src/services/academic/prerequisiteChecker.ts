import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';

export interface CarryOverCourseItem {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  failingScore: number;
  letterGrade: string;
  semesterTerm: number;
  isCompulsory: boolean;
  level: number;
}

export interface PrerequisiteCheckResult {
  isEligible: boolean;
  targetCourseId: string;
  targetCourseCode: string;
  prerequisiteCourseId?: string;
  prerequisiteCourseCode?: string;
  message: string;
  reason?: string;
}

export class PrerequisiteChecker {
  constructor(private db: IDatabaseProvider) {}

  /**
   * Scan published results and identify all courses the student must carry over
   */
  async identifyCarryOvers(studentId: string): Promise<CarryOverCourseItem[]> {
    try {
      const failedGrades = await this.db.query<any>(
        `SELECT ge.*, c.code as courseCode, c.title as courseTitle, c.credit_units as creditUnits,
                c.is_compulsory as isCompulsory, c.level, c.semester_term as semesterTerm
         FROM grade_entries ge
         JOIN courses c ON ge.course_id = c.id
         WHERE ge.student_id = ?
           AND (ge.letter_grade = 'F' OR ge.letter_grade = 'F9' OR ge.total_score < 40)
         ORDER BY c.code ASC`,
        [studentId]
      );

      if (failedGrades && failedGrades.length > 0) {
        return failedGrades.map((g) => ({
          courseId: g.course_id,
          courseCode: g.courseCode,
          courseTitle: g.courseTitle,
          creditUnits: Number(g.creditUnits || 2),
          failingScore: Number(g.total_score || 0),
          letterGrade: g.letter_grade,
          semesterTerm: Number(g.semesterTerm || 1),
          isCompulsory: Boolean(g.isCompulsory),
          level: Number(g.level || 100),
        }));
      }
    } catch {
      // Fallback
    }

    return [];
  }

  /**
   * Check if a student is allowed to register for an advanced course based on prerequisite clearance
   */
  async checkPrerequisiteEligibility(
    studentId: string,
    targetCourseIdOrCode: string,
    explicitPrerequisiteId?: string
  ): Promise<PrerequisiteCheckResult> {
    const course = await this.db.queryFirst<any>(
      `SELECT c.*, pre.code as preCode, pre.title as preTitle
       FROM courses c
       LEFT JOIN courses pre ON c.prerequisite_course_id = pre.id
       WHERE c.id = ? OR c.code = ?`,
      [targetCourseIdOrCode, targetCourseIdOrCode]
    );

    const preId = explicitPrerequisiteId || course?.prerequisite_course_id;

    if (!preId) {
      return {
        isEligible: true,
        targetCourseId: course?.id || targetCourseIdOrCode,
        targetCourseCode: course?.code || targetCourseIdOrCode,
        message: course ? `Course ${course.code} has no prerequisite requirements.` : 'Course has no defined prerequisites.',
        reason: 'Course has no defined prerequisites.',
      };
    }

    // Check if prerequisite course was passed in published grades
    const passedRecord = await this.db.queryFirst<any>(
      `SELECT * FROM grade_entries
       WHERE student_id = ? AND course_id = ?
         AND letter_grade != 'F' AND letter_grade != 'F9' AND total_score >= 40`,
      [studentId, preId]
    );

    if (!passedRecord) {
      const preCode = course?.preCode || preId;
      const msg = `Failed prerequisite requirement: Student has not passed prerequisite course (${preCode}).`;
      return {
        isEligible: false,
        targetCourseId: course?.id || targetCourseIdOrCode,
        targetCourseCode: course?.code || targetCourseIdOrCode,
        prerequisiteCourseId: preId,
        prerequisiteCourseCode: preCode,
        message: msg,
        reason: msg,
      };
    }

    return {
      isEligible: true,
      targetCourseId: course?.id || targetCourseIdOrCode,
      targetCourseCode: course?.code || targetCourseIdOrCode,
      prerequisiteCourseId: preId,
      prerequisiteCourseCode: course?.preCode || preId,
      message: `Prerequisite requirement met for ${course?.code || targetCourseIdOrCode}.`,
      reason: `Prerequisite requirement met.`,
    };
  }
}
