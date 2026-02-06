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
      "  node scripts/verifier/sanitize-verify-events.mjs [--file <events.jsonl>] [--all]",
      "",
      "Behavior:",
      "  Rewrites verify.passed/verify.failed events in-place so payload always",
      "  contains quality.{tests,coverage,lint,audit,mutation,complexity}.",
      "  Drops malformed JSONL lines (best-effort; preserved to a temp file).",
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

function listAllEventsFiles() {
  const dir = ".ralph";
  const out = new Set();

  // 1) The active file (if configured)
  const current = getDefaultEventsFile();
  if (current) out.add(current);

  // 2) Conventional single-file log (if present)
  const fallback = path.join(dir, "events.jsonl");
  if (fs.existsSync(fallback)) out.add(fallback);

  // 3) Rotated logs
  try {
    for (const name of fs.readdirSync(dir)) {
      if (!/^events-.*\.jsonl$/.test(name)) continue;
      out.add(path.join(dir, name));
    }
  } catch {
    // best-effort
  }

  return Array.from(out);
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

function sanitizeFile(filePath, dropped) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const outLines = [];

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    const trimmed = line.trim();
    if (!trimmed) continue;

    let evt;
    try {
      evt = JSON.parse(trimmed);
    } catch {
      dropped.push({ file: filePath, line: idx + 1, raw: trimmed });
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

function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) usageAndExit(0);

  const fileArg = getArgValue(args, "--file");
  const all = args.includes("--all");

  if (fileArg && all) {
    // eslint-disable-next-line no-console
    console.error("Use either --file or --all (not both). ");
    process.exit(2);
  }

  const files = fileArg ? [fileArg] : all ? listAllEventsFiles() : [getDefaultEventsFile()];

  const dropped = [];
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    sanitizeFile(filePath, dropped);
  }

  if (dropped.length > 0) {
    const outDir = ".ralph/temp";
    try {
      fs.mkdirSync(outDir, { recursive: true });
      const droppedPath = path.join(
        outDir,
        `sanitize-dropped-events-${Date.now()}-${Math.random().toString(16).slice(2)}.jsonl`,
      );
      const droppedLines = dropped.map((d) => JSON.stringify(d)).join("\n");
      fs.writeFileSync(droppedPath, `${droppedLines}\n`, "utf8");
    } catch {
      // best-effort
    }
  }
}

main();
