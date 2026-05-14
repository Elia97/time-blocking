import { create } from "zustand"

import type { EventRow } from "@/db/schema"
import { shiftWeek, startOfCalendarWeek } from "@/lib/date"

export type EventDialogState =
  | { mode: "create"; defaults?: { startAt?: number; endAt?: number; allDay?: boolean } }
  | { mode: "edit"; event: EventRow }
  | null

type CalendarUiState = {
  anchorDate: Date
  dialogState: EventDialogState
  goToPrevWeek: () => void
  goToNextWeek: () => void
  goToToday: () => void
  setAnchorDate: (date: Date) => void
  openCreateDialog: (
    defaults?: NonNullable<EventDialogState & { mode: "create" }>["defaults"],
  ) => void
  openEditDialog: (event: EventRow) => void
  closeDialog: () => void
}

export const useCalendarUiStore = create<CalendarUiState>((set) => ({
  anchorDate: startOfCalendarWeek(new Date()),
  dialogState: null,
  goToPrevWeek: () => set((s) => ({ anchorDate: shiftWeek(s.anchorDate, -1) })),
  goToNextWeek: () => set((s) => ({ anchorDate: shiftWeek(s.anchorDate, 1) })),
  goToToday: () => set({ anchorDate: startOfCalendarWeek(new Date()) }),
  setAnchorDate: (date) => set({ anchorDate: startOfCalendarWeek(date) }),
  openCreateDialog: (defaults) => set({ dialogState: { mode: "create", defaults } }),
  openEditDialog: (event) => set({ dialogState: { mode: "edit", event } }),
  closeDialog: () => set({ dialogState: null }),
}))
