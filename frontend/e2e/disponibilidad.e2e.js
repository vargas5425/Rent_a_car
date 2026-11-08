import { test, expect } from '@playwright/test';
import {
  CLIENTE,
  franjaLibre,
  franjaPasada,
  loginPorUI,
  tokenPorAPI,
  disponiblesPorAPI
} from './helpers.js';

// Requisitos (igual que reservas.e2e.js): sistema completo funcionando y datos de demostración.

test.describe('Disponibilidad: buscar y ver resultados (E2E)', () => {
  test('E2E 04: el cliente busca por fechas y ve los vehículos disponibles', async ({ page, request }) => {
    const franja = franjaLibre();

    // Lo que debería mostrar la pantalla, según la propia API
    const token = await tokenPorAPI(request, CLIENTE);
    const esperados = await disponiblesPorAPI(request, token, franja);
    expect(esperados.every((v) => v.estado !== 'MANTENIMIENTO')).toBe(true);

    await loginPorUI(page, CLIENTE);
    await page.goto('/vehiculos');

    await page.getByTestId('input-fecha-inicio').fill(franja.inicio);
    await page.getByTestId('input-fecha-fin').fill(franja.fin);
    await page.getByTestId('btn-buscar').click();

    // El resumen y las tarjetas coinciden con lo que respondió la API
    const resumen = page.getByTestId('resumen-busqueda');
    if (esperados.length === 0) {
      await expect(resumen).toContainText('No hay vehículos disponibles');
    } else {
      await expect(resumen).toContainText(`${esperados.length} vehículo(s) disponible(s)`);
    }
    await expect(page.getByTestId('vehiculo-card')).toHaveCount(esperados.length);

    // Cada vehículo listado se puede reservar y está marcado como libre en ese horario
    for (const vehiculo of esperados) {
      await expect(page.getByTestId(`btn-reservar-${vehiculo.id}`)).toBeVisible();
    }
    if (esperados.length > 0) {
      await expect(page.getByTestId('vehiculo-card').first()).toContainText('DISPONIBLE EN TU HORARIO');
    }
    await expect(page.getByTestId('busqueda-error')).toHaveCount(0);
  });

  test('E2E 04b: "Limpiar" quita la búsqueda y vuelve a mostrar toda la flota', async ({ page }) => {
    const franja = franjaLibre();

    await loginPorUI(page, CLIENTE);
    await page.goto('/vehiculos');
    await page.getByTestId('input-fecha-inicio').fill(franja.inicio);
    await page.getByTestId('input-fecha-fin').fill(franja.fin);
    await page.getByTestId('btn-buscar').click();
    await expect(page.getByTestId('resumen-busqueda')).toBeVisible();

    await page.getByRole('button', { name: 'Limpiar' }).click();

    await expect(page.getByTestId('resumen-busqueda')).toHaveCount(0);
    await expect(page.getByTestId('input-fecha-inicio')).toHaveValue('');
    await expect(page.getByTestId('input-fecha-fin')).toHaveValue('');
  });
});

test.describe('Disponibilidad: validación de fechas del formulario (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await loginPorUI(page, CLIENTE);
    await page.goto('/vehiculos');
  });

  test('E2E 05: no deja buscar sin elegir las fechas', async ({ page }) => {
    await page.getByTestId('btn-buscar').click();

    await expect(page.getByTestId('busqueda-error')).toHaveText('Elige la fecha de inicio y la de fin.');
    await expect(page.getByTestId('resumen-busqueda')).toHaveCount(0);
  });

  test('E2E 06: no deja buscar si falta la fecha de devolución', async ({ page }) => {
    const franja = franjaLibre();
    await page.getByTestId('input-fecha-inicio').fill(franja.inicio);
    await page.getByTestId('btn-buscar').click();

    await expect(page.getByTestId('busqueda-error')).toHaveText('Elige la fecha de inicio y la de fin.');
    await expect(page.getByTestId('resumen-busqueda')).toHaveCount(0);
  });

  test('E2E 07: rechaza una devolución anterior a la recogida', async ({ page }) => {
    const franja = franjaLibre();
    await page.getByTestId('input-fecha-inicio').fill(franja.fin);
    await page.getByTestId('input-fecha-fin').fill(franja.inicio);
    await page.getByTestId('btn-buscar').click();

    await expect(page.getByTestId('busqueda-error')).toHaveText(
      'La fecha de devolución debe ser posterior a la de recogida.'
    );
    await expect(page.getByTestId('resumen-busqueda')).toHaveCount(0);
  });

  test('E2E 08: rechaza una recogida en el pasado', async ({ page }) => {
    const pasada = franjaPasada();
    await page.getByTestId('input-fecha-inicio').fill(pasada.inicio);
    await page.getByTestId('input-fecha-fin').fill(pasada.fin);
    await page.getByTestId('btn-buscar').click();

    await expect(page.getByTestId('busqueda-error')).toHaveText('La fecha de recogida no puede estar en el pasado.');
    await expect(page.getByTestId('resumen-busqueda')).toHaveCount(0);
  });

  test('E2E 09: el mensaje de error desaparece al corregir las fechas y buscar de nuevo', async ({ page }) => {
    // Primero un error...
    await page.getByTestId('btn-buscar').click();
    await expect(page.getByTestId('busqueda-error')).toBeVisible();

    // ...y luego fechas correctas
    const franja = franjaLibre();
    await page.getByTestId('input-fecha-inicio').fill(franja.inicio);
    await page.getByTestId('input-fecha-fin').fill(franja.fin);
    await page.getByTestId('btn-buscar').click();

    await expect(page.getByTestId('busqueda-error')).toHaveCount(0);
    await expect(page.getByTestId('resumen-busqueda')).toBeVisible();
  });
});
