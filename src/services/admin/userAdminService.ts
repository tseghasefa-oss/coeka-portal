import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { AuditService } from './auditService';
import { SignatureService } from '../finance/signatureService';

export interface UserDirectoryItem {
  id: string;
  username: string;
  name: string;
  identifier: string;
  email: string;
  phoneNumber: string;
  role: string;
  userType: string;
  departmentOrProg: string;
  division: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: number;
}

export class UserAdminService {
  private auditService: AuditService;

  constructor(private db: IDatabaseProvider, auditService?: AuditService) {
    this.auditService = auditService || new AuditService(db);
  }

  /**
   * Ensure standard institutional seed accounts exist in database
   */
  async ensureSeedUsers(): Promise<void> {
    const existing = await this.db.queryFirst<{ count: number }>(`SELECT COUNT(*) as count FROM users`);
    if (existing && existing.count >= 6) {
      return;
    }

    const initialUsers = [
      {
        id: 'usr-admin-001',
        username: 'founder_tsegha',
        name: 'Engr. Prof. S. L. Tsegha',
        identifier: 'COEKA/ADM/001',
        email: 'founder@fruitfulujah.com',
        phoneNumber: '08022223344',
        role: 'SUPER_ADMIN',
        userType: 'ADMIN',
        dept: 'Directorate of ICT & System Architecture',
        div: 'CENTRAL',
        isActive: 1,
        twoFactor: 1,
      },
      {
        id: 'usr-staff-001',
        username: 'lecturer1',
        name: 'Dr. Olufemi Adeyemi',
        identifier: 'COEKA/STF/2026/001',
        email: 'lecturer1@coeka.edu.ng',
        phoneNumber: '08011112233',
        role: 'LECTURER',
        userType: 'STAFF',
        dept: 'Department of Computer Science',
        div: 'NCE',
        isActive: 1,
        twoFactor: 1,
      },
      {
        id: 'usr-dean-001',
        username: 'dean_tyav',
        name: 'Dr. (Mrs) Bridget Tyav',
        identifier: 'COEKA/STF/2026/012',
        email: 'btyav@coeka.edu.ng',
        phoneNumber: '08033334455',
        role: 'DEAN',
        userType: 'STAFF',
        dept: 'School of Education',
        div: 'NCE',
        isActive: 1,
        twoFactor: 1,
      },
      {
        id: 'usr-bur-001',
        username: 'bursar_ikyur',
        name: 'Mr. Gabriel Ikyur',
        identifier: 'COEKA/BUR/005',
        email: 'bursar.office@coeka.edu.ng',
        phoneNumber: '08044445566',
        role: 'BURSAR',
        userType: 'STAFF',
        dept: 'Bursary Revenue & Accounts Unit',
        div: 'CENTRAL',
        isActive: 1,
        twoFactor: 1,
      },
      {
        id: 'usr-std-001',
        username: 'std_iorliam',
        name: 'Aondoaver Moses Iorliam',
        identifier: 'COEKA/2026/NCE/084',
        email: 'm.iorliam@student.coeka.edu.ng',
        phoneNumber: '08055556677',
        role: 'STUDENT',
        userType: 'STUDENT',
        dept: 'NCE Computer Science / Mathematics',
        div: 'NCE',
        isActive: 1,
        twoFactor: 0,
      },
      {
        id: 'usr-std-002',
        username: 'std_gbadu',
        name: 'Doose Mercy Gbadu',
        identifier: 'COEKA/2026/NCE/087',
        email: 'd.gbadu@student.coeka.edu.ng',
        phoneNumber: '08066667788',
        role: 'STUDENT',
        userType: 'STUDENT',
        dept: 'NCE Biology / Integrated Science',
        div: 'NCE',
        isActive: 1,
        twoFactor: 0,
      },
      {
        id: 'usr-std-003',
        username: 'std_chia',
        name: 'Terna Victor Chia',
        identifier: 'COEKA/2026/DEG/018',
        email: 'v.chia@degree.coeka.edu.ng',
        phoneNumber: '08077778899',
        role: 'STUDENT',
        userType: 'STUDENT',
        dept: 'B.Ed Business Education',
        div: 'DEGREE',
        isActive: 1,
        twoFactor: 0,
      },
      {
        id: 'usr-par-001',
        username: 'parent_iorliam',
        name: 'Elder Tor Iorliam',
        identifier: 'PAR/2026/099',
        email: 'tor.iorliam@gmail.com',
        phoneNumber: '08088889900',
        role: 'PARENT',
        userType: 'PARENT',
        dept: 'Parent / Guardian Association',
        div: 'NCE',
        isActive: 1,
        twoFactor: 0,
      },
    ];

    for (const u of initialUsers) {
      await this.db.execute(
        `INSERT OR IGNORE INTO users (id, username, email, phone_number, password_hash, user_type, is_active, two_factor_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.username, u.email, u.phoneNumber, '$2a$12$demo_default_hash', u.userType, u.isActive, u.twoFactor]
      );
    }
  }

  /**
   * List users with optional role, division, and search filtering
   */
  async listUsers(filters?: {
    role?: string;
    division?: string;
    search?: string;
    limit?: number;
  }): Promise<UserDirectoryItem[]> {
    await this.ensureSeedUsers();

    // Query all users
    const users = await this.db.query<any>(
      `SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.phone_number as phoneNumber, 
        u.user_type as userType, 
        u.is_active as isActive, 
        u.two_factor_enabled as twoFactorEnabled, 
        u.created_at as createdAt 
       FROM users u 
       ORDER BY u.created_at DESC`
    );

    // Fetch related records to enrich items
    const [students, staff, parents] = await Promise.all([
      this.db.query<any>(`SELECT user_id as userId, first_name || ' ' || last_name as name, matric_number as identifier, division_id as divisionId, programme_id as progId FROM students`),
      this.db.query<any>(`SELECT user_id as userId, first_name || ' ' || last_name as name, staff_id_number as identifier, designation, cadre FROM staff_profiles`),
      this.db.query<any>(`SELECT user_id as userId, full_name as name FROM parents`),
    ]);

    const studentMap = new Map(students.map((s) => [s.userId, s]));
    const staffMap = new Map(staff.map((s) => [s.userId, s]));
    const parentMap = new Map(parents.map((p) => [p.userId, p]));

    // Known metadata dictionary for standard demo profiles
    const metadataDictionary: Record<string, { name: string; identifier: string; role: string; dept: string; div: string }> = {
      'usr-admin-001': {
        name: 'Engr. Prof. S. L. Tsegha',
        identifier: 'COEKA/ADM/001',
        role: 'SUPER_ADMIN',
        dept: 'Directorate of ICT & System Architecture',
        div: 'CENTRAL',
      },
      'usr-staff-001': {
        name: 'Dr. Olufemi Adeyemi',
        identifier: 'COEKA/STF/2026/001',
        role: 'LECTURER',
        dept: 'Department of Computer Science',
        div: 'NCE',
      },
      'usr-dean-001': {
        name: 'Dr. (Mrs) Bridget Tyav',
        identifier: 'COEKA/STF/2026/012',
        role: 'DEAN',
        dept: 'School of Education',
        div: 'NCE',
      },
      'usr-bur-001': {
        name: 'Mr. Gabriel Ikyur',
        identifier: 'COEKA/BUR/005',
        role: 'BURSAR',
        dept: 'Bursary Revenue & Accounts Unit',
        div: 'CENTRAL',
      },
      'usr-std-001': {
        name: 'Aondoaver Moses Iorliam',
        identifier: 'COEKA/2026/NCE/084',
        role: 'STUDENT',
        dept: 'NCE Computer Science / Mathematics',
        div: 'NCE',
      },
      'usr-std-002': {
        name: 'Doose Mercy Gbadu',
        identifier: 'COEKA/2026/NCE/087',
        role: 'STUDENT',
        dept: 'NCE Biology / Integrated Science',
        div: 'NCE',
      },
      'usr-std-003': {
        name: 'Terna Victor Chia',
        identifier: 'COEKA/2026/DEG/018',
        role: 'STUDENT',
        dept: 'B.Ed Business Education',
        div: 'DEGREE',
      },
      'usr-par-001': {
        name: 'Elder Tor Iorliam',
        identifier: 'PAR/2026/099',
        role: 'PARENT',
        dept: 'Parent / Guardian Association',
        div: 'NCE',
      },
    };

    let items: UserDirectoryItem[] = users.map((u) => {
      const meta = metadataDictionary[u.id];
      const s = studentMap.get(u.id);
      const st = staffMap.get(u.id);
      const p = parentMap.get(u.id);

      const name = meta?.name || s?.name || st?.name || p?.name || u.username;
      const identifier = meta?.identifier || s?.identifier || st?.identifier || u.username;
      const role = meta?.role || (u.userType === 'ADMIN' ? 'SUPER_ADMIN' : u.userType);
      const departmentOrProg = meta?.dept || st?.designation || s?.progId || 'General Institutional';
      const division = meta?.div || (s?.divisionId ? s.divisionId.replace('div-', '').toUpperCase() : 'CENTRAL');

      return {
        id: u.id,
        username: u.username,
        name,
        identifier,
        email: u.email || `${u.username}@coeka.edu.ng`,
        phoneNumber: u.phoneNumber || 'N/A',
        role,
        userType: u.userType,
        departmentOrProg,
        division,
        isActive: Boolean(u.isActive),
        twoFactorEnabled: Boolean(u.twoFactorEnabled),
        createdAt: Number(u.createdAt),
      };
    });

    // Apply filters
    if (filters?.role && filters.role !== 'ALL') {
      const targetRole = filters.role.toUpperCase();
      items = items.filter((i) => i.role.toUpperCase() === targetRole || i.userType.toUpperCase() === targetRole);
    }

    if (filters?.division && filters.division !== 'ALL') {
      const targetDiv = filters.division.toUpperCase();
      items = items.filter((i) => i.division.toUpperCase() === targetDiv);
    }

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          i.identifier.toLowerCase().includes(term) ||
          i.email.toLowerCase().includes(term) ||
          i.username.toLowerCase().includes(term)
      );
    }

    if (filters?.limit) {
      items = items.slice(0, filters.limit);
    }

    return items;
  }

  /**
   * Promote an existing user to ADMIN or SUPER_ADMIN
   */
  async promoteUser(
    targetUserId: string,
    newRole: 'ADMIN' | 'SUPER_ADMIN',
    actorUserId: string = 'system-admin'
  ): Promise<UserDirectoryItem> {
    const user = await this.db.queryFirst<any>(`SELECT * FROM users WHERE id = ?`, [targetUserId]);
    if (!user) {
      throw new Error(`User with ID ${targetUserId} not found`);
    }

    const previousRole = user.user_type;

    // Update users table
    await this.db.execute(
      `UPDATE users SET user_type = 'ADMIN', updated_at = (strftime('%s', 'now')) WHERE id = ?`,
      [targetUserId]
    );

    // Cryptographic audit log
    await this.auditService.logAdminAction({
      actorUserId,
      action: 'PROMOTE_USER_TO_ADMIN',
      entityName: 'users',
      entityId: targetUserId,
      oldValue: { role: previousRole },
      newValue: { role: newRole, userType: 'ADMIN' },
    });

    const updatedList = await this.listUsers();
    const updated = updatedList.find((u) => u.id === targetUserId);
    if (!updated) {
      throw new Error('Failed to retrieve updated user');
    }
    updated.role = newRole;
    return updated;
  }

  /**
   * Toggle user account status (suspend / activate)
   */
  async setUserStatus(
    targetUserId: string,
    isActive: boolean,
    actorUserId: string = 'system-admin'
  ): Promise<{ id: string; isActive: boolean }> {
    const user = await this.db.queryFirst<any>(`SELECT * FROM users WHERE id = ?`, [targetUserId]);
    if (!user) {
      throw new Error(`User with ID ${targetUserId} not found`);
    }

    const previousStatus = Boolean(user.is_active);
    const intStatus = isActive ? 1 : 0;

    await this.db.execute(
      `UPDATE users SET is_active = ?, updated_at = (strftime('%s', 'now')) WHERE id = ?`,
      [intStatus, targetUserId]
    );

    // Cryptographic audit log
    await this.auditService.logAdminAction({
      actorUserId,
      action: isActive ? 'ACTIVATE_USER' : 'SUSPEND_USER',
      entityName: 'users',
      entityId: targetUserId,
      oldValue: { isActive: previousStatus },
      newValue: { isActive },
    });

    return { id: targetUserId, isActive };
  }

  /**
   * Reset user password and return temporary secure credential
   */
  async resetPassword(
    targetUserId: string,
    actorUserId: string = 'system-admin'
  ): Promise<{ tempPassword: string; message: string }> {
    const user = await this.db.queryFirst<any>(`SELECT * FROM users WHERE id = ?`, [targetUserId]);
    if (!user) {
      throw new Error(`User with ID ${targetUserId} not found`);
    }

    // Generate random 8-character temporary password
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(10 + Math.random() * 90);
    const tempPassword = `COEKA-${randomSuffix}!`;

    // Hash with SHA-256 for storage
    const newHash = await SignatureService.generateVerificationHash(tempPassword);

    await this.db.execute(
      `UPDATE users SET password_hash = ?, updated_at = (strftime('%s', 'now')) WHERE id = ?`,
      [newHash, targetUserId]
    );

    // Cryptographic audit log
    await this.auditService.logAdminAction({
      actorUserId,
      action: 'RESET_USER_PASSWORD',
      entityName: 'users',
      entityId: targetUserId,
      oldValue: { passwordReset: false },
      newValue: { passwordReset: true, resetAt: Math.floor(Date.now() / 1000) },
    });

    return {
      tempPassword,
      message: `Password successfully reset for user ${user.username}. Temporary password generated.`,
    };
  }
}
