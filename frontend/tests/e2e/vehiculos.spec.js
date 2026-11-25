import { test, expect } from '@playwright/test';
import { ADMIN, crearCliente, sufijoUnico } from './helpers/datos.js';
import { iniciarSesion, aceptarDialogos } from './helpers/sesion.js';

test.describe('Módulo de vehículos', () => {
  let cliente;

  test.beforeAll(async ({ request }) => {
    cliente = await crearCliente(request);
  });

  test('el cliente ve la flota', async ({ page }) => {
    await iniciarSesion(page, cliente);

    await expect(page.getByRole('heading', { name: 'Nuestra Flota' })).toBeVisible();
    await expect(page.locator('.card-img-top').first()).toBeVisible();
  });

  test('el administrador crea, busca y elimina un vehículo', async ({ page }) => {
    const sufijo = sufijoUnico();
    const placa = `UI-${sufijo}`.slice(0, 20);
    const mensajes = aceptarDialogos(page);

    await iniciarSesion(page, ADMIN);
    await page.goto('/dashboard/admin/vehiculos');
    await page.getByRole('link', { name: '+ Nuevo Vehículo' }).click();

    await page.fill('input[name="placa"]', placa);
    await page.fill('input[name="marca"]', 'Nissan');
    await page.fill('input[name="modelo"]', `UI-${sufijo}`);
    await page.getByRole('button', { name: 'Registrar Vehículo' }).click();

    await expect(page).toHaveURL(/\/dashboard\/admin\/vehiculos$/);
    expect(mensajes.join(' ')).toContain('creado exitosamente');

    await page.getByPlaceholder('Buscar por placa, marca o modelo...').fill(placa);
    const fila = page.locator('tbody tr').filter({ hasText: placa });
    await expect(fila).toContainText('DISPONIBLE');

    await fila.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('No se encontraron vehículos.')).toBeVisible();
  });

  test('el cliente no accede a las páginas de gestión', async ({ page }) => {
    await iniciarSesion(page, cliente);

    for (const ruta of ['/dashboard', '/dashboard/reservas', '/dashboard/admin/vehiculos', '/admin/tarifas']) {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/vehiculos$/);
    }
  });
});
