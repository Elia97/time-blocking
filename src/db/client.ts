import Database from "@tauri-apps/plugin-sql"
import { drizzle } from "drizzle-orm/sqlite-proxy"

import * as schema from "./schema"

export const DATABASE_NAME = "sqlite:time-blocking.db"

let sqlitePromise: Promise<Database> | null = null

function loadSqlite(): Promise<Database> {
  if (!sqlitePromise) {
    sqlitePromise = Database.load(DATABASE_NAME)
  }
  return sqlitePromise
}

type DrizzleMethod = "run" | "all" | "values" | "get"

function isSelect(method: DrizzleMethod): boolean {
  return method === "all" || method === "values" || method === "get"
}

export const db = drizzle(
  async (sql, params, method) => {
    const sqlite = await loadSqlite()

    if (isSelect(method as DrizzleMethod)) {
      const rows = await sqlite.select<Record<string, unknown>[]>(sql, params)
      const values = rows.map((row) => Object.values(row))

      if (method === "get") {
        return { rows: values[0] ?? [] }
      }

      return { rows: values }
    }

    await sqlite.execute(sql, params)
    return { rows: [] }
  },
  { schema, casing: "snake_case" },
)

export async function getSqlite(): Promise<Database> {
  return loadSqlite()
}
