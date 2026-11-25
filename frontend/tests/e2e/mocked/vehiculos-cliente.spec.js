import { test, expect } from '@playwright/test';
import { simularApi, ok, fallo, iniciarSesion } from '../support/api.js';
import { crearFlota, crearVehiculo, fecha } from '../support/datos.js';

async function buscar(page, desde, hasta) {
  const fechas = page.locator('input[type="date"]');
  await fechas.nth(0).fill(desde);
  await fechas.nth(1).fill(hasta);
  await page.getByRole('button', { name: 'Buscar' }).click();
}

test.beforeEach(async ({ page }) => {
  await iniciarSesion(page, 'cliente');
});

test.describe('Listado de la flota', () => {
  test('muestra la primera página con 6 vehículos y sus tarifas', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(8)) });

    await page.goto('/vehiculos');

    await expect(page.getByRole('heading', { name: 'Nuestra Flota' })).toBeVisible();
    const tarjetas = page.locator('.card.h-100');
    await expect(tarjetas).toHaveCount(6);
    await expect(tarjetas.first()).toContainText('Toyota Modelo 1');
    await expect(tarjetas.first()).toContainText('Bs 20.00 / hora');
    await expect(tarjetas.first()).toContainText('Bs 200.00 / día');
  });

  test('pagina la flota con los botones numerados y Siguiente', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(8)) });

    await page.goto('/vehiculos');
    await expect(page.locator('li.page-item.disabled')).toContainText('Anterior');

    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(page.locator('.card.h-100')).toHaveCount(2);
    await expect(page.locator('.card.h-100').first()).toContainText('Toyota Modelo 7');
    await expect(page.locator('li.page-item.disabled')).toContainText('Siguiente');

    await page.getByRole('button', { name: 'Anterior' }).click();
    await expect(page.locator('.card.h-100')).toHaveCount(6);
  });

  test('no muestra paginación con 6 vehículos o menos', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(4)) });

    await page.goto('/vehiculos');

    await expect(page.locator('.card.h-100')).toHaveCount(4);
    await expect(page.getByRole('navigation', { name: 'Paginación de vehículos' })).toHaveCount(0);
  });

  test('deshabilita el botón de un vehículo en mantenimiento', async ({ page }) => {
    await simularApi(page, {
      'GET /api/vehiculos': ok([
        crearVehiculo(1),
        crearVehiculo(2, { estado: 'MANTENIMIENTO', modelo: 'Swift', marca: 'Suzuki' })
      ])
    });

    await page.goto('/vehiculos');

    const enMantenimiento = page.locator('.card.h-100').filter({ hasText: 'Suzuki Swift' });
    await expect(enMantenimiento.getByRole('button', { name: 'En mantenimiento' })).toBeDisabled();
    await expect(enMantenimiento.getByRole('link', { name: 'Reservar' })).toHaveCount(0);
  });

  test('muestra el error cuando la API falla', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': fallo(500, 'Error interno del servidor') });

    await page.goto('/vehiculos');

    await expect(page.locator('.alert-danger')).toHaveText('Error interno del servidor');
  });
});

