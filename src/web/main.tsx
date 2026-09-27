import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

// ─── Sentry Frontend Initialisation ──────────────────────────────────────────
// DSN is injected via Vite env variable so it never lives in source code.
// Set it in your .env file:  VITE_SENTRY_DSN=https://...@o0.ingest.sentry.io/...
// And in Cloudflare Pages Environment Variables for production deployments.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN ?? '';

Sentry.init({
  dsn: SENTRY_DSN,
  release: 'coeka-portal@1.0.0',
  environment: import.meta.env.MODE ?? 'production',
  enabled: Boolean(SENTRY_DSN),   // silently disabled if no DSN is set

  // Performance — capture 10% of page loads as traces
  tracesSampleRate: 0.1,

  // Session Replay — record 5% of sessions, 100% of sessions with an error
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,       // FERPA / student data privacy
      blockAllMedia: false,
    }),
  ],

  // Strip student ID numbers and tokens from captured URLs
  beforeSend(event) {
    if (event.request?.url) {
      event.request.url = event.request.url.replace(
        /([?&])(token|session|password|pin)=[^&]*/gi,
        '$1$2=REDACTED'
      );
    }
    return event;
  },
});

// ─── React Query Setup ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ─── Application Mount ────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Global crash boundary — catches any unhandled render error */}
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
