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
export const NO_BUTTON_FLEE_RADIUS_PX = 8

/** Pixel distance the No button jumps each time it flees the cursor. */
export const NO_BUTTON_FLEE_SPEED_PX = 160


// ─── Rate Limiting ────────────────────────────────────────────────────────────

/** Max acceptance attempts per invitation within the rate limit window. */
export const RATE_LIMIT_MAX_ATTEMPTS = 3

/** Rate limit window duration in seconds (1 hour). */
export const RATE_LIMIT_WINDOW_SECONDS = 3600


// ─── Location Option Categories & Icons ──────────────────────────────────────

/** Primary categories shown as quick-pick buttons on the form. */
export const PRIMARY_CATEGORIES = [
  { value: 'Restaurant', icon: '🍽️', label: 'Restaurant' },
  { value: 'Café',       icon: '☕',  label: 'Café' },
  { value: 'Bar',        icon: '🍸',  label: 'Bar' },
  { value: 'Cinema',     icon: '🍿',  label: 'Cinema' },
  { value: 'Outdoor',    icon: '🌳',  label: 'Outdoor' },
] as const

/** Extra icons shown when the user picks "Other". Grouped by theme. */
export const OTHER_CATEGORY_ICONS = [
  // Food & Drink
  { value: '🍦 Ice Cream',  icon: '🍦', label: 'Ice Cream' },
  { value: '🍺 Beer',       icon: '🍺', label: 'Beer' },
  { value: '🍕 Pizza',      icon: '🍕', label: 'Pizza' },
  { value: '🍜 Noodles',    icon: '🍜', label: 'Noodles' },
  { value: '🥗 Salad',      icon: '🥗', label: 'Salad' },
  { value: '🍰 Dessert',    icon: '🍰', label: 'Dessert' },
  { value: '🌮 Tacos',      icon: '🌮', label: 'Tacos' },
  { value: '🍣 Sushi',      icon: '🍣', label: 'Sushi' },
  // Activities
  { value: '🚶 Walking',    icon: '🚶', label: 'Walking' },
  { value: '🚴 Biking',     icon: '🚴', label: 'Biking' },
  { value: '🚗 Driving',    icon: '🚗', label: 'Driving' },
  { value: '🎮 Gaming',     icon: '🎮', label: 'Gaming' },
  { value: '🎭 Theatre',    icon: '🎭', label: 'Theatre' },
  { value: '🏊 Swimming',   icon: '🏊', label: 'Swimming' },
  { value: '🎳 Bowling',    icon: '🎳', label: 'Bowling' },
  { value: '🎨 Art',        icon: '🎨', label: 'Art' },
] as const

/** Returns the icon emoji for a given category value. Falls back to 📍. */
export function getCategoryIcon(category: string | null | undefined): string {
  if (!category) return '📍'
  const primary = PRIMARY_CATEGORIES.find((c) => c.value === category)
  if (primary) return primary.icon
  // For "other" categories the value IS "emoji label", so grab the first char
  const match = category.match(/^\p{Emoji}/u)
  return match ? match[0] : '📍'
}

export const LOCATION_CATEGORIES = [
  ...PRIMARY_CATEGORIES.map((c) => c.value),
  'Other',
] as const

export type LocationCategory = (typeof LOCATION_CATEGORIES)[number]
