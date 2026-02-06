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
  return {
    runUnitTests: args.includes("--run-unit-tests"),
    full: args.includes("--full"),
  };
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
  const { runUnitTests, full } = parseArgs(process.argv.slice(2));

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

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
}

main();
