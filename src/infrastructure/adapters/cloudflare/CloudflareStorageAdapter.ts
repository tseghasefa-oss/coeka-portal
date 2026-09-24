import { IStorageProvider, StorageUploadResult } from '../../interfaces/IStorageProvider';

export class CloudflareStorageAdapter implements IStorageProvider {
  private bucket: R2Bucket;
  private publicBaseUrl: string;

  constructor(bucket: R2Bucket, publicBaseUrl: string = 'https://assets.coekatsinaala.edu.ng') {
    this.bucket = bucket;
    this.publicBaseUrl = publicBaseUrl;
  }

  async upload(
    key: string,
    data: Uint8Array | ArrayBuffer | string,
    contentType: string = 'application/octet-stream'
  ): Promise<StorageUploadResult> {
    const object = await this.bucket.put(key, data, {
      httpMetadata: { contentType },
    });

    return {
      key,
      url: `${this.publicBaseUrl}/${key}`,
      sizeBytes: object.size,
    };
  }

  async download(key: string): Promise<ArrayBuffer | null> {
    const object = await this.bucket.get(key);
    if (!object) return null;
    return await object.arrayBuffer();
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}
