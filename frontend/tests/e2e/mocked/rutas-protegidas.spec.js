import { test, expect } from '@playwright/test';
import { simularApi, ok, iniciarSesion } from '../support/api.js';
import { crearFlota, categorias } from '../support/datos.js';

const rutasCliente = ['/vehiculos', '/mis-reservas'];

const rutasStaff = [
  '/dashboard',
  '/dashboard/reservas',
  '/dashboard/alquileres-pendientes',
  '/dashboard/alquileres-activos',
  '/dashboard/alquileres-historial'
];

const rutasAdmin = ['/dashboard/admin/vehiculos', '/vehiculos/crear', '/admin/tarifas'];

const apiBase = {
  'GET /api/vehiculos': ok(crearFlota(2)),
  'GET /api/categorias': ok(categorias),
  'GET /api/tarifas': ok([])
};

test.describe('Visitante sin sesión', () => {
  for (const ruta of [...rutasCliente, ...rutasStaff, ...rutasAdmin]) {
    test(`${ruta} redirige al login`, async ({ page }) => {
      await simularApi(page, apiBase);

      await page.goto(ruta);

      await expect(page).toHaveURL(/\/login$/);
    });
  }
});

test.describe('Cliente', () => {
  for (const ruta of [...rutasStaff, ...rutasAdmin]) {
    test(`no puede entrar a ${ruta}`, async ({ page }) => {
      await iniciarSesion(page, 'cliente');
      await simularApi(page, apiBase);

      await page.goto(ruta);

      await expect(page).toHaveURL(/\/vehiculos$/);
    });
  }

  test('ve en el navbar solo los enlaces de cliente', async ({ page }) => {
    await iniciarSesion(page, 'cliente');
    await simularApi(page, apiBase);

    await page.goto('/vehiculos');

    const enlaces = page.locator('.navbar-links');
    await expect(enlaces).toContainText('Mis Reservas');
    await expect(enlaces).not.toContainText('Dashboard');
  });
});

test.describe('Empleado', () => {
  for (const ruta of rutasAdmin) {
    test(`no puede entrar a ${ruta}`, async ({ page }) => {
      await iniciarSesion(page, 'empleado');
      await simularApi(page, apiBase);

      await page.goto(ruta);

      await expect(page).toHaveURL(/\/vehiculos$/);
    });
  }

  test('su dashboard no muestra inventario, tarifas ni usuarios', async ({ page }) => {
    await iniciarSesion(page, 'empleado');
    await simularApi(page, apiBase);

    await page.goto('/dashboard');

    await expect(page.getByText('Bienvenido, Empleado Demo')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reservas', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alquileres pendientes', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alquileres activos', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Tarifas', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toHaveCount(0);
  });
});

test.describe('Administrador', () => {
  test('su dashboard muestra todas las tarjetas', async ({ page }) => {
    await iniciarSesion(page, 'admin');
    await simularApi(page, apiBase);

    await page.goto('/dashboard');

    for (const titulo of ['Inventario', 'Reservas', 'Alquileres pendientes', 'Alquileres activos', 'Historial de alquileres', 'Tarifas', 'Usuarios']) {
      await expect(page.getByRole('heading', { name: titulo, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Próximamente' })).toBeDisabled();
  });

  test('navega desde el dashboard a vehículos y a tarifas', async ({ page }) => {
    await iniciarSesion(page, 'admin');
    await simularApi(page, apiBase);

    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Ir a Vehículos' }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/vehiculos$/);

    await page.getByRole('link', { name: '← Volver al Dashboard' }).click();
    await page.getByRole('link', { name: 'Gestionar Tarifas' }).click();
    await expect(page).toHaveURL(/\/admin\/tarifas$/);
  });
});
