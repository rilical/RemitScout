#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { normalizeVerifyPayload } from "./normalize-verify-payload.mjs";

function usageAndExit(code) {
  // eslint-disable-next-line no-console
  console.error(
    [
      "Usage:",
      "  node scripts/verifier/sanitize-verify-events.mjs [--file <events.jsonl>]",
      "",
      "Behavior:",
      "  Rewrites verify.passed/verify.failed events in-place so payload always",
      "  contains quality.{tests,coverage,lint,audit,mutation,complexity}.",
      "",
      "Default events file:",
      "  - Uses .ralph/current-events if present",
      "  - Else falls back to .ralph/events.jsonl",
    ].join("\n"),
  );
  process.exit(code);
}

function getArgValue(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  if (idx + 1 >= args.length) usageAndExit(2);
  return args[idx + 1];
}

function getDefaultEventsFile() {
  try {
    const currentEventsPath = ".ralph/current-events";
    if (fs.existsSync(currentEventsPath)) {
      const p = fs.readFileSync(currentEventsPath, "utf8").trim();
      if (p) return p;
    }
  } catch {
    // ignore
  }
  return ".ralph/events.jsonl";
}

function normalizeEventPayload(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return normalizeVerifyPayload(payload);
  }

  const message =
    typeof payload === "string"
      ? payload
      : payload === null || payload === undefined
        ? ""
        : String(payload);
  return normalizeVerifyPayload({ message });
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) usageAndExit(0);

  const filePath = getArgValue(args, "--file") ?? getDefaultEventsFile();

  if (!fs.existsSync(filePath)) {
    // eslint-disable-next-line no-console
    console.error(`Events file not found: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const outLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let evt;
    try {
      evt = JSON.parse(trimmed);
    } catch {
      outLines.push(trimmed);
      continue;
    }

    if (evt?.topic !== "verify.passed" && evt?.topic !== "verify.failed") {
      outLines.push(JSON.stringify(evt));
      continue;
    }

    const normalizedPayload = normalizeEventPayload(evt.payload);
    outLines.push(
      JSON.stringify({
        ...evt,
        payload: normalizedPayload,
      }),
    );
  }

  const tmpPath = path.join(
    os.tmpdir(),
    `remit-scout-sanitized-events-${Date.now()}-${Math.random().toString(16).slice(2)}.jsonl`,
  );
  fs.writeFileSync(tmpPath, `${outLines.join("\n")}\n`, "utf8");
  fs.renameSync(tmpPath, filePath);
}

main();

