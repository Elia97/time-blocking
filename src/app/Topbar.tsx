import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/app/ThemeToggle"

const views = ["Day", "Week", "Month"] as const

export function Topbar() {
  return (
    <header className="bg-background border-border flex h-14 items-center gap-3 border-b px-4">
      <h1 className="text-base font-semibold tracking-tight">Today</h1>
      <Separator orientation="vertical" className="h-6" />
      <div className="bg-muted text-muted-foreground inline-flex h-8 items-center rounded-md p-1 text-xs">
        {views.map((view, index) => (
          <button
            key={view}
            disabled
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
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button size="sm" variant="default" disabled>
                <Plus className="size-4" />
                New event
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Available in Phase 1</TooltipContent>
        </Tooltip>
        <ThemeToggle />
      </div>
    </header>
  )
}
