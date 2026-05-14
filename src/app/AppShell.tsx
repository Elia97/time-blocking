import { Sidebar } from "@/app/Sidebar"
import { Topbar } from "@/app/Topbar"

export function AppShell() {
  return (
    <div className="bg-background text-foreground flex h-full min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="bg-muted/20 flex-1 overflow-hidden p-6">
          <PlaceholderCanvas />
        </main>
      </div>
    </div>
  )
}

function PlaceholderCanvas() {
  return (
    <div className="border-border bg-background/60 flex h-full items-center justify-center rounded-xl border border-dashed">
      <div className="max-w-md space-y-3 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">Phase 0</p>
        <h2 className="text-2xl font-semibold tracking-tight">App shell ready</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The calendar grid, drag &amp; drop, and event editor land in Phase 1. See
          <span className="text-foreground"> README.md</span> for the full roadmap.
        </p>
      </div>
    </div>
  )
}
