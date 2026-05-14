import { useEffect, useMemo, useState, type MouseEvent } from "react"
import { addDays, differenceInMinutes, format, isSameDay, startOfDay } from "date-fns"

import { ScrollArea } from "@/components/ui/scroll-area"
import { type EventRow } from "@/db/schema"
import { endOfCalendarWeek, formatHourLabel, getWeekDays, startOfCalendarWeek } from "@/lib/date"
import { cn } from "@/lib/utils"
import { useCalendarUiStore } from "@/stores/calendarUiStore"
import { DAY_HEIGHT_PX, HOUR_HEIGHT_PX, HOURS_PER_DAY, SLOT_HEIGHT_PX } from "./constants"
import { EventBlock } from "./EventBlock"
import { layoutOverlaps, type OverlapPosition } from "./overlap"
import { useEvents } from "./useEvents"

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

export function WeekView() {
  const anchorDate = useCalendarUiStore((s) => s.anchorDate)
  const openCreateDialog = useCalendarUiStore((s) => s.openCreateDialog)
  const openEditDialog = useCalendarUiStore((s) => s.openEditDialog)

  const { weekStart, weekEnd, weekDays } = useMemo(() => {
    const start = startOfCalendarWeek(anchorDate)
    const end = endOfCalendarWeek(anchorDate)
    return { weekStart: start, weekEnd: end, weekDays: getWeekDays(anchorDate) }
  }, [anchorDate])

  const { data: events = [] } = useEvents(weekStart, weekEnd)

  const dayLayouts = useMemo(
    () =>
      weekDays.map((day) => {
        const dayStart = startOfDay(day)
        const dayEnd = addDays(dayStart, 1)
        return {
          day,
          dayStart,
          positioned: buildDayLayout(dayStart, dayEnd, events),
          allDay: allDayEventsForDay(day, events),
        }
      }),
    [weekDays, events],
  )

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
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
                onSlotClick={(startAt, endAt) => openCreateDialog({ startAt, endAt })}
                onEventClick={openEditDialog}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
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
  onSlotClick: (startAt: number, endAt: number) => void
  onEventClick: (event: EventRow) => void
}

function DayColumn({ day, dayStart, positioned, now, onSlotClick, onEventClick }: DayColumnProps) {
  const isToday = isSameDay(day, now)
  const nowOffsetPx = isToday ? minutesToPx(differenceInMinutes(now, dayStart)) : null

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
      className={cn("border-border relative border-l", isToday && "bg-primary/4")}
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
          title={event.title}
          color={event.color}
          topPx={topPx}
          heightPx={heightPx}
          column={layout.column}
          totalColumns={layout.totalColumns}
          startLabel={format(new Date(event.startAt), "HH:mm")}
          endLabel={format(new Date(event.endAt), "HH:mm")}
          onClick={() => onEventClick(event)}
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
