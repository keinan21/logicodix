import { expect, test } from '@playwright/test';
test('hasil final, navigasi, dan nama panjang tanpa overflow', async ({ page }, info) => {
  await page.goto('/tests/browser/podium.html');
  await expect(page.getByRole('heading', { name: 'Hasil balapan' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Waktu habis', exact: true })).toBeVisible();
  await expect(page.locator('.podium-me')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('podium.png'), fullPage: true });
  await page.getByRole('button', { name: 'Lihat evaluasi AI' }).click();
  await expect(page.getByLabel('Navigasi')).toHaveText('Evaluasi');
  await page.getByRole('button', { name: 'Main lagi' }).click();
  await expect(page.getByLabel('Navigasi')).toHaveText('Main');
});
test('hasil sementara menawarkan kembali menonton', async ({ page }) => {
  await page.goto('/tests/browser/podium.html?sementara');
  await expect(page.getByRole('heading', { name: 'Hasil sementara' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Main lagi' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Kembali menonton' }).click();
  await expect(page.getByLabel('Navigasi')).toHaveText('Menonton');
});
