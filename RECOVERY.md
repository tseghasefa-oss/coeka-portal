# COEKA Portal — Disaster Recovery Runbook (RECOVERY.md)
**Document Version:** 1.0.0  
**Target Environment:** College of Education, Katsina-Ala (COEKA) Production Edge Infrastructure  
**Author:** ICT & Directorate of System Architecture  
**Last Verified:** September 2026

---

## 1. Architectural Redundancy Overview

The COEKA Portal is engineered for rapid zero-data-loss disaster recovery. All critical state is distributed across multi-tiered edge infrastructure:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Cloudflare Edge Infrastructure                     │
│                                                                        │
│   ┌────────────────────┐    Nightly Cron Export    ┌────────────────┐  │
│   │   Cloudflare D1    │ ────────────────────────> │   Cloudflare   │  │
│   │   Production DB    │   (AES-256 Encrypted)     │   R2 Vault     │  │
│   └────────────────────┘                           └────────────────┘  │
│             │                                               │          │
│             ▼                                               ▼          │
│   ┌────────────────────┐    Critical Assets Sync   ┌────────────────┐  │
│   │   Cloudflare KV    │ ────────────────────────> │   R2 Mirror    │  │
│   │   (Session Cache)  │      (Certificates &      │   (Secondary   │  │
│   └────────────────────┘       Transcripts)        │    Region)     │  │
└────────────────────────────────────────────────────────────────────────┘
```

| Layer | Service | Primary Resource | Backup / Redundancy Mechanism |
|---|---|---|---|
| **Relational Database** | Cloudflare D1 | `coeka-production-db` | Nightly automated AES-256 SQL dump vaulted in R2 (`backups/d1/`) + 14-day GitHub Actions artifacts |
| **Document Storage** | Cloudflare R2 | `coeka-document-lake` | Automated Object Snapshot Versioning (`.versions/`) + Soft-Delete Tombstones (`.deleted/`) |
| **High Availability Mirror** | Cloudflare R2 | `coeka-document-lake-mirror` | Asynchronous read-only replication of certificates, transcripts, and financial receipts |
| **Session & Rate Limits** | Cloudflare KV | `SESSION_KV`, `RATE_LIMIT_KV` | Ephemeral stateless tokens; re-authenticates automatically via D1 credentials |

---

## 2. Disaster Recovery Scenarios & Procedures

### Scenario A: Total D1 Database Corruption or Accidental Drop

If tables are dropped, corrupted, or need point-in-time recovery, execute the following steps:

#### Step 1: Download the Latest Encrypted Backup

You can download the latest snapshot directly from R2:

```bash
# Via Wrangler CLI
npx wrangler r2 object get coeka-document-lake/backups/d1/latest.sql.enc --file=latest.sql.enc

# Or download a specific dated snapshot:
# npx wrangler r2 object get coeka-document-lake/backups/d1/2026-09-28/coeka_d1_backup_20260928_020000Z.sql.enc --file=latest.sql.enc
```

*(Alternatively: download the `.sql.enc` artifact from the most recent run in the GitHub Actions "Nightly Database Backup" workflow tab).*

#### Step 2: Decrypt the SQL Dump

Decrypt the snapshot using OpenSSL and the institutional backup key (`LEDGER_SIGNING_SECRET` or `JWT_SECRET`):

```bash
# In Linux / macOS / GitHub Actions runner:
openssl enc -d -aes-256-cbc -salt -pbkdf2 \
  -in latest.sql.enc \
  -out restored_dump.sql \
  -pass pass:$LEDGER_SIGNING_SECRET

