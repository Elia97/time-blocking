import { CalendarDays, Hash, Inbox, Tag } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

const sections: { title: string; icon: typeof CalendarDays; hint: string }[] = [
  { title: "Calendars", icon: CalendarDays, hint: "Local + Google (Phase 4)" },
  { title: "Categories", icon: Inbox, hint: "Phase 2" },
  { title: "Tags", icon: Tag, hint: "Phase 2" },
  { title: "Filters", icon: Hash, hint: "Phase 2" },
]

export function Sidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-64 shrink-0 flex-col border-r">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-md text-sm font-bold">
          T
        </div>
        <span className="text-sm font-semibold tracking-tight">Time Blocking</span>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-4">
          {sections.map(({ title, icon: Icon, hint }) => (
            <div key={title} className="space-y-1">
              <div className="text-sidebar-foreground/70 flex items-center gap-2 px-2 text-xs font-medium tracking-wider uppercase">
                <Icon className="size-3.5" />
                {title}
              </div>
              <div className="text-muted-foreground bg-sidebar-accent/40 mx-2 rounded-md px-3 py-2 text-xs">
                {hint}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="text-muted-foreground px-4 py-3 text-[11px]">v0.1.0 · local-only</div>
    </aside>
  )
}
