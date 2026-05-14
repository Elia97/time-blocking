import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { addDays, differenceInMinutes, format, isSameDay, startOfDay } from "date-fns"

import { ScrollArea } from "@/components/ui/scroll-area"
import { type EventRow } from "@/db/schema"
import { endOfCalendarWeek, formatHourLabel, getWeekDays, startOfCalendarWeek } from "@/lib/date"
import { cn } from "@/lib/utils"
import { useCalendarUiStore } from "@/stores/calendarUiStore"
import { DAY_HEIGHT_PX, HOUR_HEIGHT_PX, HOURS_PER_DAY, SLOT_HEIGHT_PX } from "./constants"
import { EventBlock } from "./EventBlock"
import { applyDragEnd, computeResizeRange } from "./dragMath"
import { layoutOverlaps, type OverlapPosition } from "./overlap"
import { useEvents } from "./useEvents"
import { useUpdateEvent } from "@/features/events/mutations"

type PositionedEvent = {
  event: EventRow
  topPx: number
  heightPx: number
  layout: OverlapPosition
}

function minutesToPx(minutes: number): number {
  return (minutes / 15) * SLOT_HEIGHT_PX
}

function buildDayLayout(dayStart: Date, dayEnd: Date, all: EventRow[]): PositionedEvent[] {
  const dayStartMs = dayStart.getTime()
  const dayEndMs = dayEnd.getTime()
  const visible = all.filter((e) => !e.allDay && e.endAt > dayStartMs && e.startAt < dayEndMs)
  if (visible.length === 0) return []
  const positions = layoutOverlaps(
    visible.map((e) => ({
      id: e.id,
      startAt: Math.max(e.startAt, dayStartMs),
      endAt: Math.min(e.endAt, dayEndMs),
    })),
  )
  return visible.map((event) => {
    const clippedStart = Math.max(event.startAt, dayStartMs)
    const clippedEnd = Math.min(event.endAt, dayEndMs)
    const topMin = differenceInMinutes(new Date(clippedStart), dayStart)
    const durationMin = Math.max(
      15,
      differenceInMinutes(new Date(clippedEnd), new Date(clippedStart)),
    )
    return {
      event,
      topPx: minutesToPx(topMin),
      heightPx: minutesToPx(durationMin),
      layout: positions.get(event.id) ?? { column: 0, totalColumns: 1 },
    }
  })
}

function allDayEventsForDay(day: Date, all: EventRow[]): EventRow[] {
  const dayStart = startOfDay(day).getTime()
  const dayEnd = addDays(startOfDay(day), 1).getTime()
  return all.filter((e) => e.allDay && e.endAt > dayStart && e.startAt < dayEnd)
}

type ResizeState = {
  eventId: string
  direction: "top" | "bottom"
  source: { startAt: number; endAt: number }
  startClientY: number
  preview: { startAt: number; endAt: number }
}

export function WeekView() {
  const anchorDate = useCalendarUiStore((s) => s.anchorDate)
  const openCreateDialog = useCalendarUiStore((s) => s.openCreateDialog)
  const openEditDialog = useCalendarUiStore((s) => s.openEditDialog)
  const updateEvent = useUpdateEvent()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const { weekStart, weekEnd, weekDays } = useMemo(() => {
    const start = startOfCalendarWeek(anchorDate)
    const end = endOfCalendarWeek(anchorDate)
    return { weekStart: start, weekEnd: end, weekDays: getWeekDays(anchorDate) }
  }, [anchorDate])

  const { data: events = [] } = useEvents(weekStart, weekEnd)

  const [resize, setResize] = useState<ResizeState | null>(null)

  const displayedEvents = useMemo(() => {
    if (!resize) return events
    return events.map((e) =>
      e.id === resize.eventId
        ? { ...e, startAt: resize.preview.startAt, endAt: resize.preview.endAt }
        : e,
    )
  }, [events, resize])

  const dayLayouts = useMemo(
    () =>
      weekDays.map((day) => {
        const dayStart = startOfDay(day)
        const dayEnd = addDays(dayStart, 1)
        return {
          day,
          dayStart,
          positioned: buildDayLayout(dayStart, dayEnd, displayedEvents),
          allDay: allDayEventsForDay(day, displayedEvents),
        }
      }),
    [weekDays, displayedEvents],
  )

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!resize) return
    const handleMove = (e: PointerEvent) => {
      const delta = e.clientY - resize.startClientY
      const next = computeResizeRange(resize.source, resize.direction, delta)
      setResize((curr) => (curr ? { ...curr, preview: next } : curr))
    }
    const handleUp = () => {
      const { eventId, preview, source } = resize
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
      setResize(null)
    }
    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
    }
  }, [resize, updateEvent])

  const handleResizeStart = useCallback(
    (event: EventRow, direction: "top" | "bottom", e: ReactPointerEvent) => {
      setResize({
        eventId: event.id,
        direction,
        source: { startAt: event.startAt, endAt: event.endAt },
        startClientY: e.clientY,
        preview: { startAt: event.startAt, endAt: event.endAt },
      })
    },
    [],
  )

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

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="bg-background border-border flex h-full flex-col overflow-hidden rounded-xl border">
        <WeekHeader days={weekDays} now={now} />
        <AllDayStrip
          days={dayLayouts.map(({ day, allDay }) => ({ day, events: allDay }))}
          onCreate={(day) => openCreateDialog({ startAt: startOfDay(day).getTime(), allDay: true })}
          onEdit={openEditDialog}
        />
        <ScrollArea className="flex-1">
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
                  resizingEventId={resize?.eventId ?? null}
                  onSlotClick={(startAt, endAt) => openCreateDialog({ startAt, endAt })}
                  onEventClick={openEditDialog}
                  onResizeStart={handleResizeStart}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </DndContext>
  )
}

