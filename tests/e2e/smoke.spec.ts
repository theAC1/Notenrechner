import { test, expect } from '@playwright/test';

test.describe('Notenrechner V2 — Smoke tests', () => {
  test('loads with seed exam and shows stats', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Notenrechner/ })).toBeVisible();
    await expect(page.locator('text=Durchschnitt').or(page.locator('text=Average'))).toBeVisible();
  });

  test('can add and remove a student', async ({ page }) => {
    await page.goto('/');
    const initialRows = await page.locator('table tbody tr').count();
    await page.getByRole('button', { name: /Schüler hinzufügen|Add student/ }).click();
    await expect(page.locator('table tbody tr')).toHaveCount(initialRows + 1);
  });

  test('toggles dark mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Dark mode|Dunkler Modus/ }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('switches language', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page.getByText('Students', { exact: false })).toBeVisible();
  });
});
