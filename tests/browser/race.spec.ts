import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/browser/race.html');
});

test('jawaban ditolak menampilkan pesan dan memungkinkan kirim ulang', async ({ page }) => {
  const option = page.getByRole('button', { name: /^Pilihan A:/ });
  await option.click();
  await expect(option).toBeDisabled();
  await page.getByRole('button', { name: 'Tolak jawaban' }).click();
  await expect(page.getByRole('alert')).toContainText('Jawaban tidak valid.');
  await expect(option).toBeEnabled();
  await option.click();
  await expect(page.getByLabel('Jumlah kiriman')).toHaveText('2');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(option).toBeDisabled();
});

test('mengunci klik dan keyboard sebelum respons server, lalu membuka soal berikutnya', async ({
  page,
}) => {
  const options = page.getByRole('button', { name: /^Pilihan [A-D]:/ });
  await options.first().click();
  for (const option of await options.all()) await expect(option).toBeDisabled();
  await page.keyboard.press('b');
  await page.keyboard.press('2');
  await expect(page.getByLabel('Jumlah kiriman')).toHaveText('1');
  await expect(options.first()).toHaveAccessibleName(/Menunggu/);
  await page.getByRole('button', { name: 'Respons salah' }).click();
  await expect(options.first()).toHaveAccessibleName(/Salah/);
  await expect(options.nth(1)).toHaveAccessibleName(/Benar/);
  const sheet = page.getByRole('region', { name: 'Penjelasan jawaban' });
  await expect(sheet).toContainText('Penjelasan contoh');
  await expect(sheet.getByRole('timer')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Soal berikutnya.' })).toBeVisible({
    timeout: 8000,
  });
  await expect(options.first()).toBeEnabled();
  await page.keyboard.press('a');
  await expect(page.getByLabel('Jumlah kiriman')).toHaveText('2');
});

test('finish mempertahankan popup, fokus keyboard, dan pilihan menonton', async ({ page }) => {
  await page.getByRole('button', { name: 'Simulasikan finish' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Tonton sisa balapan' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Tonton sisa balapan' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText('Menonton sisa balapan…')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lihat hasil', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: /^Pilihan A:/ })).toHaveCount(0);
});

test('jawaban terakhir tetap memperlihatkan feedback sebelum dialog finish', async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.keyboard.press('b');
  await page.getByRole('button', { name: 'Respons benar terakhir' }).click();
  await expect(page.getByRole('article')).toBeVisible();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('status', { name: 'Benar', exact: true })).toBeVisible();
  // Penjelasan jawaban benar ditahan 8 detik (FR-B04) sebelum lanjut/dialog.
  await page.clock.runFor(8200);
  await expect(page.getByRole('dialog')).toContainText('Finish! Posisi ke-1');
});

test('state finish yang tiba sebelum feedback tidak memotong jawaban terakhir', async ({
  page,
}) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.keyboard.press('b');
  await page.getByRole('button', { name: 'Simulasikan finish' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText('Jawaban terkirim. Menunggu respons…')).toBeVisible();
  await page.getByRole('button', { name: 'Respons benar terakhir' }).click();
  await expect(page.getByRole('status', { name: 'Benar', exact: true })).toBeVisible();
  await page.clock.runFor(8200);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('lintasan selebar layar dan tidak overflow pada ukuran kecil', async ({ page }) => {
  for (const width of [320, 360, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    const track = await page.getByRole('region', { name: 'Lintasan' }).boundingBox();
    expect(track?.width).toBe(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test('feedback benar delapan detik, soal habis, dan aset tampil tanpa error', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  const main = page.getByRole('main');
  await expect(page.getByRole('article')).toBeVisible();
  expect(
    await main
      .locator('img')
      .evaluateAll((images) =>
        images.every(
          (image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        ),
      ),
  ).toBe(true);
  await main.screenshot({ path: `test-results/race-${testInfo.project.name}-default.png` });
  await page.keyboard.press('b');
  await page.getByRole('button', { name: 'Respons benar', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Benar', exact: true })).toBeVisible();
  await main.screenshot({ path: `test-results/race-${testInfo.project.name}-correct.png` });
  await page.clock.runFor(8200);
  await expect(page.getByRole('heading', { name: 'Soal berikutnya.' })).toBeVisible();
  await page.keyboard.press('a');
  await page.getByRole('button', { name: 'Respons salah' }).click();
  await expect(
    page.getByRole('region', { name: 'Penjelasan jawaban' }).getByRole('timer'),
  ).toBeVisible();
  await main.screenshot({ path: `test-results/race-${testInfo.project.name}-wrong.png` });
  await page.clock.runFor(5200);
  await page.getByRole('button', { name: 'Simulasikan soal habis' }).click();
  await expect(page.getByRole('dialog')).toContainText('Soalmu habis');
  await page.keyboard.press('Escape');
  await expect(page.getByText('Menonton sisa balapan…')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pilihan A:/ })).toHaveCount(0);
  await main.screenshot({ path: `test-results/race-${testInfo.project.name}-exhausted.png` });
  expect(errors).toEqual([]);
});
