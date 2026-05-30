/**
 * All application route paths as constants.
 * Use these instead of string literals to prevent typos and make
 * refactoring routes a single-file change.
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',

  DASHBOARD: '/dashboard',
  DASHBOARD_NEW: '/dashboard/new',
  DASHBOARD_INVITE: (id: string) => `/dashboard/invite/${id}`,

  INVITE: (shortId: string) => `/invite/${shortId}`,
  INVITE_CHOOSE: (shortId: string) => `/invite/${shortId}/choose`,
  INVITE_TIME: (shortId: string) => `/invite/${shortId}/time`,
  INVITE_SUCCESS: (shortId: string) => `/invite/${shortId}/success`,
} as const

export const API_ROUTES = {
  INVITATIONS: '/api/invitations',
  INVITATION: (id: string) => `/api/invitations/${id}`,
  PUBLIC_INVITE: (shortId: string) => `/api/invite/${shortId}`,
  ACCEPT_INVITE: (shortId: string) => `/api/invite/${shortId}/accept`,
} as const
