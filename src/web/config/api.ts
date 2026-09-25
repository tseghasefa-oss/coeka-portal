/**
 * Cloudflare Pages & API Endpoint Configuration
 *
 * When deployed as a separate Cloudflare Pages project, requests are directed
 * to the Cloudflare Worker API URL provided via VITE_API_URL.
 * If running locally or on the same origin Worker Assets, defaults to relative /api paths.
 */
const isPagesDev = typeof window !== 'undefined' && window.location.hostname.includes('pages.dev');
const defaultApiHost = isPagesDev ? 'https://coeka-portal.sefa-tsegha.workers.dev' : '';

export const API_HOST = (import.meta.env.VITE_API_URL || defaultApiHost).replace(/\/$/, '');

export const getApiUrl = (endpoint: string): string => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_HOST}${path}`;
};