# In Windows PowerShell:
$env:BACKUP_KEY = "YOUR_LEDGER_SIGNING_SECRET"
openssl enc -d -aes-256-cbc -salt -pbkdf2 -in latest.sql.enc -out restored_dump.sql -pass env:BACKUP_KEY
```

Verify that `restored_dump.sql` contains standard SQL statements (`PRAGMA`, `CREATE TABLE`, `INSERT INTO`).

#### Step 3: Apply the SQL Dump to Production D1

Execute the restored SQL script against Cloudflare D1:

```bash
npx wrangler d1 execute coeka-production-db --file=restored_dump.sql --remote
```

#### Step 4: Verify Database Integrity

Run verification queries to confirm student, admin, and ledger counts:

```bash
npx wrangler d1 execute coeka-production-db --command="SELECT COUNT(*) as users_count FROM users;" --remote
npx wrangler d1 execute coeka-production-db --command="SELECT COUNT(*) as students_count FROM students;" --remote
npx wrangler d1 execute coeka-production-db --command="SELECT COUNT(*) as invoices_count FROM invoices;" --remote
```

---

### Scenario B: Cloudflare KV Session Cache Flush & Re-sync

If the database is restored to a prior state, active KV sessions might reference invalidated user states. Flush the KV session cache to force all users to securely re-authenticate:

#### Step 1: Flush Stale KV Sessions

```bash
# List all active sessions
npx wrangler kv:key list --binding=SESSION_KV --remote

# Delete all keys or use Wrangler's bulk delete
npx wrangler kv:bulk delete --binding=SESSION_KV session_keys.json --remote
```

*Note: The frontend `useAuth` hook automatically detects missing KV sessions and guides users gracefully back to the modern Institutional Gateway login screen without throwing unhandled exceptions.*

---

### Scenario C: Accidental Student Passport or Certificate Deletion (R2 Recovery)

If a student's photo or an issued diploma/transcript certificate is deleted accidentally:

#### Method 1: Programmatic Instant Restoration via IStorageProvider

The storage provider preserves deleted assets under `.deleted/<key>/` with timestamp metadata:

```typescript
import { getContainer } from './infrastructure/container';

const container = getContainer(env);

// Instantly recovers the latest soft-deleted passport or certificate:
const success = await container.storage.restore('students/passports/COEKA_2026_084.jpg');

if (success) {
  console.log('Document successfully recovered and restored to production!');
}
```

#### Method 2: Point-in-Time Historical Revision Rollback

If a certificate was overwritten or tampered with:

```typescript
// 1. List all historical revisions:
const versions = await container.storage.listVersions('certificates/CERT_2026_001.pdf');
console.log('Available recovery points:', versions);

// 2. Roll back to the original issuance version:
await container.storage.restore('certificates/CERT_2026_001.pdf', versions[1].versionId);
```

#### Method 3: Direct Wrangler CLI Recovery

You can list and copy back from the version vault directly via Wrangler:

```bash
# List deleted tombstones
npx wrangler r2 object list coeka-document-lake --prefix=".deleted/students/passports/"

# Copy historical version back to active production key
npx wrangler r2 object get coeka-document-lake/.versions/certificates/CERT_001.pdf/v_1727524000_abc --file=recovered.pdf
npx wrangler r2 object put coeka-document-lake/certificates/CERT_001.pdf --file=recovered.pdf
```

---

### Scenario D: Secondary R2 Mirror & Regional Failover

All critical assets (certificates, transcripts, financial receipts) flagged with `{ isCritical: true }` are mirrored to the secondary bucket (`coeka-document-lake-mirror`).

1. **Automatic Read Failover**: If `coeka-document-lake` is unavailable, `CloudflareStorageAdapter.download()` automatically attempts retrieval from `mirrorBucket`.
2. **Manual Sync Trigger**: If an asset needs immediate manual synchronization:
   ```typescript
   await container.storage.syncMirror('transcripts/official/TR_2026_099.pdf');
   ```

---

## 3. Disaster Recovery Pre-Flight Checklist

Before declaring maintenance or performing significant database changes:

- [ ] Run the GitHub Actions workflow **"COEKA Automated Disaster Recovery & Nightly Database Backup"** on-demand via the Actions tab.
- [ ] Confirm the `.sql.enc` file size matches expected database volume.
- [ ] Confirm secret `LEDGER_SIGNING_SECRET` and `JWT_SECRET` are securely stored in the institutional password manager (Bitwarden / 1Password).
- [ ] Ensure local administrative terminal has Git, Node.js 22+, and Wrangler authenticated.
