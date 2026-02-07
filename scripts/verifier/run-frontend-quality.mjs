#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? String(result.error) : null,
  };
}

function statusFromExitCode(exitCode) {
  return exitCode === 0 ? "pass" : "fail";
}

function summarizeLintJson(rawJson) {
  const parsed = JSON.parse(rawJson);
  if (!Array.isArray(parsed)) return { errors: 0, warnings: 0 };

  let errors = 0;
  let warnings = 0;
  for (const file of parsed) {
    if (!file || typeof file !== "object") continue;
    errors += Number(file.errorCount ?? 0) || 0;
    warnings += Number(file.warningCount ?? 0) || 0;
  }
  return { errors, warnings };
}

function parseArgs(args) {
  const emitIdx = args.indexOf("--emit");
  const emitTopic =
    emitIdx === -1
      ? null
      : emitIdx + 1 < args.length
        ? args[emitIdx + 1]
        : null;

  const taskIdIdx = args.indexOf("--task-id");
  const taskId =
    taskIdIdx === -1
      ? null
      : taskIdIdx + 1 < args.length
        ? args[taskIdIdx + 1]
        : null;

  if (taskIdIdx !== -1 && (!taskId || taskId.startsWith("--"))) {
    // Missing value (or next token is another flag).
    // eslint-disable-next-line no-console
    console.error("Missing value for --task-id <id>");
    process.exit(2);
  }

  return {
    runUnitTests: args.includes("--run-unit-tests"),
    full: args.includes("--full"),
    dryRun: args.includes("--dry-run"),
    emitTopic,
    taskId,
  };
}

function emitVerify({ topic, json, dryRun }) {
  const args = ["scripts/verifier/emit-verify.mjs", topic, "--json", json];
  if (dryRun) args.push("--dry-run");

  const result = run(process.execPath, args);
  if (result.exitCode !== 0) {
    throw new Error(
      `emit-verify failed (exit ${result.exitCode}): ${result.stderr || result.stdout}`,
    );
  }
  return result.stdout.trim();
}

