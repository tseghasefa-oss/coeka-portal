export interface StorageUploadResult {
  url: string;
  key: string;
  sizeBytes: number;
  versionId?: string;
  mirrored?: boolean;
}

export interface StorageObjectVersion {
  versionId: string;
  key: string;
  sizeBytes: number;
  uploadedAt: number;
  isLatest: boolean;
  isDeleted?: boolean;
  contentType?: string;
}

export interface StorageUploadOptions {
  contentType?: string;
  isCritical?: boolean;
  mirror?: boolean;
  customMetadata?: Record<string, string>;
}

export interface IStorageProvider {
  /**
   * Upload an object with optional automated versioning and read-only cross-bucket mirroring.
   */
  upload(
    key: string,
    data: Uint8Array | ArrayBuffer | string,
    contentType?: string,
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult>;

  /**
   * Download an object. If versionId is specified, retrieves that specific historical revision.
   */
  download(key: string, versionId?: string): Promise<ArrayBuffer | null>;

  /**
   * Delete an object. If softDelete is true (default), archive as a soft-deleted tombstone
   * allowing instant restoration in case of accidental removal.
   */
  delete(key: string, softDelete?: boolean): Promise<void>;

  /**
   * Restore a previously soft-deleted or historical version of an object.
   */
  restore(key: string, versionId?: string): Promise<boolean>;

  /**
   * List all historical versions and soft-deleted states for an object key.
   */
  listVersions(key: string): Promise<StorageObjectVersion[]>;

  /**
   * Synchronize an object to the read-only secondary mirror bucket.
   */
  syncMirror(key: string): Promise<boolean>;

  /**
   * Get the public URL for the given key.
   */
  getPublicUrl(key: string): string;
}
