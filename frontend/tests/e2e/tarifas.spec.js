import { test, expect } from '@playwright/test';
import { ADMIN, crearVehiculo, eliminarVehiculo } from './helpers/datos.js';
import { iniciarSesion, aceptarDialogos } from './helpers/sesion.js';

test.describe('Gestión de tarifas', () => {
  let vehiculo;

  test.beforeAll(async ({ request }) => {
    vehiculo = await crearVehiculo(request);
  });

  test.afterAll(async ({ request }) => {
    await eliminarVehiculo(request, vehiculo);
  });

  test('el administrador crea, edita y elimina una tarifa', async ({ page }) => {
    aceptarDialogos(page);
    await iniciarSesion(page, ADMIN);
    await page.goto('/admin/tarifas');

    const formulario = page.locator('form');
    await formulario.locator('select').nth(0).selectOption('vehiculo');
    await formulario.locator('select').nth(1).selectOption(String(vehiculo.id));
    await formulario.locator('select').nth(2).selectOption('SEMANA');
    await formulario.locator('input[type="number"]').fill('1500');
    await page.getByRole('button', { name: 'Guardar Tarifa' }).click();
    await expect(page.getByText('¡Tarifa creada con éxito!')).toBeVisible();

    const fila = page.locator('tbody tr').filter({ hasText: vehiculo.placa }).filter({ hasText: 'SEMANA' });
    await expect(fila).toContainText('1500');

    await fila.getByRole('button', { name: 'Editar' }).click();
    await fila.locator('input[type="number"]').fill('1600');
    await fila.getByRole('button', { name: 'Guardar' }).click();
    await expect(fila).toContainText('1600');

    await fila.getByRole('button', { name: 'Eliminar' }).click();
    await expect(fila).toHaveCount(0);
  });
});
