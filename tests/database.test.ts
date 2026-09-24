import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

describe('COEKA D1 SQL Database & Migration Suite', () => {
  it('successfully executes 0001_initial_schema.sql and creates all tables', () => {
    const db = new DatabaseSync(':memory:');
    const schemaSql = fs.readFileSync(
      path.join(__dirname, '../src/database/migrations/0001_initial_schema.sql'),
      'utf-8'
    );

    // Execute full DDL
    db.exec(schemaSql);

    // Verify all core tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
    `).all() as { name: string }[];

    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('divisions');
    expect(tableNames).toContain('schools_faculties');
    expect(tableNames).toContain('departments');
    expect(tableNames).toContain('programmes');
    expect(tableNames).toContain('students');
    expect(tableNames).toContain('courses');
    expect(tableNames).toContain('course_registrations');
    expect(tableNames).toContain('student_grades');
    expect(tableNames).toContain('fee_categories');
    expect(tableNames).toContain('fee_schedules');
    expect(tableNames).toContain('student_invoices');
    expect(tableNames).toContain('transactions');
    expect(tableNames).toContain('hostels');
    expect(tableNames).toContain('hostel_rooms');
    expect(tableNames).toContain('hostel_bedspaces');
    expect(tableNames).toContain('staff_profiles');
    expect(tableNames).toContain('parents');
    expect(tableNames).toContain('audit_logs');
  });

  it('successfully seeds baseline COEKA data via 0002_seed_data.sql', () => {
    const db = new DatabaseSync(':memory:');
    const schemaSql = fs.readFileSync(
      path.join(__dirname, '../src/database/migrations/0001_initial_schema.sql'),
      'utf-8'
    );
    const seedSql = fs.readFileSync(
      path.join(__dirname, '../src/database/migrations/0002_seed_data.sql'),
      'utf-8'
    );

    db.exec(schemaSql);
    db.exec(seedSql);

    // Verify 4 divisions seeded
    const divisions = db.prepare('SELECT code, name, grading_policy FROM divisions ORDER BY code').all() as any[];
    expect(divisions.length).toBe(4);
    const divisionCodes = divisions.map(d => d.code);
    expect(divisionCodes).toContain('NCE');
    expect(divisionCodes).toContain('DEG');
    expect(divisionCodes).toContain('SEC');
    expect(divisionCodes).toContain('PRI');

    // Verify fee schedules in Kobo
    const feeSchedules = db.prepare('SELECT level, amount_kobo FROM fee_schedules WHERE category_id = \'fee-nce-tuition\'').all() as any[];
    expect(feeSchedules.length).toBeGreaterThan(0);
    expect(feeSchedules[0].amount_kobo).toBe(4500000); // ₦45,000 in Kobo

    // Verify hostels seeded
    const hostels = db.prepare('SELECT name, gender, total_capacity FROM hostels').all() as any[];
    expect(hostels.length).toBe(2);
  });

  it('enforces table CHECK constraints on grades and currency', () => {
    const db = new DatabaseSync(':memory:');
    const schemaSql = fs.readFileSync(
      path.join(__dirname, '../src/database/migrations/0001_initial_schema.sql'),
      'utf-8'
    );
    db.exec(schemaSql);

    // Check constraint: fee amount must be positive
    expect(() => {
      db.exec(`
        INSERT INTO fee_schedules (id, category_id, session_id, level, amount_kobo)
        VALUES ('test-1', 'cat-1', 'sess-1', 100, -500);
      `);
    }).toThrow();
  });
});
