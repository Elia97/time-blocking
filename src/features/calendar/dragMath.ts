import { SLOT_HEIGHT_PX } from "./constants"

const MS_PER_MIN = 60_000
const MS_PER_DAY = 24 * 60 * MS_PER_MIN
export const SNAP_MINUTES = 15
export const MIN_EVENT_MINUTES = 15

export function pxToMinutes(px: number): number {
  return (px / SLOT_HEIGHT_PX) * SNAP_MINUTES
}

export function snapMinutes(min: number, step: number = SNAP_MINUTES): number {
  return Math.round(min / step) * step
}

export type TimeRange = { startAt: number; endAt: number }

export function computeMoveRange(
  source: TimeRange,
  deltaY: number,
  dayShiftDays: number,
): TimeRange {
  const minutesDelta = snapMinutes(pxToMinutes(deltaY))
  const dayDelta = dayShiftDays * MS_PER_DAY
  const startAt = source.startAt + minutesDelta * MS_PER_MIN + dayDelta
  const endAt = source.endAt + minutesDelta * MS_PER_MIN + dayDelta
  return { startAt, endAt }
}

export function dayShiftFrom(sourceStartAt: number, targetDayStartMs: number | undefined): number {
  if (targetDayStartMs === undefined) return 0
  const source = new Date(sourceStartAt)
  const sourceDayStart = new Date(
    source.getFullYear(),
    source.getMonth(),
    source.getDate(),
  ).getTime()
  return Math.round((targetDayStartMs - sourceDayStart) / MS_PER_DAY)
}

export type DragEndPatch = {
  id: string
  startAt: number
  endAt: number
} | null

export function applyDragEnd(
  event: { id: string; startAt: number; endAt: number },
  deltaY: number,
  targetDayStartMs: number | undefined,
): DragEndPatch {
  const next = computeMoveRange(event, deltaY, dayShiftFrom(event.startAt, targetDayStartMs))
  if (next.startAt === event.startAt && next.endAt === event.endAt) return null
  return { id: event.id, startAt: next.startAt, endAt: next.endAt }
}

export function computeResizeRange(
  source: TimeRange,
  direction: "top" | "bottom",
  deltaY: number,
): TimeRange {
  const minutesDelta = snapMinutes(pxToMinutes(deltaY))
  if (direction === "top") {
    const minStart = source.endAt - MIN_EVENT_MINUTES * MS_PER_MIN
    const startAt = Math.min(source.startAt + minutesDelta * MS_PER_MIN, minStart)
    return { startAt, endAt: source.endAt }
  }
  const maxEnd = source.startAt + MIN_EVENT_MINUTES * MS_PER_MIN
  const endAt = Math.max(source.endAt + minutesDelta * MS_PER_MIN, maxEnd)
  return { startAt: source.startAt, endAt }
}
