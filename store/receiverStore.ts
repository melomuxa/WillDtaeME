'use client'

import { create } from 'zustand'

// ─────────────────────────────────────────────────────────────────────────────
// Receiver Flow Store
// ─────────────────────────────────────────────────────────────────────────────

// Zustand store for the receiver's multi-step acceptance flow.
// Keyed by shortId so state is isolated per invitation even if multiple
// tabs are open.

interface ReceiverState {
  chosenLocationId: string | null
  chosenTimeId: string | null
  setChosenLocation: (id: string) => void
  setChosenTime: (id: string) => void
  reset: () => void
}

export const useReceiverStore = create<ReceiverState>((set) => ({
  chosenLocationId: null,
  chosenTimeId: null,

  setChosenLocation: (id) => set({ chosenLocationId: id }),
  setChosenTime: (id) => set({ chosenTimeId: id }),

  reset: () => set({ chosenLocationId: null, chosenTimeId: null }),
}))
