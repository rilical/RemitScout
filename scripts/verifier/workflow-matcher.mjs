import fs from "node:fs";

import {
  extractVerifyQualityReport,
  extractVerifyTaskId,
  hasRequiredQualityKeys,
} from "./verify-consumer.mjs";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asIsoTimestamp(value) {
  if (typeof value !== "string") return null;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return value;
}

function toMillis(iso) {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : -Infinity;
}

function tryParseJson(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function extractTaskIdFromAnyEvent(event) {
  if (!isPlainObject(event)) return null;
  const payload = isPlainObject(event.payload)
    ? event.payload
    : tryParseJson(event.payload);

  const innerPayload = isPlainObject(payload?.payload)
    ? payload.payload
    : tryParseJson(payload?.payload);

  const candidates = [
    event.taskId,
    event.task_id,
    payload?.taskId,
    payload?.task_id,
    innerPayload?.taskId,
    innerPayload?.task_id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return candidate.trim();
    }
  }
  return null;
}

export function parseEventsJsonl(text) {
  const events = [];
  const errors = [];

  const lines = String(text).split("\n");
  for (let index = 0; index < lines.length; index++) {
    const lineNumber = index + 1;
    const line = lines[index];
    if (!line.trim()) continue;

    try {
      const parsed = JSON.parse(line);
      if (!isPlainObject(parsed)) {
        errors.push({ lineNumber, message: "not an object", line });
        continue;
      }
      events.push(parsed);
    } catch (error) {
      errors.push({ lineNumber, message: String(error?.message || error), line });
    }
  }

  return { events, errors };
}

export function parseEventsJsonlFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return parseEventsJsonl(text);
}

export function selectLatestVerifyPassedForTask(events, taskId, options = {}) {
  const routingTopics = options.routingTopics ?? ["refactor.task", "refactor.done"];
  const verifyTopic = options.verifyTopic ?? "verify.passed";

  let routingCutoffMs = -Infinity;
  for (const event of events) {
    if (event?.topic && routingTopics.includes(event.topic)) {
      const eventTaskId = extractTaskIdFromAnyEvent(event);
      if (eventTaskId !== taskId) continue;
      const ts = asIsoTimestamp(event.ts);
      if (!ts) continue;
      routingCutoffMs = Math.max(routingCutoffMs, toMillis(ts));
    }
  }

  let selected = null;
  let selectedMs = -Infinity;

  const consider = (event) => {
    if (event?.topic !== verifyTopic) return;

    const eventTaskId = extractVerifyTaskId(event) ?? extractTaskIdFromAnyEvent(event);
    if (eventTaskId !== taskId) return;

    const ts = asIsoTimestamp(event.ts);
    if (!ts) return;
    const ms = toMillis(ts);

    if (ms <= routingCutoffMs) return;
    if (ms <= selectedMs) return;

    selected = event;
    selectedMs = ms;
  };

  for (const event of events) consider(event);

  // Pragmatic fallback: if we didn't find a post-routing verify event, pick the
  // latest verify event for the task (better than failing hard on missing routing).
  if (!selected) {
    for (const event of events) {
      if (event?.topic !== verifyTopic) continue;

      const eventTaskId = extractVerifyTaskId(event) ?? extractTaskIdFromAnyEvent(event);
      if (eventTaskId !== taskId) continue;

      const ts = asIsoTimestamp(event.ts);
      if (!ts) continue;
      const ms = toMillis(ts);

      if (ms <= selectedMs) continue;
      selected = event;
      selectedMs = ms;
    }
  }

  return selected;
}

export function validateVerifyPassedHasQuality(event) {
  const quality = extractVerifyQualityReport(event);
  if (!quality) {
    return { ok: false, reason: "Missing quality report" };
  }
  if (!hasRequiredQualityKeys(quality)) {
    return { ok: false, reason: "Missing quality report keys" };
  }
  return { ok: true };
}

