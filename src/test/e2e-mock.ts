import { mockIPC } from "@tauri-apps/api/mocks"

type SqlPayload = {
  db?: string
  query?: string
  values?: unknown[]
}

const noopResult: [number, number] = [0, 0]

export function installE2EMocks(): void {
  mockIPC((cmd, payload) => {
    if (!cmd.startsWith("plugin:sql|")) {
      return undefined
    }
    const action = cmd.slice("plugin:sql|".length)
    const args = (payload ?? {}) as SqlPayload

    switch (action) {
      case "load":
        return args.db ?? "sqlite:e2e.db"
      case "close":
        return true
      case "execute":
        return noopResult
      case "select":
        return []
      default:
        return undefined
    }
  })

  document.documentElement.dataset.e2e = "true"
}
