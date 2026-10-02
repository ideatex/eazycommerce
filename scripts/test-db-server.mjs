/**
 * Disposable real PostgreSQL for integration tests (embedded-postgres).
 * Creates a fresh data directory, applies the schema generated from
 * prisma/schema.prisma and keeps the server running until interrupted.
 * It never touches the Postgres configured in .env.
 *
 *   node scripts/test-db-server.mjs [port]      # default 54329
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

const port = Number(process.argv[2] || 54329);
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "vanigam-test-pg-"));

const schemaSql = execSync(
  "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
  { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }
);

const server = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: false,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});
await server.initialise();
await server.start();

const client = new pg.Client({ connectionString: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres` });
await client.connect();
await client.query(schemaSql);
await client.end();

console.log(`Test PostgreSQL ready on 127.0.0.1:${port}`);
console.log(`DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:${port}/postgres`);

const stop = async () => {
  try {
    await server.stop();
  } finally {
    fs.rmSync(dataDir, { recursive: true, force: true });
    process.exit(0);
  }
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
