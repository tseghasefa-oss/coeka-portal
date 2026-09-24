import { describe, it, expect } from 'vitest';
import { GradingPolicyEngine } from '../src/services/academic/gradingPolicyEngine';
import { ResultComputer } from '../src/services/academic/resultComputer';

describe('COEKA Multi-Track Academic Grading Engine', () => {
  it('correctly evaluates NCE 5-point grading standards', () => {
    expect(GradingPolicyEngine.evaluateScore(75, 'NCCE_5_POINT')).toEqual({
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

    expect(GradingPolicyEngine.evaluateScore(42, 'NCCE_5_POINT')).toEqual({
      letterGrade: 'D',
      gradePoint: 2.0,
      description: 'Pass',
      isPass: true,
    });

    expect(GradingPolicyEngine.evaluateScore(30, 'NCCE_5_POINT')).toEqual({
      letterGrade: 'F',
      gradePoint: 0.0,
      description: 'Fail',
      isPass: false,
    });
  });

  it('correctly evaluates Demonstration Secondary School WAEC grading', () => {
    expect(GradingPolicyEngine.evaluateScore(80, 'SECONDARY_WAEC').letterGrade).toBe('A1');
    expect(GradingPolicyEngine.evaluateScore(62, 'SECONDARY_WAEC').letterGrade).toBe('C4');
    expect(GradingPolicyEngine.evaluateScore(48, 'SECONDARY_WAEC').letterGrade).toBe('D7');
    expect(GradingPolicyEngine.evaluateScore(35, 'SECONDARY_WAEC').letterGrade).toBe('F9');
  });

  it('accurately computes semester GPA and quality points', () => {
    const courses = [
      { courseCode: 'CSC 111', courseTitle: 'Intro to CS', creditUnits: 2, gradePoint: 5.0, letterGrade: 'A', caScore: 34, examScore: 52, isPass: true },
      { courseCode: 'CSC 112', courseTitle: 'Programming', creditUnits: 3, gradePoint: 4.0, letterGrade: 'B', caScore: 30, examScore: 38, isPass: true },
      { courseCode: 'MTH 111', courseTitle: 'Algebra', creditUnits: 3, gradePoint: 3.0, letterGrade: 'C', caScore: 24, examScore: 32, isPass: true },
    ];

    // (2*5 + 3*4 + 3*3) = 10 + 12 + 9 = 31 quality points
    // 31 / 8 units = 3.875 -> 3.88
    const result = ResultComputer.computeSemesterGPA(courses);
    expect(result.totalCreditUnitsRegistered).toBe(8);
    expect(result.totalCreditUnitsEarned).toBe(8);
    expect(result.totalQualityPoints).toBe(31);
    expect(result.gpa).toBe(3.88);
  });

  it('accurately computes cumulative CGPA and academic standing', () => {
    const semesters = [
      { registeredUnits: 15, earnedUnits: 15, qualityPoints: 60 }, // GPA: 4.0
      { registeredUnits: 15, earnedUnits: 15, qualityPoints: 67.5 }, // GPA: 4.5
    ];

    // 127.5 / 30 = 4.25
    const cgpaResult = ResultComputer.computeCGPA(semesters, 'NCE');
    expect(cgpaResult.cgpa).toBe(4.25);
    expect(cgpaResult.academicStanding).toBe('Credit');
    expect(cgpaResult.isProbation).toBe(false);
  });

  it('flags academic probation if CGPA drops below threshold', () => {
    const semesters = [
      { registeredUnits: 15, earnedUnits: 3, qualityPoints: 12 }, // GPA: 0.8
    ];

    const cgpaResult = ResultComputer.computeCGPA(semesters, 'NCE');
    expect(cgpaResult.cgpa).toBe(0.8);
    expect(cgpaResult.isProbation).toBe(true);
  });
});
