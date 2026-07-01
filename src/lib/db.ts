import { Pool } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  // During local development without .env DATABASE_URL, we don't fail immediately to avoid build crashes
  console.warn("Warning: DATABASE_URL is not set in environment variables.")
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
