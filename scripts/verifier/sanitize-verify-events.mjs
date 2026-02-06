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
      "  Sanitizes every discovered .ralph directory under this repo (including worktrees and nested folders).",
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

function findRepoRoot(startDir = process.cwd()) {
  // Ralph does not search upward for `ralph.yml` or `.git`.
  // The verifier scripts must be robust to being run from nested folders
  // (e.g. `frontend/`), so we locate the repo root explicitly.
  let dir = path.resolve(startDir);

  for (let i = 0; i < 50; i += 1) {
    if (
      fs.existsSync(path.join(dir, "ralph.yml")) ||
      fs.existsSync(path.join(dir, ".git"))
    ) {
      return dir;
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return path.resolve(startDir);
}

function listRepoRalphDirs(repoRoot) {
  const out = new Set();

  const ignore = new Set([
    ".git",
    "node_modules",
    "cdk.out",
    ".pnpm-store",
    ".nuxt",
    ".output",
    ".cursor",
    ".vscode",
    "dist",
    "coverage",
  ]);

  const stack = [repoRoot];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) break;

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (ignore.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.name === ".ralph") {
        out.add(fullPath);
        continue;
      }

      stack.push(fullPath);
    }
  }

  return Array.from(out);
}

function bootstrapRalphConfigForRepoDirs({ repoRoot, ralphDirs }) {
  // Pragmatic self-heal for worktrees:
  // - Older/local worktrees can exist on branches that predate the committed
  //   `ralph.yml`.
  // - If Ralph is run from such a worktree, it falls back to built-in defaults
  //   and may auto-emit legacy `verify.*` events missing `quality.*`.
  //
  // We intentionally DO NOT copy config into normal repo subfolders (e.g.
  // `frontend/`) because that would dirty the working tree with untracked files.
  // The verifier scripts themselves should remain CWD-robust (see emit-verify).
  const sourceRalphYml = path.join(repoRoot, "ralph.yml");
  const sourceRalphExampleYml = path.join(repoRoot, "ralph.example.yml");

  if (!fs.existsSync(sourceRalphYml)) return;

  for (const ralphDir of ralphDirs) {
    const workspaceRoot = path.dirname(ralphDir);

    const rel = path.relative(repoRoot, workspaceRoot);
    if (!(rel === ".worktrees" || rel.startsWith(`.worktrees${path.sep}`))) {
      continue;
    }

    const targetRalphYml = path.join(workspaceRoot, "ralph.yml");
    if (!fs.existsSync(targetRalphYml)) {
      try {
        fs.copyFileSync(sourceRalphYml, targetRalphYml);
      } catch {
        // best-effort
      }
    }

    const targetRalphExampleYml = path.join(workspaceRoot, "ralph.example.yml");
    if (fs.existsSync(sourceRalphExampleYml) && !fs.existsSync(targetRalphExampleYml)) {
      try {
        fs.copyFileSync(sourceRalphExampleYml, targetRalphExampleYml);
      } catch {
        // best-effort
      }
    }
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

  const repoRoot = repo ? findRepoRoot() : process.cwd();

  let files;
  if (repo) {
    const ralphDirs = listRepoRalphDirs(repoRoot);
    bootstrapRalphConfigForRepoDirs({ repoRoot, ralphDirs });

    const allFiles = [];
    for (const dir of ralphDirs) {
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
    const outDir = repo ? path.join(repoRoot, ".ralph", "temp") : ".ralph/temp";
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
