import { test, expect } from '@playwright/test';
import { ADMIN, EMPLEADO, sufijoUnico, crearCliente } from './helpers/datos.js';
import { iniciarSesion, aceptarDialogos } from './helpers/sesion.js';

test.describe('Autenticación y roles', () => {
  test('registro e inicio de sesión de un cliente nuevo', async ({ page }) => {
    const email = `autotest_${sufijoUnico().toLowerCase()}@tierracamba.com`;
    const password = 'Password123*';
    const mensajes = aceptarDialogos(page);

    await page.goto('/');
    await page.locator('.btn-register').click();
    await expect(page).toHaveURL(/\/register$/);

    await page.fill('input[name="nombre"]', 'Usuario Automatizado');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/login$/);
    expect(mensajes.join(' ')).toContain('Registro exitoso');

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/vehiculos$/);
  });

  test('no permite registrar un correo repetido', async ({ page, request }) => {
    const cliente = await crearCliente(request);

    await page.goto('/register');
    await page.fill('input[name="nombre"]', 'Repetido');
    await page.fill('input[name="email"]', cliente.email);
    await page.fill('input[name="password"]', 'Password123*');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-danger')).toContainText('ya está registrado');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('muestra error con una contraseña incorrecta', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN.email);
    await page.fill('input[type="password"]', 'incorrecta');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-danger')).toContainText('Credenciales inválidas');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('administrador y empleado entran al dashboard con sus opciones', async ({ page }) => {
    await iniciarSesion(page, ADMIN);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('link', { name: 'Gestionar Tarifas' })).toBeVisible();

    await iniciarSesion(page, EMPLEADO);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('link', { name: 'Ir a Reservas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Gestionar Tarifas' })).toHaveCount(0);
  });

  test('cerrar sesión protege las rutas privadas', async ({ page, request }) => {
    const cliente = await crearCliente(request);
    await iniciarSesion(page, cliente);

    await page.locator('.btn-logout').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();

    await page.goto('/mis-reservas');
    await expect(page).toHaveURL(/\/login$/);
  });
});
