import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { IStorageProvider } from '../../infrastructure/interfaces/IStorageProvider';
import { ScreeningEngine, ScreeningEvaluationInput, ScreeningResult } from './screeningEngine';

export class AdmissionsService {
  constructor(
    private db: IDatabaseProvider,
    private storage: IStorageProvider
  ) {}

  screenApplicant(input: ScreeningEvaluationInput): ScreeningResult {
    return ScreeningEngine.evaluateApplication(input);
  }

  async uploadCredential(applicantId: string, filename: string, data: Uint8Array | ArrayBuffer | string, contentType: string) {
    const key = `admissions/${applicantId}/${filename}`;
    return await this.storage.upload(key, data, contentType);
  }
}
