import { startOfDay } from "date-fns"
import { DndContext } from "@dnd-kit/core"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useEventDialog } from "@/stores/eventDialogStore"
import { useWeekNavigation } from "@/stores/weekNavigationStore"
import { AllDayStrip } from "./components/AllDayStrip"
import { DayColumn } from "./components/DayColumn"
import { TimeGutter } from "./components/TimeGutter"
import { WeekHeader } from "./components/WeekHeader"
import { DAY_HEIGHT_PX } from "./constants"
import { useCalendarWeek } from "./hooks/useCalendarWeek"
import { useEventDrag } from "./hooks/useEventDrag"
import { useEventResize } from "./hooks/useEventResize"
import { useNowTicker } from "./hooks/useNowTicker"

export function WeekView() {
  const anchorDate = useWeekNavigation((s) => s.anchorDate)
  const openCreateDialog = useEventDialog((s) => s.openCreateDialog)
  const openEditDialog = useEventDialog((s) => s.openEditDialog)

  const now = useNowTicker()
  const resize = useEventResize()
  const drag = useEventDrag()

  const resizePreview = resize.state
    ? {
        eventId: resize.state.eventId,
        startAt: resize.state.preview.startAt,
        endAt: resize.state.preview.endAt,
      }
    : null

  const { dayLayouts } = useCalendarWeek(anchorDate, resizePreview)

  return (
    <DndContext sensors={drag.sensors} onDragEnd={drag.handleDragEnd}>
      <div className="bg-background border-border flex h-full flex-col overflow-hidden rounded-xl border">
        <WeekHeader days={dayLayouts.map((d) => d.day)} now={now} />
        <AllDayStrip
          days={dayLayouts.map(({ day, allDay }) => ({ day, events: allDay }))}
          onCreate={(day) => openCreateDialog({ startAt: startOfDay(day).getTime(), allDay: true })}
          onEdit={openEditDialog}
        />
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex">
            <TimeGutter />
            <div
              className="relative grid flex-1 grid-cols-7"
              data-testid="week-grid"
              style={{ height: `${DAY_HEIGHT_PX}px` }}
            >
              {dayLayouts.map(({ day, dayStart, positioned }) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  dayStart={dayStart}
                  positioned={positioned}
                  now={now}
                  resizingEventId={resize.state?.eventId ?? null}
                  onSlotClick={(startAt, endAt) => openCreateDialog({ startAt, endAt })}
                  onEventClick={openEditDialog}
                  onResizeStart={resize.start}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </DndContext>
  )
}
