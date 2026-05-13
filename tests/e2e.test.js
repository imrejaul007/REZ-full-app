// E2E test placeholder
const { test, expect } = require('@playwright/test');
test('payment flow E2E', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid=pay-btn]');
  await expect(page.locator('.success')).toBeVisible();
});
