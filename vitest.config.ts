import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test/**",
        "src/components/ui/**",
        "src/db/**",
        "src/features/events/mutations.ts",
        "src/features/calendar/useEvents.ts",
        "src/features/calendar/components/**",
        "src/features/calendar/WeekView.tsx",
        "src/features/calendar/EventBlock.tsx",
        "src/features/calendar/hooks/useEventDrag.ts",
        "src/features/calendar/hooks/useEventResize.ts",
        "src/features/calendar/hooks/useCalendarWeek.ts",
        "src/features/events/EventDialogForm.tsx",
        "src/app/Providers.tsx",
        "src/vite-env.d.ts",
        "src/main.tsx",
        "src/App.tsx",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
})
