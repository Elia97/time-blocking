import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./App"
import "./index.css"

if (import.meta.env.VITE_E2E === "true") {
  const { installE2EMocks } = await import("./test/e2e-mock")
  installE2EMocks()
}

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("Root element #root was not found in index.html")
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
