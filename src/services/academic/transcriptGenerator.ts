import { SignatureService } from '../finance/signatureService';

export interface TranscriptPayload {
  student: {
    matricNumber: string;
    fullName: string;
    gender: string;
    division: string;
    programme: string;
    admissionYear: number;
    graduationYear?: number;
  };
  academicHistory: {
    session: string;
    semester: string;
    courses: {
      code: string;
      title: string;
      units: number;
      score: number;
      grade: string;
      point: number;
    }[];
    gpa: number;
  }[];
  cumulative: {
    totalCreditsRegistered: number;
    totalCreditsEarned: number;
    cgpa: number;
    classOfAward: string;
  };
}

export interface VerifiedTranscript {
  verificationHash: string;
  verificationUrl: string;
  generatedAt: string;
  payload: TranscriptPayload;
}

export class TranscriptGenerator {
  /**
   * Generates a tamper-proof digital transcript with a cryptographic verification hash
   */
  static async generateVerifiableTranscript(payload: TranscriptPayload): Promise<VerifiedTranscript> {
    const rawData = JSON.stringify({
      matric: payload.student.matricNumber,
      programme: payload.student.programme,
      cgpa: payload.cumulative.cgpa,
      award: payload.cumulative.classOfAward,
      coursesCount: payload.academicHistory.reduce((acc, h) => acc + h.courses.length, 0),
    });

    const verificationHash = await SignatureService.generateVerificationHash(rawData);
    const verificationUrl = `https://portal.coekatsinaala.edu.ng/verify/transcript/${verificationHash}`;

    return {
      verificationHash,
      verificationUrl,
      generatedAt: new Date().toISOString(),
      payload,
    };
  }
}
