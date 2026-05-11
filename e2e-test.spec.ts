import { test, expect } from '@playwright/test';

test.describe('ReZ Order Flow', () => {
  test('complete order flow', async ({ page }) => {
    // 1. Open app
    await page.goto('https://consumer.rez.money');
    await expect(page).toHaveTitle(/ReZ/);

    // 2. Click scan QR
    await page.click('[data-testid="scan-button"]');
    await page.waitForURL(/scan/);

    // 3. Mock camera QR scan
    await page.evaluate(() => {
      // @ts-ignore
      window.handleQRCode('merchant_test123');
    });

    // 4. Verify menu loaded
    await expect(page.locator('[data-testid="merchant-name"]')).toBeVisible();

    // 5. Add item
    await page.click('[data-testid="add-item"]');
    await expect(page.locator('.cart-badge')).toHaveText('1');

    // 6. Checkout
    await page.click('[data-testid="checkout"]');
    await page.click('[data-testid="pay-upi"]');

    // 7. Verify redirect to UPI
    await page.waitForURL(/upi/);
  });
});

test('wallet flow', async ({ page }) => {
  await page.goto('https://consumer.rez.money/wallet');

  // Check balance
  await expect(page.locator('.balance')).toBeVisible();
  await expect(page.locator('.balance')).toContainText('₹');
});

test.describe('Merchant App', () => {
  test('login flow', async ({ page }) => {
    await page.goto('https://merchant.rez.money/login');
    await page.fill('[name="phone"]', '9876543210');
    await page.click('button[type="submit"]');
    await page.fill('[name="otp"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
  });
});

test('health checks', async ({ request }) => {
  const res = await request.get('https://rez-api-gateway.onrender.com/health');
  expect(res.ok()).toBeTruthy();
  expect(res.status()).toBe(200);
});
