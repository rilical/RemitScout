#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";
import { spawnSync } from "node:child_process";

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
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  if (idx + 1 >= args.length) usageAndExit(2);
  return args[idx + 1];
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function normalizeVerifyPayload(input) {
  const safeInput =
    input && typeof input === "object" && !Array.isArray(input) ? input : {};

  const safeInnerPayload =
    safeInput.payload &&
    typeof safeInput.payload === "object" &&
    !Array.isArray(safeInput.payload)
      ? safeInput.payload
      : null;

  const taskIdFromValue = (value) =>
    typeof value === "string" && value.trim() !== "" ? value.trim() : null;

  const taskId =
    taskIdFromValue(safeInput.taskId) ??
    taskIdFromValue(safeInput.task_id) ??
    taskIdFromValue(safeInnerPayload?.taskId) ??
    taskIdFromValue(safeInnerPayload?.task_id) ??
    null;

  const nodeVersion =
    safeInput.node ??
    process.version.replace(/^v/, "");

  const plainObjectOrNull = (value) =>
    value && typeof value === "object" && !Array.isArray(value) ? value : null;

  const inputQuality =
    plainObjectOrNull(safeInput.quality) ??
    plainObjectOrNull(safeInnerPayload?.quality) ??
    plainObjectOrNull(safeInput.qualityReport) ??
    plainObjectOrNull(safeInput.quality_report) ??
    {};

  const normalizeObject = (value, defaults) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
    return { ...defaults, ...value };
  };

  const normalizeCount = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "") {
        const n = Number(trimmed);
        if (Number.isFinite(n)) return n;
      }
    }
    return 0;
  };

  const tests = normalizeObject(inputQuality.tests, {
    status: "n/a",
    command: "n/a",
  });

  const lintBase = normalizeObject(inputQuality.lint, {
    status: "n/a",
    command: "n/a",
    errors: 0,
    warnings: 0,
  });
  const lint = {
    ...lintBase,
    errors: normalizeCount(lintBase.errors),
    warnings: normalizeCount(lintBase.warnings),
  };

  const coverage = normalizeObject(inputQuality.coverage, {
    status: "n/a",
    tool: "n/a",
  });

  const audit = normalizeObject(inputQuality.audit, {
    status: "n/a",
    command: "n/a",
  });

  const mutation = normalizeObject(inputQuality.mutation, {
    status: "n/a",
    tool: "n/a",
  });

  const complexity = normalizeObject(inputQuality.complexity, {
    status: "n/a",
    tool: "n/a",
  });

  const normalized = {
    ...safeInput,
    node: nodeVersion,
    ...(taskId ? { taskId, task_id: taskId } : {}),
    quality: {
      ...inputQuality,
      tests,
      coverage,
      lint,
      audit,
      mutation,
      complexity,
    },
  };

  // Backwards/forwards compatibility for workflow consumers that expect
  // different nesting or field naming.
  if (taskId) {
    const innerPayload = plainObjectOrNull(normalized.payload) ?? {};
    normalized.payload = { ...innerPayload, taskId, task_id: taskId };
  }

  // Some consumers look for quality under alternative keys.
  normalized.qualityReport = normalized.quality;
  normalized.quality_report = normalized.quality;
  {
    const innerPayload = plainObjectOrNull(normalized.payload) ?? {};
    normalized.payload = { ...innerPayload, quality: normalized.quality };
  }

  return normalized;
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

  if (!jsonArg && !fileArg) usageAndExit(2);
  if (jsonArg && fileArg) usageAndExit(2);

  let input;
  try {
    const raw = fileArg ? fs.readFileSync(fileArg, "utf8") : jsonArg;
    input = JSON.parse(raw);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to parse JSON: ${err?.message ?? String(err)}`);
    process.exit(2);
  }

  const payload = normalizeVerifyPayload(input);
  const payloadStr = JSON.stringify(payload);

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log(payloadStr);
    return;
  }

  const result = spawnSync("ralph", ["emit", topic, "--json", payloadStr], {
    stdio: "inherit",
  });

  if (result.error) {
    // eslint-disable-next-line no-console
    console.error(result.error);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

main();
