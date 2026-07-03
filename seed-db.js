const fs = require('fs');
const path = require('path');
const { Pool } = require('@neondatabase/serverless');

// Load environment variables manually if not run via Next.js
require('dotenv').config({ path: path.join(__dirname, '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Error: DATABASE_URL is not set in the .env file.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function main() {
  console.log("Connecting to NeonTech Database...");
  const client = await pool.connect();
  
  try {
    console.log("Creating tables...");
    
    // 1. Table for Questions
    await client.query(`
      CREATE TABLE IF NOT EXISTS preguntas (
          id SERIAL PRIMARY KEY,
          number INT NOT NULL,
          module VARCHAR(100) NOT NULL,
          question TEXT NOT NULL,
          options JSONB NOT NULL,
          correct INT NOT NULL,
          has_error BOOLEAN DEFAULT FALSE
      );
    `);

    // 2. Table for Study Progress
    await client.query(`
      CREATE TABLE IF NOT EXISTS estudio_progreso (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          module VARCHAR(100) NOT NULL,
          tiempo_segundos INT DEFAULT 0,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(email, module)
      );
    `);

    // 3. Table for Simulator Attempts
    await client.query(`
      CREATE TABLE IF NOT EXISTS examen_intentos (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          calificacion NUMERIC(5, 2) NOT NULL,
          aprobado BOOLEAN NOT NULL,
          respuestas_correctas INT NOT NULL,
          total_preguntas INT NOT NULL,
          detalles_modulos JSONB,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Table for Licencias/Días
    await client.query(`
      CREATE TABLE IF NOT EXISTS estudio_licencias (
          id SERIAL PRIMARY KEY,
          promotor_email VARCHAR(255) NOT NULL,
          agente_email VARCHAR(255) NOT NULL,
          dias_asignados INT DEFAULT 0,
          fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_expiracion TIMESTAMP,
          UNIQUE(promotor_email, agente_email)
      );
    `);

    // 5. Table for Promotores Saldos
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotor_saldos (
          promotor_email VARCHAR(255) PRIMARY KEY,
          dias_disponibles INT DEFAULT 7,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Tables created successfully.");

    // Seeding questions
    console.log("Reading preguntas.json...");
    const jsonPath = path.join(__dirname, 'public', 'cedula-a', 'preguntas.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`preguntas.json not found at: ${jsonPath}`);
    }
    const questionsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Check if questions are already seeded
    const { rows } = await client.query("SELECT COUNT(*) FROM preguntas");
    const count = parseInt(rows[0].count);
    
    if (count > 0) {
      console.log(`Database already has ${count} questions. Skipping questions seed.`);
    } else {
      console.log(`Seeding ${questionsData.length} questions to Neon...`);
      
      // Let's seed in transactions in batches of 100 for speed
      for (let i = 0; i < questionsData.length; i += 100) {
        const batch = questionsData.slice(i, i + 100);
        await client.query("BEGIN");
        for (const q of batch) {
          await client.query(
            "INSERT INTO preguntas (number, module, question, options, correct, has_error) VALUES ($1, $2, $3, $4, $5, $6)",
            [q.number, q.module, q.question, JSON.stringify(q.options), q.correct, q.has_error || false]
          );
        }
        await client.query("COMMIT");
        console.log(`Inserted batch ${i} to ${Math.min(i + 100, questionsData.length)}...`);
      }
      console.log("Questions seeded successfully!");
    }

  } catch (err) {
    console.error("Error during seeding process:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
