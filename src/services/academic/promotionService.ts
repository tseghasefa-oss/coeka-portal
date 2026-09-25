import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { PrerequisiteChecker, CarryOverCourseItem } from './prerequisiteChecker';
import { ResultComputer } from './resultComputer';

export interface StudentPromotionEvaluation {
  studentId: string;
  matricNumber: string;
  fullName: string;
  previousLevel: number;
  newLevel: number;
  cgpa: number;
  status: 'PROMOTED' | 'PROBATION' | 'GRADUATED' | 'WITHDRAWN';
  academicStatus: string;
  hasCarryOvers: boolean;
  carryOvers: CarryOverCourseItem[];
  message: string;
}

export interface BatchPromotionResult {
  totalEvaluated: number;
  promotedCount: number;
  probationCount: number;
  graduatedCount: number;
  carryOverCount: number;
  promotions: StudentPromotionEvaluation[];
}

export class PromotionService {
  private prerequisiteChecker: PrerequisiteChecker;

  constructor(private db: IDatabaseProvider) {
    this.prerequisiteChecker = new PrerequisiteChecker(db);
  }

  /**
   * Evaluate a single student for year-end progression based on CGPA and carry-overs
   */
  async evaluateStudentPromotion(studentId: string): Promise<StudentPromotionEvaluation> {
    const student = await this.db.queryFirst<any>(
      `SELECT s.*, d.code as divisionCode, p.total_semesters as totalSemesters
       FROM students s
       LEFT JOIN divisions d ON s.division_id = d.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       WHERE s.id = ? OR s.matric_number = ?`,
      [studentId, studentId]
    );

    if (!student) {
      throw new Error(`Student '${studentId}' not found.`);
    }

    const currentLevel = Number(student.current_level || 100);
    const divisionCode = (student.divisionCode || 'NCE').toUpperCase();
    const isDegree = divisionCode === 'DEGREE';
    const fullName = `${student.first_name}${student.middle_name ? ` ${student.middle_name}` : ''} ${student.last_name}`;

    // 1. Scan for carry-over courses
    const carryOvers = await this.prerequisiteChecker.identifyCarryOvers(student.id);

    // 2. Retrieve published grades and calculate CGPA
    const grades = await this.db.query<any>(
      `SELECT ge.*, c.credit_units as creditUnits
       FROM grade_entries ge
       JOIN courses c ON ge.course_id = c.id
       WHERE ge.student_id = ? AND ge.status = 'PUBLISHED'`,
      [student.id]
    );

    let cgpa = 4.50; // Default baseline if newly admitted or no grades yet
    if (grades && grades.length > 0) {
      let totalUnits = 0;
      let totalPoints = 0;
      for (const g of grades) {
        const units = Number(g.creditUnits || 2);
        const pt = Number(g.grade_point || 0);
        totalUnits += units;
        totalPoints += units * pt;
      }
      cgpa = totalUnits > 0 ? Number((totalPoints / totalUnits).toFixed(2)) : 0;
    }

    // 3. Determine Progression Logic
    let newLevel = currentLevel;
    let status: 'PROMOTED' | 'PROBATION' | 'GRADUATED' | 'WITHDRAWN' = 'PROMOTED';
    let academicStatus = 'ACTIVE';
    let message = '';

    // Institutional Cut-off: CGPA >= 1.00 is required for clear progression
    if (cgpa < 1.00) {
      status = 'PROBATION';
      academicStatus = 'PROBATION';
      message = `Academic Standing Low: CGPA (${cgpa.toFixed(2)}) is below minimum 1.00. Student placed on Academic Probation.`;
    } else {
      // Check maximum levels (NCE = 300L max, Degree = 400L max)
      const maxLevel = isDegree ? 400 : 300;

      if (currentLevel >= maxLevel) {
        status = 'GRADUATED';
        academicStatus = 'GRADUATED';
        newLevel = currentLevel;
        message = `Graduation Requirements Met: Student has successfully completed final ${maxLevel} Level with CGPA ${cgpa.toFixed(2)}.`;
      } else {
        newLevel = currentLevel + 100;
        status = 'PROMOTED';
        academicStatus = 'ACTIVE';
        message = `Successfully Promoted from ${currentLevel} Level to ${newLevel} Level.`;
        if (carryOvers.length > 0) {
          message += ` Note: Student has ${carryOvers.length} carry-over course(s) to clear.`;
        }
      }
    }

    return {
      studentId: student.id,
      matricNumber: student.matric_number,
      fullName,
      previousLevel: currentLevel,
      newLevel,
      cgpa,
      status,
      academicStatus,
      hasCarryOvers: carryOvers.length > 0,
      carryOvers,
      message,
    };
  }

  /**
   * Promote all eligible students across an entire division or level
   */
  async promoteAllEligibleStudents(options: {
    divisionCode?: string;
    fromLevel?: number;
  } = {}): Promise<BatchPromotionResult> {
    const conditions: string[] = ["s.academic_status != 'GRADUATED' AND s.academic_status != 'WITHDRAWN'"];
    const params: any[] = [];

    if (options.fromLevel) {
      conditions.push('s.current_level = ?');
      params.push(options.fromLevel);
    }

    const students = await this.db.query<any>(
      `SELECT s.id FROM students s WHERE ${conditions.join(' AND ')}`,
      params
    );

    const evaluations: StudentPromotionEvaluation[] = [];
    let promotedCount = 0;
    let probationCount = 0;
    let graduatedCount = 0;
    let carryOverCount = 0;

    for (const s of students || []) {
      const evaluation = await this.evaluateStudentPromotion(s.id);
      evaluations.push(evaluation);

      if (evaluation.status === 'PROMOTED') {
        promotedCount++;
        // Update DB
        await this.db.execute(
          `UPDATE students SET current_level = ?, academic_status = 'ACTIVE' WHERE id = ?`,
          [evaluation.newLevel, evaluation.studentId]
        );
      } else if (evaluation.status === 'GRADUATED') {
        graduatedCount++;
        await this.db.execute(
          `UPDATE students SET academic_status = 'GRADUATED' WHERE id = ?`,
          [evaluation.studentId]
        );
      } else if (evaluation.status === 'PROBATION') {
        probationCount++;
        await this.db.execute(
          `UPDATE students SET academic_status = 'PROBATION' WHERE id = ?`,
          [evaluation.studentId]
        );
      }

      if (evaluation.hasCarryOvers) {
        carryOverCount += evaluation.carryOvers.length;
      }
    }

    return {
      totalEvaluated: evaluations.length,
      promotedCount,
      probationCount,
      graduatedCount,
      carryOverCount,
      promotions: evaluations,
    };
  }
}
