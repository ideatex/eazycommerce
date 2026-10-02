/**
 * Persistent local development PostgreSQL (embedded-postgres) on port 54330.
 * Data lives in ./.local-db (git-ignored). Keep this process running while developing:
 *
 *   npm run db:local
 *
 * First run creates the "vanigam" database. Then: npx prisma db push && npm run db:seed
 */
import fs from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

const port = Number(process.env.LOCAL_DB_PORT || 54330);
const dataDir = path.resolve(process.cwd(), ".local-db");
const fresh = !fs.existsSync(path.join(dataDir, "PG_VERSION"));

const server = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

if (fresh) await server.initialise();
await server.start();

const admin = new pg.Client({ connectionString: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres` });
await admin.connect();
const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'vanigam'");
if (exists.rowCount === 0) await admin.query("CREATE DATABASE vanigam");
await admin.end();

console.log(`Local database ready: postgresql://postgres:postgres@127.0.0.1:${port}/vanigam`);

const stop = async () => {
  await server.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
