// Augments WebdriverIO capabilities with the Tauri-specific `tauri:options` field
// consumed by `tauri-driver` to launch the desktop binary.

declare global {
  namespace WebdriverIO {
    interface Capabilities {
      "tauri:options"?: {
        application: string
      }
    }
  }
}

export {}
