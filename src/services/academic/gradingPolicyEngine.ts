import { GradingPolicy } from '../../types/domain';

export interface GradeResult {
  letterGrade: string;
  gradePoint: number;
  description: string;
  isPass: boolean;
}

export class GradingPolicyEngine {
  /**
   * Evaluate letter grade, grade point and pass/fail status
   * based on the specific institutional division's grading policy.
   */
  static evaluateScore(score: number, policy: GradingPolicy): GradeResult {
    const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

    switch (policy) {
      case 'NCCE_5_POINT': // NCE Standard (NCCE BMAS)
        if (clampedScore >= 70) return { letterGrade: 'A', gradePoint: 5.0, description: 'Distinction', isPass: true };
        if (clampedScore >= 60) return { letterGrade: 'B', gradePoint: 4.0, description: 'Credit', isPass: true };
        if (clampedScore >= 50) return { letterGrade: 'C', gradePoint: 3.0, description: 'Merit', isPass: true };
        if (clampedScore >= 40) return { letterGrade: 'D', gradePoint: 2.0, description: 'Pass', isPass: true };
        if (clampedScore >= 35) return { letterGrade: 'E', gradePoint: 1.0, description: 'Low Pass', isPass: true };
        return { letterGrade: 'F', gradePoint: 0.0, description: 'Fail', isPass: false };

      case 'NUC_DEGREE_5_POINT': // Degree Programme (NUC / Affiliated University Standard)
        if (clampedScore >= 70) return { letterGrade: 'A', gradePoint: 5.0, description: 'Excellent', isPass: true };
        if (clampedScore >= 60) return { letterGrade: 'B', gradePoint: 4.0, description: 'Very Good', isPass: true };
        if (clampedScore >= 50) return { letterGrade: 'C', gradePoint: 3.0, description: 'Good', isPass: true };
        if (clampedScore >= 45) return { letterGrade: 'D', gradePoint: 2.0, description: 'Fair', isPass: true };
        if (clampedScore >= 40) return { letterGrade: 'E', gradePoint: 1.0, description: 'Pass', isPass: true };
        return { letterGrade: 'F', gradePoint: 0.0, description: 'Fail', isPass: false };

      case 'SECONDARY_WAEC': // Demonstration Secondary School (WAEC/NECO Standard)
        if (clampedScore >= 75) return { letterGrade: 'A1', gradePoint: 1.0, description: 'Excellent', isPass: true };
        if (clampedScore >= 70) return { letterGrade: 'B2', gradePoint: 2.0, description: 'Very Good', isPass: true };
        if (clampedScore >= 65) return { letterGrade: 'B3', gradePoint: 3.0, description: 'Good', isPass: true };
        if (clampedScore >= 60) return { letterGrade: 'C4', gradePoint: 4.0, description: 'Credit', isPass: true };
        if (clampedScore >= 55) return { letterGrade: 'C5', gradePoint: 5.0, description: 'Credit', isPass: true };
        if (clampedScore >= 50) return { letterGrade: 'C6', gradePoint: 6.0, description: 'Credit', isPass: true };
        if (clampedScore >= 45) return { letterGrade: 'D7', gradePoint: 7.0, description: 'Pass', isPass: true };
        if (clampedScore >= 40) return { letterGrade: 'E8', gradePoint: 8.0, description: 'Pass', isPass: true };
        return { letterGrade: 'F9', gradePoint: 9.0, description: 'Fail', isPass: false };

      case 'PRIMARY_BASIC': // Staff Primary School
        if (clampedScore >= 80) return { letterGrade: 'A', gradePoint: 4.0, description: 'Excellent', isPass: true };
        if (clampedScore >= 70) return { letterGrade: 'B', gradePoint: 3.0, description: 'Very Good', isPass: true };
        if (clampedScore >= 60) return { letterGrade: 'C', gradePoint: 2.0, description: 'Good', isPass: true };
        if (clampedScore >= 50) return { letterGrade: 'D', gradePoint: 1.0, description: 'Fair', isPass: true };
        return { letterGrade: 'E', gradePoint: 0.0, description: 'Poor', isPass: false };

      default:
        throw new Error(`Unsupported grading policy: ${policy}`);
    }
  }
}
