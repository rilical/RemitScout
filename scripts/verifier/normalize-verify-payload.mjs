import process from "node:process";

export function normalizeVerifyPayload(input) {
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

  const nodeVersion = safeInput.node ?? process.version.replace(/^v/, "");

  const inputQuality =
    safeInput.quality &&
    typeof safeInput.quality === "object" &&
    !Array.isArray(safeInput.quality)
      ? safeInput.quality
      : {};

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

  const quality = {
    ...inputQuality,
    tests,
    coverage,
    lint,
    audit,
    mutation,
    complexity,
  };

  return {
    ...safeInput,
    node: nodeVersion,
    ...(taskId ? { taskId, task_id: taskId } : {}),
    payload: {
      ...(safeInnerPayload ?? {}),
      ...(taskId ? { taskId, task_id: taskId } : {}),
      quality,
    },
    quality,
    qualityReport: quality,
    quality_report: quality,
  };
}
