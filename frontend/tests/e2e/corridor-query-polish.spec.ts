import { expect, test, type Page } from '@playwright/test';

const corridorPath = '/send-money/united-states-to-philippines';

async function waitForCorridorQueryReady(page: Page) {
  await expect(page.getByTestId('corridor-query-surface')).toHaveAttribute('data-ready', 'true', {
    timeout: 20000,
  });
}

async function selectCountry(
  page: Page,
  inputId: string,
  searchValue: string,
  optionLabel: RegExp
) {
  const input = page.locator(`#${inputId}`);
  await input.click();
  await input.fill(searchValue);
  await page.waitForTimeout(150);

  const option = page.getByRole('option', { name: optionLabel }).first();
  const optionCount = await option.count();

  if (optionCount > 0) {
    await option.click({ force: true });
  } else {
    await input.press('Enter');
  }

  await expect(input).toHaveValue(new RegExp(searchValue, 'i'));
}

test.describe('Corridor query polish', () => {
  test('editing the corridor from the sticky bar navigates to the new route', async ({ page }) => {
    await page.goto(corridorPath);
    await waitForCorridorQueryReady(page);
    await expect(page.getByTestId('corridor-query-compare-button')).toBeVisible({ timeout: 20000 });

    await selectCountry(page, 'corridor-to-country', 'Mexico', /mexico/i);
    await page.getByTestId('corridor-query-compare-button').click();

    await expect(page).toHaveURL(/\/send-money\/united-states-to-mexico/);
    await expect(
      page.getByRole('heading', { name: /^send money from united states to mexico$/i })
    ).toBeVisible({ timeout: 20000 });
  });

  test('shows the refresh gate while the next corridor query is loading', async ({ page }) => {
    await page.route('**/api/providers**', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('from') === 'US' && url.searchParams.get('to') === 'MX') {
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
      await route.continue();
    });

    await page.goto(corridorPath);
    await waitForCorridorQueryReady(page);
    await selectCountry(page, 'corridor-to-country', 'Mexico', /mexico/i);
    await page.getByTestId('corridor-query-compare-button').click();

    await expect(page).toHaveURL(/\/send-money\/united-states-to-mexico/);
    const refreshGate = page.getByTestId('corridor-refresh-gate');
    await expect(refreshGate).toBeVisible({ timeout: 10000 });
    await expect(refreshGate).toContainText(/live sweep status/i);
    await expect(refreshGate).toContainText(/queued/i);
    await expect(refreshGate).toContainText(/in flight/i);
    await expect(refreshGate).toContainText(/ready/i);
    await expect(
      page.getByRole('heading', { name: /^compare\s+\d+\s+provider(s)?$/i })
    ).toBeVisible({ timeout: 20000 });
  });

  test('renders the unsupported corridor state with a direct message', async ({ page }) => {
    await page.route('**/api/providers**', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('from') === 'US' && url.searchParams.get('to') === 'MX') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'corridor_unsupported',
            message: 'Unsupported corridor',
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto(corridorPath);
    await waitForCorridorQueryReady(page);
    await selectCountry(page, 'corridor-to-country', 'Mexico', /mexico/i);
    await page.getByTestId('corridor-query-compare-button').click();

    await expect(page).toHaveURL(/\/send-money\/united-states-to-mexico/);
    await expect(page.getByTestId('corridor-unsupported-state')).toContainText(
      /not currently supported/i,
      { timeout: 20000 }
    );
  });

  test('renders the no-live-quotes state when the API returns no provider rows', async ({
    page,
  }) => {
    await page.route('**/api/providers**', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('from') === 'US' && url.searchParams.get('to') === 'MX') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            updatedAt: '2026-03-05T12:00:00.000Z',
            availableMethods: [],
            supportedMethods: ['bank'],
            availableMethodsByProvider: {},
            supportedMethodsByProvider: {},
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto(corridorPath);
    await waitForCorridorQueryReady(page);
    await selectCountry(page, 'corridor-to-country', 'Mexico', /mexico/i);
    await page.getByTestId('corridor-query-compare-button').click();

    await expect(page).toHaveURL(/\/send-money\/united-states-to-mexico/);
    await expect(page.getByTestId('corridor-no-live-quotes-state')).toContainText(
      /No fresh quotes just yet/i,
      { timeout: 20000 }
    );
  });
});
