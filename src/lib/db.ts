import { Pool, neonConfig } from "@neondatabase/serverless"
import ws from "ws"

neonConfig.webSocketConstructor = ws

if (!process.env.DATABASE_URL) {
  console.warn("Warning: DATABASE_URL is not set in environment variables.")
}

const globalForPool = global as unknown as { pool: Pool }

export const pool =
  globalForPool.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // limit active connections per instance
    idleTimeoutMillis: 10000, // close idle connections after 10s
    connectionTimeoutMillis: 5000, // timeout quickly if database is locked or slow
  })

if (process.env.NODE_ENV !== "production") globalForPool.pool = pool
