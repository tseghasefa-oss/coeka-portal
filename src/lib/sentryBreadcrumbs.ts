/**
 * COEKA Portal — Sentry Breadcrumb Helpers
 *
 * Breadcrumbs build a timeline of "what happened before the crash" that appears
 * in the Sentry Issues detail view. Call these at the start of any significant
 * operation in the Bursary, Registrar, or Exam Officer modules.
 *
 * Usage (backend — Cloudflare Worker):
 *   import { addBreadcrumb } from '@sentry/cloudflare';
 *   addBreadcrumb(bursarBreadcrumb('reconciliation_start', { invoiceCount: 42 }));
 *
 * Usage (frontend — React):
 *   import { addBreadcrumb } from '@sentry/react';
 *   addBreadcrumb(registrarBreadcrumb('transcript_export', { studentId }));
 */

// ─── Types ───────────────────────────────────────────────────────────────────

type BreadcrumbData = Record<string, string | number | boolean | null | undefined>;

interface SentryBreadcrumb {
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  data?: BreadcrumbData;
}

// ─── Bursary Breadcrumbs ─────────────────────────────────────────────────────

/**
 * Creates a Sentry breadcrumb for Bursary / Finance operations.
 *
 * @param event  Short slug for the event, e.g. 'revenue_report_start'
 * @param data   Optional key-value context (divisionId, sessionId, amount, etc.)
 */
export function bursarBreadcrumb(
  event: string,
  data?: BreadcrumbData
): SentryBreadcrumb {
  return {
    category: 'coeka.bursary',
    message: `[Bursary] ${event}`,
    level: 'info',
    data,
  };
}

// ─── Registrar Breadcrumbs ───────────────────────────────────────────────────

/**
 * Creates a Sentry breadcrumb for Registrar / Academic Records operations.
 *
 * @param event  Short slug, e.g. 'transcript_queue_export', 'certificate_issue'
 * @param data   Optional key-value context (studentId, matricNumber, etc.)
 */
export function registrarBreadcrumb(
  event: string,
  data?: BreadcrumbData
): SentryBreadcrumb {
  return {
    category: 'coeka.registrar',
    message: `[Registrar] ${event}`,
    level: 'info',
    data,
  };
}

// ─── Exam Officer Breadcrumbs ────────────────────────────────────────────────

/**
 * Creates a Sentry breadcrumb for Exam Officer / Broadsheet operations.
 *
 * @param event  Short slug, e.g. 'broadsheet_generate', 'probation_flag'
 * @param data   Optional key-value context (courseCode, semester, level, etc.)
 */
export function examOfficerBreadcrumb(
  event: string,
  data?: BreadcrumbData
): SentryBreadcrumb {
  return {
    category: 'coeka.exam_officer',
    message: `[ExamOfficer] ${event}`,
    level: 'info',
    data,
  };
}

// ─── Generic Institutional Breadcrumb ────────────────────────────────────────

/**
 * Generic institutional breadcrumb — use for Auth, Admin, or any module not
 * covered by the specific helpers above.
 */
export function coekaBreadcrumb(
  module: string,
  event: string,
  data?: BreadcrumbData
): SentryBreadcrumb {
  return {
    category: `coeka.${module}`,
    message: `[${module.toUpperCase()}] ${event}`,
    level: 'info',
    data,
  };
}
