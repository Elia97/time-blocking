import { formatHourLabel } from "@/lib/date"
import { HOURS_PER_DAY, HOUR_HEIGHT_PX } from "../constants"

export function TimeGutter() {
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
