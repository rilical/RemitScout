#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { normalizeVerifyPayload } from "./normalize-verify-payload.mjs";

function usageAndExit(code) {
  // eslint-disable-next-line no-console
  console.error(
    [
      "Usage:",
      "  node scripts/verifier/emit-verify.mjs <verify.passed|verify.failed> --json '<json>' [--dry-run]",
      "  node scripts/verifier/emit-verify.mjs <verify.passed|verify.failed> --file <path.json> [--dry-run]",
      "",
      "Behavior:",
      "  Normalizes payload to always include quality.{tests,coverage,lint,audit,mutation,complexity}.",
      "  Missing signals are filled with {status:'n/a', ...} to keep the schema stable.",
    ].join("\n"),
  );
  process.exit(code);
}

function getArgValue(args, flag) {
  // Prefer the last occurrence so wrapper scripts can provide defaults that
  // callers override explicitly.
  const idx = args.lastIndexOf(flag);
  if (idx === -1) return null;
  if (idx + 1 >= args.length) usageAndExit(2);
  return args[idx + 1];
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function findRepoRoot(startDir = process.cwd()) {
  // Ralph defaults to looking for `ralph.yml` in the current working directory.
  // That is fragile when this script is invoked from nested folders (e.g.
  // `frontend/`).
  //
  // Pragmatic rule:
  // - Prefer the *git* root if available.
  // - Fall back to the nearest folder that has `ralph.yml`.
  //
  // This prevents nested `ralph.yml` files (e.g. `frontend/ralph.yml`) from
  // hijacking the "repo root" used for emitting events.
  let dir = path.resolve(startDir);
  let ralphCandidate = null;

  for (let i = 0; i < 50; i += 1) {
    if (fs.existsSync(path.join(dir, ".git"))) {
      return dir;
    }

    if (!ralphCandidate && fs.existsSync(path.join(dir, "ralph.yml"))) {
      ralphCandidate = dir;
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return ralphCandidate ?? path.resolve(startDir);
}

function ensureObjectAtPath(root, path) {
  let cursor = root;
  for (const segment of path) {
    if (typeof cursor[segment] !== "object" || cursor[segment] === null) {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  }
  return cursor;
}

function setNestedValue(root, path, value) {
  if (path.length === 0) return;
  const parent = ensureObjectAtPath(root, path.slice(0, -1));
  parent[path[path.length - 1]] = value;
}

function repairDottedQualityKeys(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return input;
  }

  for (const [key, value] of Object.entries(input)) {
    if (!key.startsWith("quality.")) continue;

    // Example drift patterns we've seen:
    // - { "quality.tests": { ... } }
    // - { "quality.tests.status": "pass" }
    const path = key.split(".");
    setNestedValue(input, path, value);
    delete input[key];
  }

  return input;
}

function main() {
  const args = process.argv.slice(2);
  const topic = args[0];
  if (!topic) usageAndExit(2);

  if (topic !== "verify.passed" && topic !== "verify.failed") {
    // eslint-disable-next-line no-console
    console.error(`Invalid topic: ${topic}`);
    usageAndExit(2);
  }

  const jsonArg = getArgValue(args, "--json");
  const fileArg = getArgValue(args, "--file");
  const dryRun = hasFlag(args, "--dry-run");

  if (jsonArg && fileArg) usageAndExit(2);

  let input;
  if (!jsonArg && !fileArg) {
    input = {};
  } else {
    try {
      const raw = fileArg ? fs.readFileSync(fileArg, "utf8") : jsonArg;
      const parsed = JSON.parse(raw);
      input =
        typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
          ? parsed
          : { value: parsed };
    } catch (err) {
      // Pragmatic drift guard: if the verifier passes a non-JSON string by
      // mistake, still emit a schema-stable payload rather than failing and
      // tempting a fallback to `ralph emit verify.*` directly.
      input = {
        message: "non-json input passed to emit-verify.mjs",
        raw: jsonArg ?? "",
        parse_error: err?.message ?? String(err),
      };
    }
  }

  input = repairDottedQualityKeys(input);

  const payload = normalizeVerifyPayload(input);
  const payloadStr = JSON.stringify(payload);

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log(payloadStr);
    return;
  }

  const repoRoot = findRepoRoot();
  const configPath = path.join(repoRoot, "ralph.yml");
  const ralphArgs = fs.existsSync(configPath)
    ? ["-c", configPath, "emit", topic, "--json", payloadStr]
    : ["emit", topic, "--json", payloadStr];

  const result = spawnSync("ralph", ralphArgs, {
    stdio: "inherit",
    cwd: repoRoot,
  });

  if (result.error) {
    // eslint-disable-next-line no-console
    console.error(result.error);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

main();
