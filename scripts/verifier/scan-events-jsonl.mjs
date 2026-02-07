#!/usr/bin/env node
import path from "node:path";

import { parseEventsJsonlFile } from "./workflow-matcher.mjs";

const args = process.argv.slice(2);
const getArg = (key) => {
  const idx = args.indexOf(key);
  if (idx === -1) return null;
  return args[idx + 1] || null;
};

const filePath = getArg("--file");
const failOnErrors = args.includes("--fail-on-errors");

if (!filePath) {
  // eslint-disable-next-line no-console
  console.error(
    "Usage: node scripts/verifier/scan-events-jsonl.mjs --file .ralph/events-*.jsonl [--fail-on-errors]",
  );
  process.exit(1);
}

const resolved = path.resolve(process.cwd(), filePath);
const { events, errors } = parseEventsJsonlFile(resolved);

// eslint-disable-next-line no-console
console.log(JSON.stringify({ file: filePath, events: events.length, errors }, null, 2));

if (failOnErrors && errors.length) process.exit(2);

