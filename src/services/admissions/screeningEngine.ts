export interface OLevelSubjectGrade {
  subject: string;
  grade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';
}

export interface ScreeningEvaluationInput {
  division: 'NCE' | 'DEGREE' | 'SECONDARY' | 'PRIMARY';
  jambScore?: number;
  oLevelSubjects: OLevelSubjectGrade[];
  departmentCutOff: number;
}

export interface ScreeningResult {
  isEligible: boolean;
  creditPassesCount: number;
  hasEnglishAndMath: boolean;
  totalCompositeScore: number;
  recommendation: 'ADMIT' | 'REJECT' | 'SUPPLEMENTARY';
  reason: string;
}

export class ScreeningEngine {
  /**
   * Evaluate applicant eligibility against institutional criteria
   */
  static evaluateApplication(input: ScreeningEvaluationInput): ScreeningResult {
    // 1. Check O-Level credits (C6 or better)
    const creditGrades = new Set(['A1', 'B2', 'B3', 'C4', 'C5', 'C6']);
    let creditCount = 0;
    let hasEnglish = false;
    let hasMath = false;

    for (const sub of input.oLevelSubjects) {
      const subjectLower = sub.subject.toLowerCase();
      const isCredit = creditGrades.has(sub.grade);

      if (isCredit) {
        creditCount++;
        if (subjectLower.includes('english')) hasEnglish = true;
        if (subjectLower.includes('math')) hasMath = true;
      }
    }

    const hasEnglishAndMath = hasEnglish && hasMath;

    // 2. JAMB Cut-off check for tertiary divisions
    let jambPassed = true;
    let compositeScore = 0;

    if (input.division === 'NCE') {
      const jamb = input.jambScore || 0;
      compositeScore = jamb;
      jambPassed = jamb >= (input.departmentCutOff || 100); // Standard NCCE cut-off is 100
    } else if (input.division === 'DEGREE') {
      const jamb = input.jambScore || 0;
      compositeScore = jamb;
      jambPassed = jamb >= (input.departmentCutOff || 140); // Degree cut-off benchmark
    } else {
      // Basic / Secondary entrance examination score
      compositeScore = input.jambScore || 70;
      jambPassed = compositeScore >= 50;
    }

    // 3. Overall eligibility determination
    let recommendation: 'ADMIT' | 'REJECT' | 'SUPPLEMENTARY' = 'REJECT';
    let reason = '';

    if (creditCount >= 5 && hasEnglishAndMath && jambPassed) {
      recommendation = 'ADMIT';
      reason = 'Applicant fulfills all statutory O-Level credit requirements and exceeds the departmental cut-off score.';
    } else if (creditCount >= 4 && jambPassed) {
      recommendation = 'SUPPLEMENTARY';
      reason = 'Applicant qualified for consideration in supplementary admissions list pending credit deficiency rectification.';
    } else {
      recommendation = 'REJECT';
      reason = 'Applicant does not meet minimum academic entry requirements.';
    }

    return {
      isEligible: recommendation === 'ADMIT',
      creditPassesCount: creditCount,
      hasEnglishAndMath,
      totalCompositeScore: compositeScore,
      recommendation,
      reason,
    };
  }
}
