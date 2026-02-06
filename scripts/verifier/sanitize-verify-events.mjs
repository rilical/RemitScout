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
      "  node scripts/verifier/sanitize-verify-events.mjs [--file <events.jsonl>] [--all] [--repo]",
      "",
      "Behavior:",
      "  Rewrites verify.passed/verify.failed events in-place so payload always",
      "  contains quality.{tests,coverage,lint,audit,mutation,complexity}.",
      "  Drops malformed JSONL lines (best-effort; preserved to a temp file).",
      "",
      "Default events file:",
      "  - Uses .ralph/current-events if present",
      "  - Else falls back to .ralph/events.jsonl",
      "",
      "--repo:",
      "  Sanitizes every discovered .ralph directory under this repo (root + .worktrees/*).",
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

function getDefaultEventsFile(ralphDir) {
  try {
    const currentEventsPath = path.join(ralphDir, "current-events");
    if (fs.existsSync(currentEventsPath)) {
      const p = fs.readFileSync(currentEventsPath, "utf8").trim();
      if (p) return p;
    }
  } catch {
    // ignore
  }
  return path.join(ralphDir, "events.jsonl");
}

function listAllEventsFilesInDir(ralphDir) {
  const out = new Set();

  // 1) The active file (if configured)
  const current = getDefaultEventsFile(ralphDir);
  if (current) out.add(current);

  // 2) Conventional single-file log (if present)
  const fallback = path.join(ralphDir, "events.jsonl");
  if (fs.existsSync(fallback)) out.add(fallback);

  // 3) Rotated logs
  try {
    for (const name of fs.readdirSync(ralphDir)) {
      if (!/^events-.*\.jsonl$/.test(name)) continue;
      out.add(path.join(ralphDir, name));
    }
  } catch {
    // best-effort
  }

  return Array.from(out);
}

function listRepoRalphDirs() {
  const out = new Set();

  if (fs.existsSync(".ralph")) out.add(".ralph");

  const worktreesDir = ".worktrees";
  try {
    if (!fs.existsSync(worktreesDir)) return Array.from(out);

    for (const name of fs.readdirSync(worktreesDir)) {
      const candidate = path.join(worktreesDir, name, ".ralph");
      if (fs.existsSync(candidate)) out.add(candidate);
    }
  } catch {
    // best-effort
  }

  return Array.from(out);
}

function bootstrapRalphConfigForRepoWorktrees() {
  // Pragmatic self-heal: older/local worktrees can exist on branches that
  // predate the committed `ralph.yml`. If Ralph is run from such a worktree,
  // it falls back to built-in defaults and may auto-emit legacy `verify.*`
  // events with empty/string payloads (missing `quality.*`).
  //
  // When running `--repo`, we opportunistically copy the repo-root config into
  // any discovered worktree that has a `.ralph/` dir but is missing `ralph.yml`.
  // This is intentionally best-effort and only fills missing files (never
  // overwrites).
  const sourceRalphYml = "ralph.yml";
  const sourceRalphExampleYml = "ralph.example.yml";

  if (!fs.existsSync(sourceRalphYml)) return;

  const worktreesDir = ".worktrees";
  if (!fs.existsSync(worktreesDir)) return;

  try {
    for (const name of fs.readdirSync(worktreesDir)) {
      const worktreeRoot = path.join(worktreesDir, name);
      const ralphDir = path.join(worktreeRoot, ".ralph");
      if (!fs.existsSync(ralphDir)) continue;

      const targetRalphYml = path.join(worktreeRoot, "ralph.yml");
      if (!fs.existsSync(targetRalphYml)) {
        try {
          fs.copyFileSync(sourceRalphYml, targetRalphYml);
        } catch {
          // best-effort
        }
      }

      const targetRalphExampleYml = path.join(worktreeRoot, "ralph.example.yml");
      if (fs.existsSync(sourceRalphExampleYml) && !fs.existsSync(targetRalphExampleYml)) {
        try {
          fs.copyFileSync(sourceRalphExampleYml, targetRalphExampleYml);
        } catch {
          // best-effort
        }
      }
    }
  } catch {
    // best-effort
  }
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
  const repo = args.includes("--repo");

  if (fileArg && all) {
    // eslint-disable-next-line no-console
    console.error("Use either --file or --all (not both). ");
    process.exit(2);
  }

  if (repo && fileArg) {
    // eslint-disable-next-line no-console
    console.error("Use either --repo or --file (not both). ");
    process.exit(2);
  }

  if (repo && !all) {
    // eslint-disable-next-line no-console
    console.error("--repo requires --all (to avoid surprising partial sanitization).");
    process.exit(2);
  }

  let files;
  if (repo) {
    bootstrapRalphConfigForRepoWorktrees();

    const allFiles = [];
    for (const dir of listRepoRalphDirs()) {
      allFiles.push(...listAllEventsFilesInDir(dir));
    }
    files = Array.from(new Set(allFiles));
  } else {
    const ralphDir = ".ralph";
    files = fileArg
      ? [fileArg]
      : all
        ? listAllEventsFilesInDir(ralphDir)
        : [getDefaultEventsFile(ralphDir)];
  }

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
