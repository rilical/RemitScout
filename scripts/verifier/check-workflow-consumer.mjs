#!/usr/bin/env node
import {
  extractVerifyQualityReport,
  extractVerifyTaskId,
  hasRequiredQualityKeys,
} from "./verify-consumer.mjs";

import {
  selectLatestVerifyPassedForTask,
  validateVerifyPassedHasQuality,
} from "./workflow-matcher.mjs";

function fail(message) {
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(1);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assert(condition, label) {
  if (!condition) fail(label);
}

const quality = {
  tests: { status: "pass" },
  coverage: { status: "n/a" },
  lint: { status: "pass" },
  audit: { status: "n/a" },
  mutation: { status: "n/a" },
  complexity: { status: "n/a" },
};

const requiredTaskId = "task-123";

const variants = [
  {
    label: "taskId + quality at payload root",
    event: { topic: "verify.passed", payload: { taskId: requiredTaskId, quality } },
  },
  {
    label: "task_id + qualityReport at payload root",
    event: {
      topic: "verify.passed",
      payload: { task_id: requiredTaskId, qualityReport: quality },
    },
  },
  {
    label: "nested payload.payload.*",
    event: {
      topic: "verify.passed",
      payload: { payload: { taskId: requiredTaskId, quality_report: quality } },
    },
  },
  {
    label: "top-level taskId (future proof)",
    event: { topic: "verify.passed", taskId: requiredTaskId, payload: { quality } },
  },
];

for (const { label, event } of variants) {
  const taskId = extractVerifyTaskId(event);
  assertEqual(taskId, requiredTaskId, `${label}: task id extraction`);

  const report = extractVerifyQualityReport(event);
  assert(report, `${label}: quality report extraction returned null`);
  assert(hasRequiredQualityKeys(report), `${label}: required quality keys missing`);
}

// Selection behavior: prefer the latest verify.passed *after* latest routing
// signal for the same task.
{
  const events = [
    {
      topic: "verify.passed",
      ts: "2026-02-06T10:00:00.000Z",
      payload: { taskId: requiredTaskId, quality },
    },
    {
      topic: "refactor.task",
      ts: "2026-02-06T11:00:00.000Z",
      payload: { taskId: requiredTaskId },
    },
    {
      topic: "verify.passed",
      ts: "2026-02-06T11:30:00.000Z",
      payload: { task_id: requiredTaskId, qualityReport: quality },
    },
  ];

  const selected = selectLatestVerifyPassedForTask(events, requiredTaskId);
  assert(selected, "selection: expected a verify.passed event");
  assertEqual(
    selected.ts,
    "2026-02-06T11:30:00.000Z",
    "selection: picked latest post-routing verify.passed",
  );
  const validation = validateVerifyPassedHasQuality(selected);
  assert(validation.ok, `selection: expected valid quality, got ${validation.reason}`);
}

// eslint-disable-next-line no-console
console.log("workflow consumer contract: pass");
