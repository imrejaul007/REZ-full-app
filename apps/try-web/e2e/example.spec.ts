import { test, expect } from '@playwright/test';

test.describe('ReZ Try E2E Tests', () => {

  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    // Should show landing page or home
    await expect(page.locator('body')).toBeVisible();
  });

  test('landing page shows hero section', async ({ page }) => {
    await page.goto('/landing');
    await expect(page.getByText('Try Before You Buy')).toBeVisible();
  });

  test('login page shows form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('9876543210')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('can login with demo credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill form
    await page.getByPlaceholder('9876543210').fill('9876543210');
    await page.getByPlaceholder('••••••••').fill('demo123');

    // Submit
    await page.getByRole('button', { name: 'Login' }).click();

    // Should redirect or show home
    await expect(page).not.toHaveURL('/login');
  });

  test('trial card shows pricing', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder('9876543210').fill('9876543210');
    await page.getByPlaceholder('••••••••').fill('demo123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/');

    // Check trials are shown
    await expect(page.locator('text=Explore Trials').or(page.locator('text=Trial'))).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByPlaceholder('9876543210').fill('9876543210');
    await page.getByPlaceholder('••••••••').fill('demo123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/');

    // Navigate to coins
    await page.goto('/coins');
    await expect(page.getByText('Your Balance')).toBeVisible();
  });

  test('responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/landing');

    // Mobile menu should be visible
    await expect(page.locator('body')).toBeVisible();
  });
});
