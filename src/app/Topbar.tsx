import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/app/ThemeToggle"
import { formatWeekRange } from "@/lib/date"
import { useEventDialog } from "@/stores/eventDialogStore"
import { useWeekNavigation } from "@/stores/weekNavigationStore"

const views = ["Day", "Week", "Month"] as const

export function Topbar() {
  const anchorDate = useWeekNavigation((s) => s.anchorDate)
  const goToPrevWeek = useWeekNavigation((s) => s.goToPrevWeek)
  const goToNextWeek = useWeekNavigation((s) => s.goToNextWeek)
  const goToToday = useWeekNavigation((s) => s.goToToday)
  const openCreateDialog = useEventDialog((s) => s.openCreateDialog)

  return (
    <header className="bg-background border-border grid h-14 grid-cols-3 items-center border-b px-4">
      <div className="flex items-center gap-3 justify-self-start">
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
      </div>

      <h1 className="justify-self-center text-base font-semibold tracking-tight tabular-nums">
        {formatWeekRange(anchorDate)}
      </h1>

      <div className="flex items-center gap-2 justify-self-end">
        <Button size="sm" variant="default" onClick={() => openCreateDialog()}>
          <Plus className="size-4" />
          New event
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
