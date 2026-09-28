import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorageAdapter } from '../src/infrastructure/adapters/memory/index';

describe('Storage Versioning, Soft-Delete & Disaster Recovery Verification', () => {
  let storage: MemoryStorageAdapter;
  let mirror: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    mirror = new MemoryStorageAdapter();
    storage.mirrorStorage = mirror;
  });

  describe('1. Object Versioning & Historical Snapshots', () => {
    it('automatically generates distinct immutable version snapshots on each upload', async () => {
      const key = 'certificates/CERT-2026-001.pdf';
      const version1Content = 'Original Certificate: First Class Honours';
      const version2Content = 'Revised Certificate: Summa Cum Laude with Distinction';

      // Upload initial revision
      const res1 = await storage.upload(key, version1Content, 'application/pdf');
      expect(res1.versionId).toBeDefined();
      expect(res1.versionId).toMatch(/^v_\d+_/);

      // Upload updated revision
      const res2 = await storage.upload(key, version2Content, 'application/pdf');
      expect(res2.versionId).toBeDefined();
      expect(res2.versionId).not.toEqual(res1.versionId);

      // List all versions
      const versions = await storage.listVersions(key);
      expect(versions).toHaveLength(2);
      expect(versions[0].versionId).toEqual(res2.versionId);
      expect(versions[0].isLatest).toBe(true);
      expect(versions[1].versionId).toEqual(res1.versionId);
      expect(versions[1].isLatest).toBe(false);

      // Verify targeted download of specific historical revision
      const historicalBuf = await storage.download(key, res1.versionId);
      expect(historicalBuf).not.toBeNull();
      const historicalText = new TextDecoder().decode(historicalBuf!);
      expect(historicalText).toBe(version1Content);

      // Verify active download returns newest revision
      const activeBuf = await storage.download(key);
      const activeText = new TextDecoder().decode(activeBuf!);
      expect(activeText).toBe(version2Content);
    });
  });

  describe('2. Accidental Deletion & Soft-Delete Tombstone Restoration', () => {
    it('safely recovers an accidentally deleted passport photo or certificate', async () => {
      const key = 'students/passports/COEKA_2026_084.jpg';
      const passportData = 'BINARY_JPEG_STUDENT_PASSPORT_IMAGE_BYTES';

      // Upload student passport
      await storage.upload(key, passportData, 'image/jpeg');

      // Confirm exists
      let active = await storage.download(key);
      expect(active).not.toBeNull();

      // Accidental deletion occurs (default softDelete = true)
      await storage.delete(key, true);

      // Active object is now unavailable
      active = await storage.download(key);
      expect(active).toBeNull();

      // Execute disaster recovery restore
      const restored = await storage.restore(key);
      expect(restored).toBe(true);

      // Verify restored data is byte-identical
      const recoveredBuf = await storage.download(key);
      expect(recoveredBuf).not.toBeNull();
      const recoveredText = new TextDecoder().decode(recoveredBuf!);
      expect(recoveredText).toBe(passportData);
    });

    it('allows point-in-time rollback to a specific prior version after unwanted edits', async () => {
      const key = 'transcripts/TR_2026_099.pdf';
      const initialGrade = 'Original CGPA: 4.82';
      const corruptedGrade = 'Corrupted / Overwritten CGPA: 1.20';

      const v1 = await storage.upload(key, initialGrade, 'application/pdf');
      await storage.upload(key, corruptedGrade, 'application/pdf');

      // Verify corrupted is active
      const currentBuf = await storage.download(key);
      expect(new TextDecoder().decode(currentBuf!)).toBe(corruptedGrade);

      // Rollback to v1
      const rolledBack = await storage.restore(key, v1.versionId);
      expect(rolledBack).toBe(true);

      // Verify active is restored to initialGrade
      const restoredBuf = await storage.download(key);
      expect(new TextDecoder().decode(restoredBuf!)).toBe(initialGrade);
    });
  });

  describe('3. Secondary Read-Only Mirror & High Availability Failover', () => {
    it('automatically mirrors critical documents to secondary storage', async () => {
      const key = 'ledger/daily_settlement_2026_09_28.json';
      const ledgerContent = JSON.stringify({ totalKobo: 540000000, reconciled: true });

      // Upload with isCritical flag
      const result = await storage.upload(key, ledgerContent, 'application/json', {
        isCritical: true,
        mirror: true,
      });

      expect(result.mirrored).toBe(true);

      // Confirm file exists on the mirror storage independently
      const mirrorBuf = await mirror.download(key);
      expect(mirrorBuf).not.toBeNull();
      expect(new TextDecoder().decode(mirrorBuf!)).toBe(ledgerContent);
    });

    it('seamlessly fails over to read-only mirror if primary storage object is lost', async () => {
      const key = 'certificates/DIPLOMA_VERIFIED_778.pdf';
      const certContent = 'Certified Official Diploma COEKA';

      // Mirror critical certificate
      await storage.upload(key, certContent, 'application/pdf', { mirror: true });

      // Simulate primary storage outage or hard-delete on primary
      await storage.delete(key, false);

      // Direct access on primary is gone
      // But download() gracefully fails over to mirrorStorage!
      const failoverBuf = await storage.download(key);
      expect(failoverBuf).not.toBeNull();
      expect(new TextDecoder().decode(failoverBuf!)).toBe(certContent);
    });
  });
});
