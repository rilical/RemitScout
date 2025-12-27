const url = process.env.BRONZE_TEST_URL;
const method = process.env.BRONZE_TEST_METHOD || "GET";
const expectedRaw = process.env.BRONZE_EXPECT_STATUS || "403";

if (!url) {
  console.log("Guardrail test skipped: set BRONZE_TEST_URL to run.");
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
  try {
    const response = await fetch(url, { method });
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
    console.error("Guardrail failed: request error", error);
    process.exit(1);
  }
};

run();
