const { Client } = require('@neondatabase/serverless');

async function main() {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();
  
  // List all agencies
  const res = await client.query(
    `SELECT id, name, slug, "logoUrl" FROM "Agency" ORDER BY name`
  );
  console.log("All agencies:", JSON.stringify(res.rows, null, 2));
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
