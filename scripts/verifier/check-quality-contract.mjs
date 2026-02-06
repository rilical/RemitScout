#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const EXPECTED_SIGNALS = [
  "tests",
  "coverage",
  "lint",
  "audit",
  "mutation",
  "complexity",
];

function fail(message) {
  // eslint-disable-next-line no-console
  console.error(`verifier contract check failed: ${message}`);
  process.exit(1);
}

function assertFilePresent(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(
      `${filePath} is missing. This repo relies on a committed ralph.yml to avoid Ralph falling back to built-in defaults (which can auto-emit verify.* without quality.*).`,
    );
  }
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function runEmitVerify(topic, json) {
  const result = spawnSync(
    process.execPath,
    ["scripts/verifier/emit-verify.mjs", topic, "--json", json, "--dry-run"],
    { encoding: "utf8" },
  );

  if (result.status !== 0) {
    fail(
      `emit-verify exited ${result.status}. stderr=${JSON.stringify(
        result.stderr ?? "",
      )}`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    fail(`emit-verify output was not JSON. stdout=${JSON.stringify(result.stdout)}`);
  }
  return parsed;
}

function assertQualityShape(payload, label) {
  if (!isPlainObject(payload)) fail(`${label}: payload is not an object`);

  if (!isPlainObject(payload.quality)) {
    fail(`${label}: payload.quality missing or not an object`);
  }

  for (const signal of EXPECTED_SIGNALS) {
    const value = payload.quality[signal];
    if (!isPlainObject(value)) {
      fail(`${label}: quality.${signal} missing or not an object`);
    }
    if (typeof value.status !== "string" || value.status.trim() === "") {
      fail(`${label}: quality.${signal}.status missing or not a string`);
    }
  }

  const lint = payload.quality.lint;
  if (!Number.isFinite(lint.errors)) fail(`${label}: quality.lint.errors not a number`);
  if (!Number.isFinite(lint.warnings))
    fail(`${label}: quality.lint.warnings not a number`);
}

function* walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === ".ralph" ||
        entry.name === "docs" ||
        entry.name === "agents" ||
        entry.name === "cdk.out"
      ) {
        continue;
      }
      yield* walkFiles(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

function assertNoDirectVerifyEmits() {
  // Enforce the "single choke-point" rule in practice.
  // This intentionally ignores docs/ and ralph*.yml, which may mention the rule.
  const roots = [
    ".github",
    "backend",
    "infrastructure",
    "scripts",
    "tools",
  ].filter((p) => fs.existsSync(p));

  const needle1 = "ralph emit verify.passed";
  const needle2 = "ralph emit verify.failed";

  for (const root of roots) {
    for (const filePath of walkFiles(root)) {
      if (filePath === path.join("scripts", "verifier", "check-quality-contract.mjs")) {
        continue;
      }

      const ext = path.extname(filePath).toLowerCase();
      if (!ext || ext === ".png" || ext === ".jpg" || ext === ".pdf") continue;

      let text;
      try {
        text = fs.readFileSync(filePath, "utf8");
      } catch {
        continue;
      }

      if (text.includes(needle1) || text.includes(needle2)) {
        fail(`direct verify emit found in ${filePath}`);
      }
    }
  }
}

function assertVerifierDoesNotDefaultPublish(filePath) {
  if (!fs.existsSync(filePath)) return;

  let text;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch {
    return;
  }

  const lines = text.split(/\r?\n/);
  const hatsIdx = lines.findIndex((line) => /^hats:\s*$/.test(line));
  if (hatsIdx === -1) return;

  let inVerifier = false;
  let verifierIndent = "";
  let defaultPublishesValue = null;
  let publishesValue = null;

  for (let i = hatsIdx + 1; i < lines.length; i += 1) {
    const line = lines[i];

    if (!inVerifier) {
      const match = line.match(/^(\s*)verifier:\s*$/);
      if (match) {
        inVerifier = true;
        verifierIndent = match[1] ?? "";
      }
      continue;
    }

    // Exit when we hit the next hat key at the same indentation.
    const nextHatRe = new RegExp(`^${verifierIndent}(?!verifier:)[A-Za-z0-9_-]+:\\s*$`);
    if (nextHatRe.test(line)) break;

    const dpMatch = line.match(/^\s*default_publishes:\s*(.*)\s*$/);
    if (dpMatch) {
      defaultPublishesValue = (dpMatch[1] ?? "").trim();
    }

    const publishesMatch = line.match(/^\s*publishes:\s*(.*)\s*$/);
    if (publishesMatch) {
      publishesValue = (publishesMatch[1] ?? "").trim();

      // Multiline YAML list support:
      // publishes:
      //   - verify.passed
      //   - verifier.noop
      if (publishesValue === "") {
        const items = [];
        for (let j = i + 1; j < lines.length; j += 1) {
          const nextLine = lines[j];
          if (!nextLine.startsWith(`${verifierIndent}  `)) break;
          const itemMatch = nextLine.match(/^\s*-\s*(.*?)\s*$/);
          if (!itemMatch) break;
          items.push((itemMatch[1] ?? "").trim());
          i = j;
        }
        publishesValue = `[${items.join(", ")}]`;
      }
    }
  }

  if (!inVerifier) return;

  // Ralph merges config with built-in defaults. The built-in verifier hat sets
  // `default_publishes: verify.passed`, which can auto-emit an empty payload.
  //
  // Practical constraint: YAML `null` and "" can be treated as "unset" during
  // Ralph's internal merge/normalization, allowing the built-in default to
  // sneak back in. To make this robust, we force the default publish topic to a
  // NON-verify topic (`verifier.noop`). This guarantees no auto-emitted
  // `verify.*` event can ever lack `quality.*`.
  if (defaultPublishesValue === null) {
    fail(
      `${filePath}: hats.verifier.default_publishes is missing; set it to verifier.noop to override builtin defaults`,
    );
  }

  const trimmed = defaultPublishesValue.trim();
  const expected = "verifier.noop";
  const normalized = trimmed.replace(/^['"]|['"]$/g, "");
  if (normalized !== expected) {
    fail(
      `${filePath}: hats.verifier.default_publishes must be ${expected} (got ${JSON.stringify(trimmed)})`,
    );
  }

  if (publishesValue === null) {
    fail(
      `${filePath}: hats.verifier.publishes is missing; it must include verifier.noop so the default publish topic is valid`,
    );
  }

  const publishesNormalized = publishesValue
    .replace(/#.*/, "")
    .replace(/[\[\]]/g, " ")
    .split(",")
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

  if (!publishesNormalized.includes(expected)) {
    fail(
      `${filePath}: hats.verifier.publishes must include ${expected} (got ${JSON.stringify(publishesValue)})`,
    );
  }
}

function assertNoVerifyDefaultPublishes(filePath) {
  if (!fs.existsSync(filePath)) return;

  let text;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch {
    return;
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trimEnd();
    if (/^default_publishes:\s*['"]?verify\.(passed|failed)['"]?\s*$/.test(line)) {
      fail(
        `${filePath}: default_publishes must never be verify.* (it can auto-emit an empty payload missing quality.*)`,
      );
    }
  }
}

function main() {
  // Determinism: ralph defaults to `-c ralph.yml`. If it is missing, Ralph will
  // fall back to built-in presets (including verifier defaults that can emit an
  // empty verify.* payload).
  assertFilePresent("ralph.yml");
  assertFilePresent("ralph.example.yml");

  const passedEmpty = runEmitVerify("verify.passed", "{}");
  assertQualityShape(passedEmpty, "verify.passed:{}");

  const failedEmpty = runEmitVerify("verify.failed", "{}");
  assertQualityShape(failedEmpty, "verify.failed:{}");

  const weird = runEmitVerify(
    "verify.passed",
    JSON.stringify({ quality: { lint: { errors: "3", warnings: "2" } } }),
  );
  assertQualityShape(weird, "verify.passed:lint coercion");

  assertNoDirectVerifyEmits();

  assertNoVerifyDefaultPublishes("ralph.yml");
  assertNoVerifyDefaultPublishes("ralph.example.yml");

  assertVerifierDoesNotDefaultPublish("ralph.yml");
  assertVerifierDoesNotDefaultPublish("ralph.example.yml");

  // eslint-disable-next-line no-console
  console.log("verifier contract check ok");
}

main();
