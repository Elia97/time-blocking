import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from "react"

import type { EventRow } from "@/db/schema"
import { useUpdateEvent } from "@/features/events/mutations"
import { computeResizeRange } from "../dragMath"

type ResizeState = {
  eventId: string
  direction: "top" | "bottom"
  source: { startAt: number; endAt: number }
  startClientY: number
  preview: { startAt: number; endAt: number }
}

export type EventResize = {
  state: ResizeState | null
  start: (event: EventRow, direction: "top" | "bottom", e: ReactPointerEvent) => void
}

export function useEventResize(): EventResize {
  const updateEvent = useUpdateEvent()
  const [state, setState] = useState<ResizeState | null>(null)

  useEffect(() => {
    if (!state) return
    const handleMove = (e: PointerEvent) => {
      const delta = e.clientY - state.startClientY
      const next = computeResizeRange(state.source, state.direction, delta)
      setState((curr) => (curr ? { ...curr, preview: next } : curr))
    }
    const handleUp = () => {
      const { eventId, preview, source } = state
      if (preview.startAt !== source.startAt || preview.endAt !== source.endAt) {
        updateEvent.mutate({
          id: eventId,
          patch: {
            startAt: preview.startAt,
            endAt: preview.endAt,
            dirty: 1,
            updatedAt: Date.now(),
          },
        })
      }
      setState(null)
    }
    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
    }
  }, [state, updateEvent])

  const start = useCallback(
    (event: EventRow, direction: "top" | "bottom", e: ReactPointerEvent) => {
      setState({
        eventId: event.id,
        direction,
        source: { startAt: event.startAt, endAt: event.endAt },
        startClientY: e.clientY,
        preview: { startAt: event.startAt, endAt: event.endAt },
      })
    },
    [],
  )

  return { state, start }
}
