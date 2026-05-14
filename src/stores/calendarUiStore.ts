import { create } from "zustand"

import { shiftWeek, startOfCalendarWeek } from "@/lib/date"

type CalendarUiState = {
  anchorDate: Date
  goToPrevWeek: () => void
  goToNextWeek: () => void
  goToToday: () => void
  setAnchorDate: (date: Date) => void
}

export const useCalendarUiStore = create<CalendarUiState>((set) => ({
  anchorDate: startOfCalendarWeek(new Date()),
  goToPrevWeek: () => set((s) => ({ anchorDate: shiftWeek(s.anchorDate, -1) })),
  goToNextWeek: () => set((s) => ({ anchorDate: shiftWeek(s.anchorDate, 1) })),
  goToToday: () => set({ anchorDate: startOfCalendarWeek(new Date()) }),
  setAnchorDate: (date) => set({ anchorDate: startOfCalendarWeek(date) }),
}))