function getChangedFiles() {
  const result = run("git", ["diff", "--name-only", "--diff-filter=ACMR", "HEAD~1..HEAD"]);
  if (result.exitCode !== 0) return [];
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getFrontendLintTargets({ full }) {
  if (full) return { targets: ["."], reason: null };

  const changed = getChangedFiles();
  const targets = changed
    .filter((filePath) => filePath.startsWith("frontend/"))
    .map((filePath) => filePath.slice("frontend/".length))
    .filter((filePath) => {
      // Avoid linting generated content or markdown.
      if (filePath.startsWith(".nuxt/")) return false;
      if (filePath.startsWith("dist/")) return false;
      if (filePath.endsWith(".md")) return false;
      return true;
    });

  if (targets.length === 0) {
    return { targets: [], reason: "no changed frontend files" };
  }

  return { targets, reason: null };
}

function main() {
  const { runUnitTests, full, emitTopic, dryRun, taskId } = parseArgs(
    process.argv.slice(2),
  );

  if (emitTopic && emitTopic !== "verify.passed" && emitTopic !== "verify.failed") {
    // eslint-disable-next-line no-console
    console.error(
      `Invalid --emit topic: ${emitTopic}. Expected verify.passed or verify.failed.`,
    );
    process.exit(2);
  }

  const lintTargets = getFrontendLintTargets({ full });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "remit-scout-verifier-"));
  const eslintOutFile = path.join(tmpDir, "eslint.json");

  const lintCommand =
    lintTargets.targets.length > 0
      ? `${PNPM} -C frontend exec eslint ${lintTargets.targets.join(" ")} -f json --output-file ${eslintOutFile}`
      : "n/a";

  const lintResult =
    lintTargets.targets.length > 0
      ? run(PNPM, [
          "-C",
          "frontend",
          "exec",
          "eslint",
          ...lintTargets.targets,
          "-f",
          "json",
          "--output-file",
          eslintOutFile,
        ])
      : { exitCode: 0, stdout: "", stderr: "", error: null };

  let lintCounts = { errors: 0, warnings: 0 };
  let lintCountsParsed = false;
  if (lintTargets.targets.length > 0) {
    try {
      const raw = fs.readFileSync(eslintOutFile, "utf8");
      lintCounts = summarizeLintJson(raw);
      lintCountsParsed = true;
    } catch {
      lintCounts = { errors: 0, warnings: 0 };
    }
  }

  const typecheckCommand = `${PNPM} -C frontend type-check`;
  const typecheckResult = lintTargets.targets.length > 0 || full
    ? run(PNPM, ["-C", "frontend", "type-check"])
    : { exitCode: 0, stdout: "", stderr: "", error: null };

  const unitTestCommand = `${PNPM} -C frontend test`;
  const unitTestResult = runUnitTests && (lintTargets.targets.length > 0 || full)
    ? run(PNPM, ["-C", "frontend", "test"])
    : { exitCode: 0, stdout: "", stderr: "", error: null };

  const testsExitCode =
    typecheckResult.exitCode === 0 && (runUnitTests ? unitTestResult.exitCode === 0 : true)
      ? 0
      : 1;

  // ESLint can exit non-zero due to max-warnings configuration.
  // For the verifier payload, treat warnings as non-blocking as long as
  // errorCount is 0 (but still report the warning count).
  const lintExitCode =
    lintCountsParsed && lintCounts.errors === 0
      ? 0
      : lintResult.exitCode;

  const payload = {
    scope: "frontend",
    ...(taskId ? { taskId } : {}),
    node: process.version.replace(/^v/, ""),
    quality: {
      tests: {
        status:
          lintTargets.targets.length === 0 && !full
            ? "n/a"
            : statusFromExitCode(testsExitCode),
        command:
          lintTargets.targets.length === 0 && !full
            ? "n/a"
            : runUnitTests
              ? `${typecheckCommand} && ${unitTestCommand}`
              : typecheckCommand,
        details: {
          typecheck: {
            status:
              lintTargets.targets.length === 0 && !full
                ? "n/a"
                : statusFromExitCode(typecheckResult.exitCode),
            command: typecheckCommand,
            exitCode:
              lintTargets.targets.length === 0 && !full
                ? null
                : typecheckResult.exitCode,
          },
          unit: {
            status:
              runUnitTests && (lintTargets.targets.length > 0 || full)
                ? statusFromExitCode(unitTestResult.exitCode)
                : "n/a",
            command: unitTestCommand,
            exitCode:
              runUnitTests && (lintTargets.targets.length > 0 || full)
                ? unitTestResult.exitCode
                : null,
            skipped: !(runUnitTests && (lintTargets.targets.length > 0 || full)),
          },
        },
      },
      lint: {
        status:
          lintTargets.targets.length === 0 && !full
            ? "n/a"
            : statusFromExitCode(lintExitCode),
        command: lintCommand,
        errors: lintCounts.errors,
        warnings: lintCounts.warnings,
      },
      coverage: { status: "n/a", tool: "n/a" },
      audit: { status: "n/a", command: "n/a" },
      mutation: { status: "n/a", tool: "n/a" },
      complexity: { status: "n/a", tool: "n/a" },
    },
  };

  const payloadJson = JSON.stringify(payload);

  const checksPassing =
    payload.quality.tests.status !== "fail" && payload.quality.lint.status !== "fail";

  if (emitTopic === "verify.passed" && !dryRun && !checksPassing) {
    // eslint-disable-next-line no-console
    console.error(
      "Refusing to emit verify.passed: one or more quality checks failed. Run with --emit verify.failed.",
    );
    process.exit(1);
  }

  if (emitTopic) {
    // Always normalize through the single choke-point, so quality.* keys are stable.
    const normalizedJson = emitVerify({
      topic: emitTopic,
      json: payloadJson,
      dryRun: true,
    });

    // eslint-disable-next-line no-console
    console.log(normalizedJson);

    if (!dryRun) {
      emitVerify({ topic: emitTopic, json: normalizedJson, dryRun: false });
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(payloadJson);
  }

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
}

main();
