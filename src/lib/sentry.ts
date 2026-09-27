/**
 * COEKA Portal — Sentry Shared Configuration
 *
 * Central place for all Sentry constants and shared helpers.
 * The DSN is read from the environment at runtime so it never
 * needs to be hard-coded in source and can be swapped without
 * a code deploy.
 *
 * HOW TO SET YOUR DSN:
 *  1. Log in at https://sentry.io  (free tier is fine)
 *  2. Create a new Project → Platform: Cloudflare Workers (backend)
 *     and a separate Project → Platform: React (frontend)
 *  3. Copy the DSN string from Settings → Client Keys (DSN)
 *  4. Backend: run  npx wrangler secret put SENTRY_DSN
 *  5. Frontend: add  VITE_SENTRY_DSN=https://...  to your .env file
 *                    and also to Cloudflare Pages env vars
 */

export const SENTRY_RELEASE = 'coeka-portal@1.0.0';
export const SENTRY_ENVIRONMENT =
  typeof process !== 'undefined'
    ? (process.env?.ENVIRONMENT ?? 'production')
    : 'production';

/** Placeholder DSN — replace with your real one from sentry.io */
export const SENTRY_DSN_PLACEHOLDER =
  'https://YOUR_KEY@o0.ingest.sentry.io/YOUR_PROJECT_ID';
