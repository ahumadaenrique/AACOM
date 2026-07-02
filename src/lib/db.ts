import { Pool, neonConfig } from "@neondatabase/serverless"
import ws from "ws"

// Configure Neon serverless driver to use the ws package in Node.js environment
neonConfig.webSocketConstructor = ws

if (!process.env.DATABASE_URL) {
  console.warn("Warning: DATABASE_URL is not set in environment variables.")
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
