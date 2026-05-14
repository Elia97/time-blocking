import { type ChildProcess, spawn } from "node:child_process"
import net from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"

import "./e2e/types/wdio-tauri.d.ts"

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const application = path.resolve(projectRoot, "src-tauri/target/release/time-blocking")

const DRIVER_HOST = "127.0.0.1"
const DRIVER_PORT = 4444
const DRIVER_READY_TIMEOUT_MS = 15_000
const DRIVER_PROBE_INTERVAL_MS = 200

let tauriDriver: ChildProcess | undefined

function waitForPort(host: string, port: number, timeoutMs: number): Promise<void> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const probe = () => {
      const socket = net.createConnection({ host, port })
      socket.once("connect", () => {
        socket.destroy()
        resolve()
      })
      socket.once("error", () => {
        socket.destroy()
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`tauri-driver did not bind ${host}:${port} within ${timeoutMs}ms`))
        } else {
          setTimeout(probe, DRIVER_PROBE_INTERVAL_MS)
        }
      })
    }
    probe()
  })
}

export const config: WebdriverIO.Config = {
  runner: "local",
  hostname: DRIVER_HOST,
  port: DRIVER_PORT,
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

  onPrepare: async () => {
    tauriDriver = spawn("tauri-driver", [], {
      stdio: ["ignore", "inherit", "inherit"],
    })
    tauriDriver.once("exit", (code, signal) => {
      if (code !== 0 && signal !== "SIGTERM") {
        console.error(`tauri-driver exited unexpectedly (code=${code}, signal=${signal})`)
      }
    })
    await waitForPort(DRIVER_HOST, DRIVER_PORT, DRIVER_READY_TIMEOUT_MS)
  },

  onComplete: () => {
    tauriDriver?.kill()
  },
}
