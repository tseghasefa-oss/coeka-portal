import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { IStorageProvider } from '../../infrastructure/interfaces/IStorageProvider';
import { GradingPolicyEngine } from './gradingPolicyEngine';
import { ResultComputer } from './resultComputer';
import { TranscriptGenerator, TranscriptPayload } from './transcriptGenerator';

export class AcademicService {
  constructor(
    private db: IDatabaseProvider,
    private storage: IStorageProvider
  ) {}

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

    // Save record archive to storage provider
    const jsonStr = JSON.stringify(verifiedTranscript, null, 2);
    const key = `transcripts/${studentId}_${Date.now()}.json`;
    await this.storage.upload(key, jsonStr, 'application/json');

    return {
      ...verifiedTranscript,
      storageKey: key,
      downloadUrl: this.storage.getPublicUrl(key),
    };
  }
}
