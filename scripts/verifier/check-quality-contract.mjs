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
  }

  if (!inVerifier) return;

  // Ralph merges config with built-in defaults. The built-in verifier hat sets
  // `default_publishes: verify.passed`, which can auto-emit an empty payload.
  // We require explicitly overriding it with an empty string.
  // (Ralph's config schema expects a string here; an empty list like `[]` is a
  // YAML type error and won't parse.)
  if (defaultPublishesValue === null) {
    fail(
      `${filePath}: hats.verifier.default_publishes is missing; set it to "" to disable builtin defaults`,
    );
  }

  const trimmed = defaultPublishesValue.trim();
  const disabled = trimmed === '""' || trimmed === "''";
  if (!disabled) {
    fail(
      `${filePath}: hats.verifier.default_publishes must be "" (got ${JSON.stringify(trimmed)}; Ralph requires a string here)`,
    );
  }
}

function main() {
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

  assertVerifierDoesNotDefaultPublish("ralph.yml");
  assertVerifierDoesNotDefaultPublish("ralph.example.yml");

  // eslint-disable-next-line no-console
  console.log("verifier contract check ok");
}

main();
