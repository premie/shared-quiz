#!/usr/bin/env node
/**
 * Catalog check: the mold qualifier injury prompt must list hair loss
 * among the example symptoms (public copy on conduit.law + moldlawking.com).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(root, "questions.ts"), "utf8");
const match = src.match(/id:\s*"injury"[\s\S]*?sub:\s*"([^"]+)"/);

if (!match) {
  console.error("assert-injury-examples: could not find injury question sub copy");
  process.exit(1);
}

const sub = match[1];
if (!/\bhair loss\b/i.test(sub)) {
  console.error(`assert-injury-examples: injury examples missing "hair loss":\n  ${sub}`);
  process.exit(1);
}

console.log(`assert-injury-examples: ok — ${sub}`);
