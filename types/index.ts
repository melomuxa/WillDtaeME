import type { InviteStatus } from '@/app/generated/prisma/enums'

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  code: string
  details?: unknown
}

// ─── Public Invitation (no sender PII) ───────────────────────────────────────

export interface PublicLocationOption {
  id: string
  name: string
  category: string | null
  imageUrl: string | null
  address: string | null
  order: number
}

export interface PublicTimeOption {
  id: string
  label: string
  isWholeDay: boolean
  datetime: Date | null
  order: number
}

export interface PublicInvitation {
  shortId: string
  personalMessage: string | null
  status: InviteStatus
  locationOptions: PublicLocationOption[]
  timeOptions: PublicTimeOption[]
}

// ─── Dashboard Invitation (sender-facing) ────────────────────────────────────

export interface DashboardInvitation {
  id: string
  shortId: string
  personalMessage: string | null
  status: InviteStatus
  createdAt: Date
  respondedAt: Date | null
  chosenLocationId: string | null
  chosenTimeId: string | null
  locationOptions: PublicLocationOption[]
  timeOptions: PublicTimeOption[]
}

// ─── Form Input Types ─────────────────────────────────────────────────────────

export interface CreateLocationOptionInput {
  name: string
  category?: string
  imageUrl?: string
  address?: string
}

export interface CreateTimeOptionInput {
  label: string
  isWholeDay: boolean
  datetime?: string
}

export interface CreateInvitationInput {
  personalMessage?: string
  locationOptions: CreateLocationOptionInput[]
  timeOptions: CreateTimeOptionInput[]
}

export interface AcceptInvitationInput {
  locationOptionId: string
  timeOptionId: string
}
