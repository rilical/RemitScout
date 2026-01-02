const url = process.env.BRONZE_TEST_URL;
const method = process.env.BRONZE_TEST_METHOD || "GET";
const expectedRaw = process.env.BRONZE_EXPECT_STATUS || "403";
const timeoutRaw = process.env.BRONZE_TEST_TIMEOUT_MS;
const timeoutMs = Number.parseInt(timeoutRaw || "10000", 10);
const resolvedTimeoutMs = Number.isFinite(timeoutMs) ? timeoutMs : 10000;
const requireTest =
  process.env.BRONZE_REQUIRE_TEST === "1" ||
  process.env.CI === "1" ||
  process.env.CI === "true";

if (!url) {
  const message = "Guardrail test skipped: set BRONZE_TEST_URL to run.";
  if (requireTest) {
    console.error(`Guardrail failed: ${message}`);
    process.exit(1);
  }
  console.log(message);
  process.exit(0);
}

const expectedStatuses = expectedRaw
  .split(",")
  .map((value) => Number.parseInt(value.trim(), 10))
  .filter((value) => Number.isFinite(value));

if (expectedStatuses.length === 0) {
  console.error("No valid BRONZE_EXPECT_STATUS values provided.");
  process.exit(1);
}

const run = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), resolvedTimeoutMs);

  try {
    const response = await fetch(url, { method, signal: controller.signal });
    if (expectedStatuses.includes(response.status)) {
      console.log(
        `Guardrail ok: access denied as expected (status ${response.status}).`
      );
      process.exit(0);
    }

    console.error(
      `Guardrail failed: expected ${expectedStatuses.join(", ")}, got ${response.status}.`
    );
    process.exit(1);
  } catch (error) {
    if (error && error.name === "AbortError") {
      console.error(`Guardrail failed: request timeout after ${resolvedTimeoutMs}ms.`);
      process.exit(1);
    }
    console.error("Guardrail failed: request error", error);
    process.exit(1);
  } finally {
    clearTimeout(timeout);
  }
};

run();
