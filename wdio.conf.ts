import { type ChildProcess, spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

import "./e2e/types/wdio-tauri.d.ts"

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const application = path.resolve(projectRoot, "src-tauri/target/release/time-blocking")

let tauriDriver: ChildProcess | undefined

export const config: WebdriverIO.Config = {
  runner: "local",
  hostname: "127.0.0.1",
  port: 4444,
  specs: ["./e2e/specs/**/*.e2e.ts"],
  maxInstances: 1,
  capabilities: [
    {
      "tauri:options": {
        application,
      },
    },
  ],
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 60_000,
  },
  logLevel: "warn",
  outputDir: "./e2e/logs",
  waitforTimeout: 10_000,

  onPrepare: () =>
    new Promise<void>((resolve, reject) => {
      tauriDriver = spawn("tauri-driver", [], {
        stdio: ["ignore", "inherit", "inherit"],
      })
      tauriDriver.once("error", (err) => reject(new Error(`tauri-driver failed: ${err.message}`)))
      // Give tauri-driver a moment to bind its port before WebdriverIO connects.
      setTimeout(resolve, 1500)
    }),

  onComplete: () => {
    tauriDriver?.kill()
  },
}
