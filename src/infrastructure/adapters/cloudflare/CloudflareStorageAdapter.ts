import {
  IStorageProvider,
  StorageUploadResult,
  StorageObjectVersion,
  StorageUploadOptions,
} from '../../interfaces/IStorageProvider';

export class CloudflareStorageAdapter implements IStorageProvider {
  private bucket: R2Bucket;
  private mirrorBucket?: R2Bucket;
  private publicBaseUrl: string;

  constructor(
    bucket: R2Bucket,
    publicBaseUrl: string = 'https://assets.coekatsinaala.edu.ng',
    mirrorBucket?: R2Bucket
  ) {
    this.bucket = bucket;
    this.publicBaseUrl = publicBaseUrl;
    this.mirrorBucket = mirrorBucket;
  }

  /**
   * Uploads an object with automated revision tracking and multi-region read-only mirroring for critical documents.
   */
  async upload(
    key: string,
    data: Uint8Array | ArrayBuffer | string,
    contentType: string = 'application/octet-stream',
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    const timestamp = Date.now();
    const versionId = `v_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;
    const effectiveContentType = options?.contentType || contentType;

    const customMetadata = {
      versionId,
      uploadedAt: String(timestamp),
      isCritical: String(Boolean(options?.isCritical)),
      ...(options?.customMetadata || {}),
    };

    // 1. Store primary active object
    const object = await this.bucket.put(key, data, {
      httpMetadata: { contentType: effectiveContentType },
      customMetadata,
    });

    // 2. Store immutable historical snapshot under version hierarchy for disaster recovery
    const versionKey = `.versions/${key}/${versionId}`;
    await this.bucket.put(versionKey, data, {
      httpMetadata: { contentType: effectiveContentType },
      customMetadata: { ...customMetadata, originalKey: key },
    });

    // 3. Mirror critical assets (certificates, transcripts, passports) to secondary R2 mirror bucket
    let mirrored = false;
    if ((options?.isCritical || options?.mirror) && this.mirrorBucket) {
      try {
        await this.mirrorBucket.put(key, data, {
          httpMetadata: { contentType: effectiveContentType },
          customMetadata: { ...customMetadata, replicatedAt: String(Date.now()) },
        });
        mirrored = true;
      } catch (err) {
        console.error(`[Storage Mirroring Warning] Failed to mirror critical key ${key}:`, err);
      }
    }

    return {
      key,
      url: `${this.publicBaseUrl}/${key}`,
      sizeBytes: object.size,
      versionId,
      mirrored,
    };
  }

  /**
   * Downloads the active object or a specific historical version.
   * If primary bucket encounters an outage, falls back to the read-only mirror.
   */
  async download(key: string, versionId?: string): Promise<ArrayBuffer | null> {
    const targetKey = versionId ? `.versions/${key}/${versionId}` : key;
    let object = await this.bucket.get(targetKey);

    // High-Availability Read-Only Failover: attempt mirror bucket if primary missing and no versionId requested
    if (!object && !versionId && this.mirrorBucket) {
      try {
        object = await this.mirrorBucket.get(key);
      } catch {
        // Fallback exhausted
      }
    }

    if (!object) return null;
    return await object.arrayBuffer();
  }

  /**
   * Deletes an object. If softDelete is true (default), preserves the file in a tombstone
   * location allowing instant recovery if a passport or certificate was deleted in error.
   */
  async delete(key: string, softDelete: boolean = true): Promise<void> {
    if (softDelete) {
      const activeObj = await this.bucket.get(key);
      if (activeObj) {
        const data = await activeObj.arrayBuffer();
        const tombstoneKey = `.deleted/${key}/${Date.now()}`;
        await this.bucket.put(tombstoneKey, data, {
          httpMetadata: activeObj.httpMetadata,
          customMetadata: {
            deletedAt: String(Date.now()),
            originalKey: key,
          },
        });
      }
    }

    await this.bucket.delete(key);
  }

  /**
   * Restores a previously soft-deleted or historical version back to active production status.
   */
  async restore(key: string, versionId?: string): Promise<boolean> {
    if (versionId) {
      const versionKey = `.versions/${key}/${versionId}`;
      const versionObj = await this.bucket.get(versionKey);
      if (!versionObj) return false;

      const data = await versionObj.arrayBuffer();
      await this.bucket.put(key, data, {
        httpMetadata: versionObj.httpMetadata,
        customMetadata: {
          restoredFromVersion: versionId,
          restoredAt: String(Date.now()),
        },
      });
      return true;
    }

    // Restore from most recent tombstone in .deleted/
    const deletedList = await this.bucket.list({ prefix: `.deleted/${key}/` });
    if (!deletedList.objects || deletedList.objects.length === 0) {
      // If no tombstone, try restoring most recent version
      const versions = await this.listVersions(key);
      if (versions.length > 0) {
        return await this.restore(key, versions[0].versionId);
      }
      return false;
    }

    // Pick latest deleted object
    const sorted = deletedList.objects.sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime());
    const latestDeleted = sorted[0];
    const obj = await this.bucket.get(latestDeleted.key);
    if (!obj) return false;

    const data = await obj.arrayBuffer();
    await this.bucket.put(key, data, {
      httpMetadata: obj.httpMetadata,
      customMetadata: {
        restoredFromTombstone: latestDeleted.key,
        restoredAt: String(Date.now()),
      },
    });

    return true;
  }

  /**
   * Lists all historical revisions and recovery points for a key.
   */
  async listVersions(key: string): Promise<StorageObjectVersion[]> {
    const results: StorageObjectVersion[] = [];
    const prefix = `.versions/${key}/`;

    const listed = await this.bucket.list({ prefix });
    for (const obj of listed.objects) {
      const parts = obj.key.split('/');
      const versionId = parts[parts.length - 1];
      results.push({
        versionId,
        key,
        sizeBytes: obj.size,
        uploadedAt: obj.uploaded.getTime(),
        isLatest: false,
      });
    }

    // Sort newest first
    results.sort((a, b) => b.uploadedAt - a.uploadedAt);
    if (results.length > 0) {
      results[0].isLatest = true;
    }

    return results;
  }

  /**
   * Explicitly mirrors an object to the read-only secondary bucket.
   */
  async syncMirror(key: string): Promise<boolean> {
    if (!this.mirrorBucket) return false;

    const activeObj = await this.bucket.get(key);
    if (!activeObj) return false;

    const data = await activeObj.arrayBuffer();
    await this.mirrorBucket.put(key, data, {
      httpMetadata: activeObj.httpMetadata,
      customMetadata: {
        replicatedAt: String(Date.now()),
      },
    });

    return true;
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}
