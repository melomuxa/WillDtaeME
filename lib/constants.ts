// ─── Invite Configuration ─────────────────────────────────────────────────────

/** Length of the public short ID used in invitation URLs (e.g. "aB3xK9mQ"). */
export const INVITE_ID_LENGTH = 8

/** Minimum number of location options required per invitation. */
export const MIN_LOCATION_OPTIONS = 1

/** Maximum number of location/venue options a sender can add. */
export const MAX_LOCATION_OPTIONS = 4

/** Minimum number of time options required per invitation. */
export const MIN_TIME_OPTIONS = 1

/** Maximum number of time options a sender can add. */
export const MAX_TIME_OPTIONS = 4

/** Maximum characters for the sender's personal message. */
export const MAX_PERSONAL_MESSAGE_LENGTH = 280

/** Maximum characters for any option label (location name or time label). */
export const MAX_OPTION_LABEL_LENGTH = 60

/** Number of days before an invitation auto-expires. */
export const INVITE_EXPIRY_DAYS = 30


// ─── Fleeing No Button ────────────────────────────────────────────────────────

/** Pixel radius within which the No button starts fleeing the cursor. */
export const NO_BUTTON_FLEE_RADIUS_PX = 130

/** Pixel distance the No button jumps each time it flees the cursor. */
export const NO_BUTTON_FLEE_SPEED_PX = 180


// ─── Rate Limiting ────────────────────────────────────────────────────────────

/** Max acceptance attempts per invitation within the rate limit window. */
export const RATE_LIMIT_MAX_ATTEMPTS = 3

/** Rate limit window duration in seconds (1 hour). */
export const RATE_LIMIT_WINDOW_SECONDS = 3600


// ─── Location Option Categories ───────────────────────────────────────────────

export const LOCATION_CATEGORIES = [
  'Restaurant',
  'Café',
  'Bar',
  'Outdoor',
  'Cinema',
  'Other',
] as const

export type LocationCategory = (typeof LOCATION_CATEGORIES)[number]
