import { expect } from '@playwright/test';

export async function iniciarSesion(page, usuario) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('input[type="email"]', usuario.email);
  await page.fill('input[type="password"]', usuario.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/(dashboard|vehiculos)$/);
}

export function aceptarDialogos(page) {
  const mensajes = [];
  page.on('dialog', async (dialogo) => {
    mensajes.push(dialogo.message());
    await dialogo.accept();
  });
  return mensajes;
}
