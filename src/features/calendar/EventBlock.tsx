import { useMemo } from "react"

import { cn } from "@/lib/utils"
import { MIN_EVENT_HEIGHT_PX } from "./constants"

export type EventBlockProps = {
  title: string
  color?: string | null
  topPx: number
  heightPx: number
  column: number
  totalColumns: number
  startLabel: string
  endLabel: string
}

export function EventBlock({
  title,
  color,
  topPx,
  heightPx,
  column,
  totalColumns,
  startLabel,
  endLabel,
}: EventBlockProps) {
  const style = useMemo(() => {
    const widthPct = 100 / totalColumns
    const leftPct = widthPct * column
    return {
      top: `${topPx}px`,
      height: `${Math.max(MIN_EVENT_HEIGHT_PX, heightPx)}px`,
      left: `calc(${leftPct}% + 2px)`,
      width: `calc(${widthPct}% - 4px)`,
      backgroundColor: color ?? undefined,
    }
  }, [topPx, heightPx, column, totalColumns, color])

  return (
    <div
      role="button"
      tabIndex={0}
      style={style}
      className={cn(
        "border-primary/40 bg-primary/15 text-foreground absolute z-10 flex flex-col gap-0.5",
        "overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-xs leading-tight",
        "hover:bg-primary/25 focus:ring-ring focus:ring-2 focus:outline-none",
      )}
      data-event-block
      data-column={column}
      data-total-columns={totalColumns}
    >
      <span className="truncate font-medium">{title}</span>
      <span className="text-muted-foreground truncate text-[10px]">
        {startLabel}-{endLabel}
      </span>
    </div>
  )
}