test.describe('Búsqueda por disponibilidad', () => {
  test('consulta la API con el rango elegido y muestra solo los disponibles', async ({ page }) => {
    const api = await simularApi(page, {
      'GET /api/vehiculos': ok(crearFlota(8)),
      'GET /api/reservas/disponibilidad': ok([crearVehiculo(3)])
    });

    await page.goto('/vehiculos');
    await buscar(page, fecha(5), fecha(6));

    await expect(page.getByText('1 vehículo(s) disponible(s) en el horario elegido.')).toBeVisible();
    await expect(page.locator('.card.h-100')).toHaveCount(1);
    await expect(page.locator('.card.h-100 .badge')).toHaveText('DISPONIBLE');

    const consulta = new URL(api.de('GET /api/reservas/disponibilidad')[0].url);
    expect(consulta.searchParams.get('fechaInicio')).toBeTruthy();
    expect(consulta.searchParams.get('fechaFin')).toBeTruthy();

    await expect(page.locator('.card.h-100').getByRole('link', { name: 'Reservar' })).toHaveAttribute(
      'href',
      /\/vehiculos\/3\/reservar\?inicio=.+&fin=.+/
    );
  });

  test('avisa cuando no hay vehículos libres y Limpiar restaura la flota', async ({ page }) => {
    await simularApi(page, {
      'GET /api/vehiculos': ok(crearFlota(3)),
      'GET /api/reservas/disponibilidad': ok([])
    });

    await page.goto('/vehiculos');
    await buscar(page, fecha(5), fecha(6));

    await expect(page.getByText('No hay vehículos disponibles en ese horario. Prueba con otras fechas.')).toBeVisible();
    await expect(page.locator('.card.h-100')).toHaveCount(0);

    await page.getByRole('button', { name: 'Limpiar' }).click();

    await expect(page.locator('.card.h-100')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Limpiar' })).toHaveCount(0);
  });

  test('rechaza una devolución anterior a la recogida sin llamar a la API', async ({ page }) => {
    const api = await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(3)) });

    await page.goto('/vehiculos');
    await buscar(page, fecha(6), fecha(5));

    await expect(page.locator('.alert-danger')).toHaveText('La fecha de devolución debe ser posterior a la de recogida.');
    expect(api.de('GET /api/reservas/disponibilidad')).toHaveLength(0);
  });

  test('rechaza una recogida en el pasado sin llamar a la API', async ({ page }) => {
    const api = await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(3)) });

    await page.goto('/vehiculos');
    await buscar(page, fecha(-3), fecha(-2));

    await expect(page.locator('.alert-danger')).toHaveText('La fecha de recogida no puede estar en el pasado.');
    expect(api.de('GET /api/reservas/disponibilidad')).toHaveLength(0);
  });

  test('muestra el error del servidor al buscar', async ({ page }) => {
    await simularApi(page, {
      'GET /api/vehiculos': ok(crearFlota(3)),
      'GET /api/reservas/disponibilidad': fallo(400, 'Rango de fechas inválido')
    });

    await page.goto('/vehiculos');
    await buscar(page, fecha(5), fecha(6));

    await expect(page.locator('.alert-danger')).toHaveText('Rango de fechas inválido');
  });
});

test.describe('Detalle del vehículo', () => {
  test('muestra la ficha completa y lleva al formulario de reserva', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(3)) });

    await page.goto('/vehiculos');
    await page.locator('.card.h-100').first().getByRole('link', { name: 'Detalles' }).click();

    await expect(page).toHaveURL(/\/vehiculos\/1$/);
    await expect(page.getByRole('heading', { name: 'Toyota Modelo 1' })).toBeVisible();
    await expect(page.getByText('Placa: PLA-01')).toBeVisible();
    await expect(page.getByText('Categoría: SUV')).toBeVisible();
    await expect(page.getByText('Por hora:').locator('xpath=following-sibling::strong')).toHaveText('Bs 20.00');
    await expect(page.getByText('Por día:').locator('xpath=following-sibling::strong')).toHaveText('Bs 200.00');

    await page.getByRole('button', { name: 'Reservar ahora' }).click();
    await expect(page).toHaveURL(/\/vehiculos\/1\/reservar$/);
  });

  test('vuelve a la flota con el botón Volver', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(3)) });

    await page.goto('/vehiculos/2');
    await page.getByRole('link', { name: 'Volver a la flota' }).click();

    await expect(page).toHaveURL(/\/vehiculos$/);
  });

  test('avisa cuando el vehículo no existe', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(3)) });

    await page.goto('/vehiculos/999');

    await expect(page.getByText('Vehículo no encontrado')).toBeVisible();
  });

  test('bloquea la reserva de un vehículo en mantenimiento', async ({ page }) => {
    await simularApi(page, {
      'GET /api/vehiculos': ok([crearVehiculo(1, { estado: 'MANTENIMIENTO' })])
    });

    await page.goto('/vehiculos/1');

    await expect(page.getByRole('button', { name: 'En mantenimiento' })).toBeDisabled();
  });
});
