import { format } from "date-fns"

import type { EventRow } from "@/db/schema"
import { cn } from "@/lib/utils"

export type AllDayStripProps = {
  days: { day: Date; events: EventRow[] }[]
  onCreate: (day: Date) => void
  onEdit: (event: EventRow) => void
}

export function AllDayStrip({ days, onCreate, onEdit }: AllDayStripProps) {
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
