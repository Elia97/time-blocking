import { format, isSameDay } from "date-fns"

import { cn } from "@/lib/utils"

export function WeekHeader({ days, now }: { days: Date[]; now: Date }) {
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
