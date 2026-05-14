import { useMutation, useQueryClient } from "@tanstack/react-query"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { events, type EventRow, type NewEvent } from "@/db/schema"

const EVENTS_KEY_PREFIX = "events"

function invalidateEvents(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: [EVENTS_KEY_PREFIX] })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (row: NewEvent) => {
      await db.insert(events).values(row)
      return row
    },
    onSuccess: () => invalidateEvents(queryClient),
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<EventRow> }) => {
      await db.update(events).set(patch).where(eq(events.id, id))
      return { id, patch }
    },
    onSuccess: () => invalidateEvents(queryClient),
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, nowMs = Date.now() }: { id: string; nowMs?: number }) => {
      await db
        .update(events)
        .set({ deletedAt: nowMs, dirty: 1, updatedAt: nowMs })
        .where(eq(events.id, id))
      return { id }
    },
    onSuccess: () => invalidateEvents(queryClient),
  })
}
