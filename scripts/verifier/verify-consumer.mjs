function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return null;
}

export function extractVerifyTaskId(event) {
  const payload = isPlainObject(event?.payload) ? event.payload : null;
  const innerPayload = isPlainObject(payload?.payload) ? payload.payload : null;

  return (
    firstString(event?.taskId, event?.task_id) ??
    firstString(payload?.taskId, payload?.task_id) ??
    firstString(innerPayload?.taskId, innerPayload?.task_id)
  );
}

export function extractVerifyQualityReport(event) {
  const payload = isPlainObject(event?.payload) ? event.payload : null;
  const innerPayload = isPlainObject(payload?.payload) ? payload.payload : null;

  const candidates = [
    event?.quality,
    event?.qualityReport,
    event?.quality_report,
    payload?.quality,
    payload?.qualityReport,
    payload?.quality_report,
    innerPayload?.quality,
    innerPayload?.qualityReport,
    innerPayload?.quality_report,
  ];

  for (const candidate of candidates) {
    if (isPlainObject(candidate)) return candidate;
  }
  return null;
}

export function hasRequiredQualityKeys(quality) {
  if (!isPlainObject(quality)) return false;
  const required = [
    "tests",
    "coverage",
    "lint",
    "audit",
    "mutation",
    "complexity",
  ];
  return required.every((key) => key in quality);
}

