export interface CoursePerformance {
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  caScore: number;
  examScore: number;
  totalScore: number;
  letterGrade: string;
  gradePoint: number;
  qualityPoints: number; // creditUnits * gradePoint
  isPass: boolean;
}

export interface SemesterCalculationResult {
  totalCreditUnitsRegistered: number;
  totalCreditUnitsEarned: number;
  totalQualityPoints: number;
  gpa: number;
  courses: CoursePerformance[];
}

export interface CumulativeCalculationResult {
  totalCumulativeRegistered: number;
  totalCumulativeEarned: number;
  totalCumulativeQualityPoints: number;
  cgpa: number;
  academicStanding: string;
  isProbation: boolean;
}

export class ResultComputer {
  /**
   * Compute Semester GPA and breakdown
   */
  static computeSemesterGPA(
    courses: {
      courseCode: string;
      courseTitle: string;
      creditUnits: number;
      gradePoint: number;
      letterGrade: string;
      caScore: number;
      examScore: number;
      isPass: boolean;
    }[]
  ): SemesterCalculationResult {
    let totalRegistered = 0;
    let totalEarned = 0;
    let totalQualityPoints = 0;

    const coursePerformances: CoursePerformance[] = courses.map(c => {
      const totalScore = c.caScore + c.examScore;
      const qualityPoints = c.creditUnits * c.gradePoint;

      totalRegistered += c.creditUnits;
      if (c.isPass) {
        totalEarned += c.creditUnits;
      }
      totalQualityPoints += qualityPoints;

      return {
        courseCode: c.courseCode,
        courseTitle: c.courseTitle,
        creditUnits: c.creditUnits,
        caScore: c.caScore,
        examScore: c.examScore,
        totalScore,
        letterGrade: c.letterGrade,
        gradePoint: c.gradePoint,
        qualityPoints,
        isPass: c.isPass,
      };
    });

    const gpa = totalRegistered > 0 ? Number((totalQualityPoints / totalRegistered).toFixed(2)) : 0.0;

    return {
      totalCreditUnitsRegistered: totalRegistered,
      totalCreditUnitsEarned: totalEarned,
      totalQualityPoints,
      gpa,
      courses: coursePerformances,
    };
  }

  /**
   * Compute Cumulative Grade Point Average (CGPA) and determine Academic Standing
   */
  static computeCGPA(
    semesters: {
      registeredUnits: number;
      earnedUnits: number;
      qualityPoints: number;
    }[],
    division: 'NCE' | 'DEGREE' = 'NCE'
  ): CumulativeCalculationResult {
    let totalRegistered = 0;
    let totalEarned = 0;
    let totalQualityPoints = 0;

    for (const sem of semesters) {
      totalRegistered += sem.registeredUnits;
      totalEarned += sem.earnedUnits;
      totalQualityPoints += sem.qualityPoints;
    }

    const cgpa = totalRegistered > 0 ? Number((totalQualityPoints / totalRegistered).toFixed(2)) : 0.0;

    // Academic Standing determination
    let academicStanding = 'Pass';
    let isProbation = false;

    if (division === 'NCE') {
      if (cgpa >= 4.50) academicStanding = 'Distinction';
      else if (cgpa >= 3.50) academicStanding = 'Credit';
      else if (cgpa >= 2.40) academicStanding = 'Merit';
      else if (cgpa >= 1.50) academicStanding = 'Pass';
      else {
        academicStanding = 'Probation / Poor Academic Standing';
        isProbation = true;
      }
    } else {
      // Degree standard
      if (cgpa >= 4.50) academicStanding = 'First Class Honours';
      else if (cgpa >= 3.50) academicStanding = 'Second Class Honours (Upper Division)';
      else if (cgpa >= 2.40) academicStanding = 'Second Class Honours (Lower Division)';
      else if (cgpa >= 1.50) academicStanding = 'Third Class Honours';
      else {
        academicStanding = 'Academic Probation';
        isProbation = true;
      }
    }

    return {
      totalCumulativeRegistered: totalRegistered,
      totalCumulativeEarned: totalEarned,
      totalCumulativeQualityPoints: totalQualityPoints,
      cgpa,
      academicStanding,
      isProbation,
    };
  }
}
