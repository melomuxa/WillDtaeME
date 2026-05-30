import { z } from 'zod'
import {
  MAX_LOCATION_OPTIONS,
  MAX_OPTION_LABEL_LENGTH,
  MAX_PERSONAL_MESSAGE_LENGTH,
  MAX_TIME_OPTIONS,
  MIN_LOCATION_OPTIONS,
  MIN_TIME_OPTIONS,
} from '@/lib/constants'

// ─── Location Option ──────────────────────────────────────────────────────────

export const locationOptionSchema = z.object({
  name: z
    .string()
    .min(1, 'Location name is required')
    .max(MAX_OPTION_LABEL_LENGTH, `Name must be ${MAX_OPTION_LABEL_LENGTH} characters or less`),
  category: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  address: z.string().optional(),
})

// ─── Time Option ──────────────────────────────────────────────────────────────

export const timeOptionSchema = z.object({
  label: z
    .string()
    .min(1, 'Time label is required')
    .max(MAX_OPTION_LABEL_LENGTH, `Label must be ${MAX_OPTION_LABEL_LENGTH} characters or less`),
  // React Hook Form checkboxes always emit boolean; no default needed here
  isWholeDay: z.boolean(),
  // datetime-local inputs emit "YYYY-MM-DDTHH:mm" without timezone — accept any non-empty string
  datetime: z.string().optional(),
})

// ─── Create Invitation ────────────────────────────────────────────────────────

export const createInvitationSchema = z.object({
  personalMessage: z
    .string()
    .max(
      MAX_PERSONAL_MESSAGE_LENGTH,
      `Message must be ${MAX_PERSONAL_MESSAGE_LENGTH} characters or less`
    )
    .optional(),
  locationOptions: z
    .array(locationOptionSchema)
    .min(MIN_LOCATION_OPTIONS, 'At least one location is required')
    .max(MAX_LOCATION_OPTIONS, `Maximum ${MAX_LOCATION_OPTIONS} locations allowed`),
  timeOptions: z
    .array(timeOptionSchema)
    .min(MIN_TIME_OPTIONS, 'At least one time option is required')
    .max(MAX_TIME_OPTIONS, `Maximum ${MAX_TIME_OPTIONS} time options allowed`),
})

// ─── Accept Invitation ────────────────────────────────────────────────────────

export const acceptInviteSchema = z.object({
  locationOptionId: z.string().cuid('Invalid location option'),
  timeOptionId: z.string().cuid('Invalid time option'),
})

export type CreateInvitationSchema = z.infer<typeof createInvitationSchema>
export type AcceptInviteSchema = z.infer<typeof acceptInviteSchema>
