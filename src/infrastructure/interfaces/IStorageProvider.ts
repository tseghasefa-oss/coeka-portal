export interface StorageUploadResult {
  url: string;
  key: string;
  sizeBytes: number;
}

export interface IStorageProvider {
  upload(
    key: string,
    data: Uint8Array | ArrayBuffer | string,
    contentType?: string
  ): Promise<StorageUploadResult>;
  download(key: string): Promise<ArrayBuffer | null>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
