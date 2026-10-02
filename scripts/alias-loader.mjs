/**
 * Node ESM resolve hook so unit tests can import project TypeScript that uses
 * the "@/..." path alias (Node strips the types itself).
 *
 *   node --import ./scripts/register-alias.mjs --test scripts/unit/*.test.mjs
 */
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const SRC = path.resolve(process.cwd(), "src");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = path.join(SRC, specifier.slice(2));
    for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
      if (existsSync(candidate)) return nextResolve(pathToFileURL(candidate).href, context);
    }
  }
  return nextResolve(specifier, context);
}