function WeekHeader({ days, now }: { days: Date[]; now: Date }) {
  return (
    <div className="bg-background border-border flex border-b" role="row">
      <div className="w-14 shrink-0" aria-hidden />
      <div className="grid flex-1 grid-cols-7">
        {days.map((day) => {
          const isToday = isSameDay(day, now)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-border flex flex-col items-center gap-0.5 border-l px-2 py-2 text-xs",
                isToday && "text-primary",
              )}
            >
              <span className="text-muted-foreground uppercase">{format(day, "EEE")}</span>
              <span
                className={cn(
                  "text-base font-semibold",
                  isToday && "bg-primary text-primary-foreground rounded-full px-2 py-0.5",
                )}
              >
                {format(day, "d")}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type AllDayStripProps = {
  days: { day: Date; events: EventRow[] }[]
  onCreate: (day: Date) => void
  onEdit: (event: EventRow) => void
}

function AllDayStrip({ days, onCreate, onEdit }: AllDayStripProps) {
  return (
    <div className="bg-muted/30 border-border flex border-b" data-testid="all-day-strip">
      <div className="text-muted-foreground flex w-14 shrink-0 items-center justify-end pr-2 text-[10px] uppercase">
        All&nbsp;day
      </div>
      <div className="grid flex-1 grid-cols-7">
        {days.map(({ day, events }) => (
          <button
            key={day.toISOString()}
            type="button"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("[data-allday-chip]")) return
              onCreate(day)
            }}
            className={cn(
              "border-border hover:bg-accent/30 min-h-7 cursor-pointer space-y-1 border-l px-1 py-1 text-left",
            )}
            aria-label={`Add all-day event on ${format(day, "EEE d MMM")}`}
          >
            {events.length === 0 ? (
              <span className="text-muted-foreground/40 block text-[10px]">+</span>
            ) : (
              events.map((event) => (
                <span
                  key={event.id}
                  data-allday-chip
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(event)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onEdit(event)
                    }
                  }}
                  className="bg-primary/15 hover:bg-primary/25 block cursor-pointer truncate rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: event.color ?? undefined }}
                >
                  {event.title}
                </span>
              ))
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function TimeGutter() {
  return (
    <div className="border-border w-14 shrink-0 border-r" aria-hidden>
      {Array.from({ length: HOURS_PER_DAY }, (_, h) => (
        <div
          key={h}
          className="text-muted-foreground relative pr-1 text-right text-[10px]"
          style={{ height: `${HOUR_HEIGHT_PX}px` }}
        >
          <span className="absolute -top-1.5 right-1">{h === 0 ? "" : formatHourLabel(h)}</span>
        </div>
      ))}
    </div>
  )
}

type DayColumnProps = {
  day: Date
  dayStart: Date
  positioned: PositionedEvent[]
  now: Date
  resizingEventId: string | null
  onSlotClick: (startAt: number, endAt: number) => void
  onEventClick: (event: EventRow) => void
  onResizeStart: (event: EventRow, direction: "top" | "bottom", e: ReactPointerEvent) => void
}

function DayColumn({
  day,
  dayStart,
  positioned,
  now,
  resizingEventId,
  onSlotClick,
  onEventClick,
  onResizeStart,
}: DayColumnProps) {
  const isToday = isSameDay(day, now)
  const nowOffsetPx = isToday ? minutesToPx(differenceInMinutes(now, dayStart)) : null

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${format(day, "yyyy-MM-dd")}`,
    data: { dayStart: dayStart.getTime() },
  })

  const handleSlotClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-event-block]")) return
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const minutesFromMidnight = (offsetY / SLOT_HEIGHT_PX) * 15
    const snapped = Math.max(0, Math.min(24 * 60 - 30, Math.floor(minutesFromMidnight / 15) * 15))
    const startAt = dayStart.getTime() + snapped * 60_000
    const endAt = startAt + 30 * 60_000
    onSlotClick(startAt, endAt)
  }

  return (
    // Click-to-create on the column body; nested events/indicators are real buttons.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      ref={setNodeRef}
      className={cn(
        "border-border relative border-l",
        isToday && "bg-primary/4",
        isOver && "bg-accent/20",
      )}
      data-day={format(day, "yyyy-MM-dd")}
      data-testid="day-column"
      onClick={handleSlotClick}
    >
      {Array.from({ length: HOURS_PER_DAY }, (_, h) => (
        <div
          key={h}
          className="border-border/60 absolute right-0 left-0 border-t"
          style={{ top: `${h * HOUR_HEIGHT_PX}px` }}
          aria-hidden
        />
      ))}
      {positioned.map(({ event, topPx, heightPx, layout }) => (
        <EventBlock
          key={event.id}
          event={event}
          topPx={topPx}
          heightPx={heightPx}
          column={layout.column}
          totalColumns={layout.totalColumns}
          startLabel={format(new Date(event.startAt), "HH:mm")}
          endLabel={format(new Date(event.endAt), "HH:mm")}
          isResizing={resizingEventId === event.id}
          onClick={() => onEventClick(event)}
          onResizeStart={(direction, e) => onResizeStart(event, direction, e)}
        />
      ))}
      {nowOffsetPx !== null && (
        <div
          data-testid="current-time-indicator"
          className="bg-destructive pointer-events-none absolute right-0 left-0 z-20 h-px"
          style={{ top: `${nowOffsetPx}px` }}
        >
          <div className="bg-destructive absolute -top-1 -left-1 size-2 rounded-full" />
        </div>
      )}
    </div>
  )
}
