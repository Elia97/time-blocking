import { create } from "zustand"

import type { EventRow } from "@/db/schema"

export type EventDialogState =
  | { mode: "create"; defaults?: { startAt?: number; endAt?: number; allDay?: boolean } }
  | { mode: "edit"; event: EventRow }
  | null

type EventDialogStore = {
  dialogState: EventDialogState
  openCreateDialog: (
    defaults?: NonNullable<EventDialogState & { mode: "create" }>["defaults"],
  ) => void
  openEditDialog: (event: EventRow) => void
  closeDialog: () => void
}

export const useEventDialog = create<EventDialogStore>((set) => ({
  dialogState: null,
  openCreateDialog: (defaults) => set({ dialogState: { mode: "create", defaults } }),
  openEditDialog: (event) => set({ dialogState: { mode: "edit", event } }),
  closeDialog: () => set({ dialogState: null }),
}))
