import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { SignatureService } from '../finance/signatureService';

export interface AuditLogEntry {
  id: string;
  actorUserId: string;
  action: string;
  entityName: string;
  entityId: string;
  ipAddress: string;
  userAgent: string;
  oldValueJson: string | null;
  newValueJson: string | null;
  createdAt: number;
  signature: string;
}

export class AuditService {
  private static readonly DEFAULT_SECRET = 'coeka-enterprise-cryptographic-audit-key-2026';

  constructor(private db: IDatabaseProvider, private secret: string = AuditService.DEFAULT_SECRET) {}

  /**
   * Generates a cryptographic HMAC-SHA256 signature for an audit log entry.
   */
  private async signEntry(entry: {
    id: string;
    actorUserId: string;
    action: string;
    entityName: string;
    entityId: string;
    createdAt: number;
  }): Promise<string> {
    const rawPayload = `${entry.id}:${entry.actorUserId}:${entry.action}:${entry.entityName}:${entry.entityId}:${entry.createdAt}`;
    return await SignatureService.generateVerificationHash(`${this.secret}:${rawPayload}`);
  }

  /**
   * Records an administrative action in the tamper-evident cryptographic audit trail.
   */
  async logAdminAction(params: {
    actorUserId: string;
    action: string;
    entityName: string;
    entityId: string;
    ipAddress?: string;
    userAgent?: string;
    oldValue?: any;
    newValue?: any;
  }): Promise<AuditLogEntry> {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const createdAt = Math.floor(Date.now() / 1000);
    const ipAddress = params.ipAddress || '127.0.0.1';
    const userAgent = params.userAgent || 'COEKA-Admin-Console/1.0';
    const oldValueJson = params.oldValue !== undefined ? JSON.stringify(params.oldValue) : null;
    const newValueJson = params.newValue !== undefined ? JSON.stringify(params.newValue) : null;

    const signature = await this.signEntry({
      id,
      actorUserId: params.actorUserId,
      action: params.action,
      entityName: params.entityName,
      entityId: params.entityId,
      createdAt,
    });

    const entry: AuditLogEntry = {
      id,
      actorUserId: params.actorUserId,
      action: params.action,
      entityName: params.entityName,
      entityId: params.entityId,
      ipAddress,
      userAgent,
      oldValueJson,
      newValueJson,
      createdAt,
      signature,
    };

    await this.db.execute(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_name, entity_id, ip_address, user_agent, old_value_json, new_value_json, created_at, signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.actorUserId,
        entry.action,
        entry.entityName,
        entry.entityId,
        entry.ipAddress,
        entry.userAgent,
        entry.oldValueJson,
        entry.newValueJson,
        entry.createdAt,
        entry.signature,
      ]
    );

    return entry;
  }

  /**
   * Retrieves recent audit logs ordered from newest to oldest.
   */
  async getAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    return await this.db.query<AuditLogEntry>(
      `SELECT 
        id, 
        actor_user_id as actorUserId, 
        action, 
        entity_name as entityName, 
        entity_id as entityId, 
        ip_address as ipAddress, 
        user_agent as userAgent, 
        old_value_json as oldValueJson, 
        new_value_json as newValueJson, 
        created_at as createdAt, 
        signature 
       FROM audit_logs 
       ORDER BY created_at DESC, id DESC 
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Cryptographically verifies an audit entry to detect any database tampering.
   */
  async verifyAuditLog(id: string): Promise<{ isValid: boolean; entry: AuditLogEntry | null }> {
    const entry = await this.db.queryFirst<AuditLogEntry>(
      `SELECT 
        id, 
        actor_user_id as actorUserId, 
        action, 
        entity_name as entityName, 
        entity_id as entityId, 
        ip_address as ipAddress, 
        user_agent as userAgent, 
        old_value_json as oldValueJson, 
        new_value_json as newValueJson, 
        created_at as createdAt, 
        signature 
       FROM audit_logs 
       WHERE id = ?`,
      [id]
    );

    if (!entry) {
      return { isValid: false, entry: null };
    }

    const expectedSignature = await this.signEntry({
      id: entry.id,
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityName: entry.entityName,
      entityId: entry.entityId,
      createdAt: entry.createdAt,
    });

    const isValid = entry.signature.toLowerCase() === expectedSignature.toLowerCase();
    return { isValid, entry };
  }
}
