import { useEffect, useMemo, useState } from "react"
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

export function WeekView() {
  const anchorDate = useCalendarUiStore((s) => s.anchorDate)

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
        return { day, dayStart, positioned: buildDayLayout(dayStart, dayEnd, events) }
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
}

function DayColumn({ day, dayStart, positioned, now }: DayColumnProps) {
  const isToday = isSameDay(day, now)
  const nowOffsetPx = isToday ? minutesToPx(differenceInMinutes(now, dayStart)) : null

  return (
    <div
      className={cn("border-border relative border-l", isToday && "bg-primary/4")}
      data-day={format(day, "yyyy-MM-dd")}
      data-testid="day-column"
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
