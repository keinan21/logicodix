import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/browser/race.html');
});

for (const animal of ['harimau', 'gajah', 'badak', 'orangutan', 'penyu', 'burung']) {
  test(`${animal}: kedua kaki berayun bergantian dan berhenti`, async ({ page }) => {
    await page.getByLabel('Hewan pengujian').selectOption(animal);
    const runner = page.locator('.lane-runner').first();
    await page.getByRole('button', { name: 'Respons benar', exact: true }).click();
    await expect(runner.locator('.lane-limb-front')).toHaveCSS('animation-name', 'lane-stride');
    await expect(runner.locator('.lane-limb-back')).toHaveCSS('animation-delay', '-0.1s');
    await expect(runner.locator('.lane-limb-front')).toHaveCSS('animation-name', 'none');
  });
}

test('kaki bergerak hanya selama langkah dari server, termasuk langkah finish', async ({
  page,
}) => {
  const runner = page.locator('.lane-runner').first();
  const leg = runner.locator('.lane-limb').first();
  await expect(leg).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'Respons benar', exact: true }).click();
  await expect(leg).toHaveCSS('animation-name', 'lane-stride');
  await expect(leg).toHaveCSS('animation-name', 'none');
  await expect(runner).toHaveAttribute('style', 'left: 60%;');
  await page.getByRole('button', { name: 'Respons benar terakhir', exact: true }).click();
  await expect(leg).toHaveCSS('animation-name', 'lane-stride');
  await expect(leg).toHaveCSS('animation-name', 'none');
  await expect(runner).toHaveAttribute('style', 'left: 100%;');
});

test('jawaban salah tidak menggerakkan kaki atau posisi', async ({ page }) => {
  const runner = page.locator('.lane-runner').first();
  await page.getByRole('button', { name: 'Respons salah' }).click();
  await expect(runner.locator('.lane-limb').first()).toHaveCSS('animation-name', 'none');
  await expect(runner).toHaveAttribute('style', 'left: 40%;');
});

test('reduced motion tetap memperbarui posisi tanpa animasi kaki', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Respons benar', exact: true }).click();
  const runner = page.locator('.lane-runner').first();
  await expect(runner).toHaveCSS('transition-duration', '0s');
  await expect(runner.locator('.lane-limb').first()).toHaveCSS('animation-name', 'none');
  await expect(runner).toHaveAttribute('style', 'left: 60%;');
});
