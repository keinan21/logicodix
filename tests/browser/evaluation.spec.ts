import { expect, test } from '@playwright/test';
for (const [mode, text] of [
  ['ai', 'Dibuat oleh AI'],
  ['contoh', 'Contoh AI (dibuat sebelumnya)'],
  ['fallback', 'Ringkasan otomatis (bukan AI)'],
  ['loading', 'AI sedang menyusun evaluasi…'],
  ['benar', 'Motivasi contoh.'],
  ['empty', 'Belum ada soal yang kamu jawab.'],
]) {
  test(`evaluasi ${mode}`, async ({ page }, info) => {
    await page.goto(`/tests/browser/evaluation.html?mode=${mode}`);
    await expect(page.getByText(text!, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (mode !== 'empty') {
      const item = page.getByRole('button', { name: /Soal 1/ });
      await expect(item).toHaveAttribute('aria-expanded', mode === 'benar' ? 'false' : 'true');
      if (mode !== 'benar') {
        await expect(page.getByText('Kamu memilih Pilihan B, jawabannya Pilihan A.')).toBeVisible();
        await expect(page.getByText('Klaim contoh, bukan materi pembelajaran.')).toBeVisible();
        await expect(page.getByText('Penjelasan contoh.')).toBeVisible();
        await expect(page.locator('.eval-item a')).toHaveAttribute('href', 'https://example.org');
      }
      if (mode === 'loading') await expect(page.locator('[aria-busy="true"]')).toBeVisible();
      await item.click();
      await expect(item).toHaveAttribute('aria-expanded', mode === 'benar' ? 'true' : 'false');
      if (mode !== 'benar') await item.click();
    }
    await page.screenshot({ path: info.outputPath('evaluation.png'), fullPage: true });
    await page.getByRole('button', { name: 'Kembali ke hasil' }).click();
    await expect(page.getByLabel('Navigasi')).toHaveText('Hasil');
    await page.getByRole('button', { name: 'Main lagi' }).click();
    await expect(page.getByLabel('Navigasi')).toHaveText('Main');
  });
}
