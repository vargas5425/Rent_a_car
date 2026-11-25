import { test, expect } from '@playwright/test';

async function simularSesion(page, usuario) {
  await page.goto('/');
  await page.evaluate((datos) => localStorage.setItem('usuario', JSON.stringify(datos)), usuario);
  await page.reload();
}

test.describe('Landing page y navbar', () => {
  test('carga la página principal con sus elementos clave', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.navbar-custom')).toContainText('Tierra Camba');
    await expect(page.locator('h1.hero-title')).toContainText('Premium');
    await expect(page.locator('.btn-login')).toHaveText('Iniciar Sesión');
    await expect(page.locator('.btn-register')).toHaveText('Registrarse');
    await expect(page.locator('.brands-section')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('cambia a modo oscuro y lo recuerda al recargar', async ({ page }) => {
    await page.goto('/');

    await page.locator('.rc-theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('oculta los enlaces de navegación en pantallas móviles', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 800 });
    await simularSesion(page, { nombre: 'Carlos Pérez', rol: 'CLIENTE' });

    await expect(page.locator('.nav-link-custom')).toHaveCount(2);
    await expect(page.locator('.nav-link-custom').first()).toBeHidden();
  });

  test('muestra el navbar del cliente', async ({ page }) => {
    await simularSesion(page, { nombre: 'Carlos Pérez', rol: 'CLIENTE' });

    await expect(page.locator('.navbar-links')).toContainText('List Cars');
    await expect(page.locator('.navbar-links')).toContainText('Mis Reservas');
    await expect(page.locator('.user-name')).toContainText('Hola, Carlos Pérez');
    await expect(page.locator('.btn-logout')).toBeVisible();
  });

  test('muestra el navbar del administrador', async ({ page }) => {
    await simularSesion(page, { nombre: 'Admin Master', rol: 'ADMINISTRADOR' });

    await expect(page.locator('.navbar-links')).toContainText('List Cars');
    await expect(page.locator('.navbar-links')).toContainText('Dashboard');
    await expect(page.locator('.navbar-links')).not.toContainText('Mis Reservas');
    await expect(page.locator('.user-name')).toContainText('Hola, Admin Master');
  });
});
