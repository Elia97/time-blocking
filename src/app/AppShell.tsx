import { Sidebar } from "@/app/Sidebar"
import { Topbar } from "@/app/Topbar"
import { WeekView } from "@/features/calendar/WeekView"

export function AppShell() {
  return (
    <div className="bg-background text-foreground flex h-full min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="bg-muted/20 flex-1 overflow-hidden p-4">
          <WeekView />
        </main>
      </div>
    </div>
  )
}
