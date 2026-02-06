#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function runEmitter(json) {
  return spawnSync(
    process.execPath,
    ["scripts/verifier/emit-verify.mjs", "verify.passed", "--json", json, "--dry-run"],
    { encoding: "utf8" },
  );
}

function assertQualityShape(payload) {
  const quality = payload?.quality;

  for (const key of [
    "tests",
    "coverage",
    "lint",
    "audit",
    "mutation",
    "complexity",
  ]) {
    assert.ok(quality && key in quality, `smoke: missing quality.${key}`);
  }

  assert.equal(typeof quality.tests, "object");
  assert.ok("status" in quality.tests);
  assert.ok("command" in quality.tests);
}

function run() {
  const result = runEmitter(
    '{"quality":{"tests":{"status":"pass","command":"(smoke)"}}}',
  );

  assert.equal(result.status, 0, result.stderr || "smoke: emitter failed");

  const payload = JSON.parse(result.stdout);
  assertQualityShape(payload);

  const resultEmpty = runEmitter("{}");
  assert.equal(
    resultEmpty.status,
    0,
    resultEmpty.stderr || "smoke: emitter failed (empty payload)",
  );

  const payloadEmpty = JSON.parse(resultEmpty.stdout);
  assertQualityShape(payloadEmpty);
}

try {
  run();
  // eslint-disable-next-line no-console
  console.log("verifier smoke: ok");
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err?.message ?? String(err));
  process.exit(1);
}
