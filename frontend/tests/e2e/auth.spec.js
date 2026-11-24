import { test, expect } from '@playwright/test';

test.describe('E2E 01: Flujo completo de Registro y Login', () => {

  const uniqueEmail = `autotest_${Date.now()}@tierracamba.com`;
  const password = 'Password123*';

  test('Debe permitir registrarse y posteriormente iniciar sesión de forma exitosa', async ({ page }) => {
    // 1. Ir a la página de registro desde la landing
    await page.goto('/');
    await page.locator('a.btn-register, a[href="/register"]').first().click();
    await expect(page).toHaveURL(/.*\/register/);

    // 2. Llenar formulario de registro
    await page.fill('input[name="nombre"]', 'Usuario Automatizado');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);

    // 👇 CONFIGURACIÓN DEL ALERT (Debe ir ANTES del clic)
    page.on('dialog', async dialog => {
      // Verificamos que el mensaje sea el de éxito
      expect(dialog.message()).toContain('Registro exitoso');
      // Aceptamos el alert (equivale a hacer clic en "OK")
      await dialog.accept();
    });

    // 3. Enviar formulario
    await page.click('button[type="submit"]');

    // 4. Verificar redirección al Login (Le damos 10s de margen)
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });

    // 5. Llenar el formulario de Login
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // 6. Verificar que ingresó al sistema (redirige a /vehiculos para clientes)
    await expect(page).toHaveURL(/.*\/vehiculos/);
  });
});