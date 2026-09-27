import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI — defaults to the COEKA branded crash screen */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

/**
 * COEKA Portal Global Error Boundary
 *
 * Wraps the entire application tree. Any unhandled React render error
 * is caught here, reported to Sentry (with a unique event ID), and the
 * user sees an institutional crash screen instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, eventId: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: info.componentStack ?? undefined,
        },
      },
      tags: {
        source: 'react_error_boundary',
        institution: 'COEKA',
      },
    });
    this.setState({ eventId: eventId ?? null });
    console.error('[COEKA ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
            {/* Institutional crest placeholder */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 110 20A10 10 0 0112 2z" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-white mb-2">
              Portal Encountered an Error
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              An unexpected error occurred. Our technical team has been notified
              automatically. Please refresh the page or return to the login screen.
            </p>

            {this.state.eventId && (
              <p className="text-xs text-slate-500 mb-4 font-mono">
                Ref: {this.state.eventId}
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
              >
                Back to Login
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-6">
              College of Education, Katsina-Ala · Portal v1.0
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
