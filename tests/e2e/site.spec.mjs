import { test, expect } from '@playwright/test';

const PRODUCT_NAME = 'Quaestor';
const ORG_URL = 'https://github.com/quaestor-ledger';

test('page loads with a successful response', async ({ page }) => {
  const response = await page.goto('/');
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
});

test('has a non-empty <title>', async ({ page }) => {
  await page.goto('/');
  const title = await page.title();
  expect(title.trim().length).toBeGreaterThan(0);
});

test(`h1 contains the product name "${PRODUCT_NAME}"`, async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText(PRODUCT_NAME);
});

test('shows at least 4 feature cards', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.card');
  expect(await cards.count()).toBeGreaterThanOrEqual(4);
  await expect(cards.first()).toBeVisible();
  await expect(cards.nth(3)).toBeVisible();
});

test('footer links to the GitHub org', async ({ page }) => {
  await page.goto('/');
  const orgLink = page.locator(`footer a[href="${ORG_URL}"]`);
  await expect(orgLink).toHaveCount(1);
  await expect(orgLink).toHaveAttribute('href', ORG_URL);
});

test('no console errors during load', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  await page.goto('/', { waitUntil: 'load' });
  expect(errors).toEqual([]);
});
