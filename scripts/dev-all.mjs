/**
 * One command for local development:  npm run dev:all
 * Starts the local PostgreSQL (if it is not already listening) and then `next dev`.
 * Ctrl+C stops both.
 */
import net from "node:net";
import { spawn } from "node:child_process";

const DB_PORT = Number(process.env.LOCAL_DB_PORT || 54330);
const children = [];

const listening = (port) =>
  new Promise((resolve) => {
    const s = net.connect({ port, host: "127.0.0.1" });
    s.once("connect", () => (s.destroy(), resolve(true)));
    s.once("error", () => resolve(false));
  });

if (await listening(DB_PORT)) {
  console.log(`[dev:all] Local database already running on :${DB_PORT}`);
} else {
  console.log("[dev:all] Starting local database…");
  const db = spawn(process.execPath, ["scripts/local-db.mjs"], { stdio: ["ignore", "pipe", "inherit"] });
  children.push(db);
  await new Promise((resolve, reject) => {
    db.stdout.on("data", (d) => {
      process.stdout.write(`[db] ${d}`);
      if (String(d).includes("Local database ready")) resolve();
    });
    db.once("exit", (code) => reject(new Error(`local database exited early (code ${code})`)));
  });
}

const next = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "dev"], { stdio: "inherit", shell: process.platform === "win32" });
children.push(next);

const stop = () => {
  for (const c of children) c.kill("SIGINT");
  setTimeout(() => process.exit(0), 3000);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
next.once("exit", stop);
