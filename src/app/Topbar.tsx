import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/app/ThemeToggle"
import { formatWeekRange } from "@/lib/date"
import { useCalendarUiStore } from "@/stores/calendarUiStore"

const views = ["Day", "Week", "Month"] as const

export function Topbar() {
  const anchorDate = useCalendarUiStore((s) => s.anchorDate)
  const goToPrevWeek = useCalendarUiStore((s) => s.goToPrevWeek)
  const goToNextWeek = useCalendarUiStore((s) => s.goToNextWeek)
  const goToToday = useCalendarUiStore((s) => s.goToToday)
  const openCreateDialog = useCalendarUiStore((s) => s.openCreateDialog)

  return (
    <header className="bg-background border-border flex h-14 items-center gap-3 border-b px-4">
      <h1 className="text-base font-semibold tracking-tight">{formatWeekRange(anchorDate)}</h1>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous week"
          onClick={goToPrevWeek}
          className="size-8"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next week"
          onClick={goToNextWeek}
          className="size-8"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <Separator orientation="vertical" className="h-6" />
      <div className="bg-muted text-muted-foreground inline-flex h-8 items-center rounded-md p-1 text-xs">
        {views.map((view, index) => (
          <button
            key={view}
            disabled={index !== 1}
            className={
              index === 1
                ? "bg-background text-foreground rounded px-3 py-1 font-medium shadow-sm"
                : "px-3 py-1"
            }
          >
            {view}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="default" onClick={() => openCreateDialog()}>
          <Plus className="size-4" />
          New event
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
