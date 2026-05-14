import { useCallback } from "react"
import { PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"

import type { EventRow } from "@/db/schema"
import { useUpdateEvent } from "@/features/events/mutations"
import { applyDragEnd } from "../dragMath"

export type EventDrag = {
  sensors: ReturnType<typeof useSensors>
  handleDragEnd: (e: DragEndEvent) => void
}

export function useEventDrag(): EventDrag {
  const updateEvent = useUpdateEvent()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const dragged = e.active.data.current?.event as EventRow | undefined
      const overDayStart = e.over?.data.current?.dayStart as number | undefined
      if (!dragged) return
      const patch = applyDragEnd(dragged, e.delta.y, overDayStart)
      if (!patch) return
      updateEvent.mutate({
        id: patch.id,
        patch: {
          startAt: patch.startAt,
          endAt: patch.endAt,
          dirty: 1,
          updatedAt: Date.now(),
        },
      })
    },
    [updateEvent],
  )

  return { sensors, handleDragEnd }
}
