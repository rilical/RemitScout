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
      "  Missing signals are filled with 'n/a' to keep the schema stable.",
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
  const nodeVersion =
    input?.node ??
    process.version.replace(/^v/, "");

  const inputQuality =
    typeof input?.quality === "object" && input.quality !== null
      ? input.quality
      : {};

  const normalizeSignalObject = (value, defaults) => {
    if (value === undefined || value === null) {
      return { ...defaults, status: defaults.status ?? "n/a" };
    }

    if (typeof value === "string") {
      return { ...defaults, status: value };
    }

    if (typeof value === "object") {
      return {
        ...defaults,
        ...value,
        status:
          typeof value.status === "string"
            ? value.status
            : (defaults.status ?? "n/a"),
      };
    }

    return { ...defaults, status: defaults.status ?? "n/a" };
  };

  const tests =
    typeof inputQuality.tests === "object" && inputQuality.tests !== null
      ? {
          status: inputQuality.tests.status ?? "n/a",
          command: inputQuality.tests.command ?? "n/a",
        }
      : { status: "n/a", command: "n/a" };

  const lint =
    typeof inputQuality.lint === "object" && inputQuality.lint !== null
      ? {
          status: inputQuality.lint.status ?? "n/a",
          command: inputQuality.lint.command ?? "n/a",
          errors:
            typeof inputQuality.lint.errors === "number"
              ? inputQuality.lint.errors
              : 0,
          warnings:
            typeof inputQuality.lint.warnings === "number"
              ? inputQuality.lint.warnings
              : 0,
        }
      : { status: "n/a", command: "n/a", errors: 0, warnings: 0 };

  const coverage = normalizeSignalObject(inputQuality.coverage, {
    status: "n/a",
    tool: "n/a",
    command: "n/a",
  });

  const audit = normalizeSignalObject(inputQuality.audit, {
    status: "n/a",
    command: "n/a",
  });

  const mutation = normalizeSignalObject(inputQuality.mutation, {
    status: "n/a",
    tool: "n/a",
    command: "n/a",
  });

  const complexity = normalizeSignalObject(inputQuality.complexity, {
    status: "n/a",
    tool: "n/a",
    command: "n/a",
  });

  const normalized = {
    ...input,
    node: nodeVersion,
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

  if (jsonArg && fileArg) usageAndExit(2);

  let input;
  if (!jsonArg && !fileArg) {
    input = {};
  } else {
    try {
      const raw = fileArg ? fs.readFileSync(fileArg, "utf8") : jsonArg;
      input = JSON.parse(raw);
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
