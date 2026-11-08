import { test, expect } from '@playwright/test';
import {
  CLIENTE,
  EMPLEADO,
  franjaLibre,
  loginPorUI,
  tokenPorAPI,
  vehiculoReservableAPI,
  reservarPorAPI,
  cancelarPorAPI,
  disponiblesPorAPI
} from './helpers.js';

test.describe('Reservas (E2E)', () => {
  test('E2E 01: el cliente busca disponibilidad y reserva un vehículo', async ({ page }) => {
    const franja = franjaLibre();

    await loginPorUI(page, CLIENTE);
    await page.goto('/vehiculos');

    // Buscar por fechas
    await page.getByTestId('input-fecha-inicio').fill(franja.inicio);
    await page.getByTestId('input-fecha-fin').fill(franja.fin);
    await page.getByTestId('btn-buscar').click();
    await expect(page.getByTestId('resumen-busqueda')).toContainText('disponible');

    // Elegir el primero y pasar al formulario con las fechas ya cargadas
    await page.getByTestId('vehiculo-card').first().getByRole('link', { name: 'Reservar' }).click();
    await expect(page).toHaveURL(/\/vehiculos\/\d+\/reservar/);
    await expect(page.getByTestId('reserva-fecha-inicio')).toHaveValue(franja.inicio);
    await expect(page.getByTestId('reserva-fecha-fin')).toHaveValue(franja.fin);
    await expect(page.getByTestId('form-reserva')).toContainText('4 horas');
    await expect(page.getByTestId('reserva-total')).toHaveText(/^Bs \d+\.\d{2}$/);

    // Confirmar
    await page.getByTestId('btn-confirmar-reserva').click();
    await expect(page).toHaveURL(/\/reservas\/\d+$/);
    await expect(page.getByTestId('reserva-estado')).toHaveText('Reservada');
    await expect(page.getByTestId('timeline-estados')).toBeVisible();

    // Aparece en "Mis reservas"
    await page.goto('/mis-reservas');
    await expect(page.getByTestId('reserva-fila').first()).toContainText('Reservada');

    // Limpieza: cancelar para dejar libre la franja
    await page.getByTestId('reserva-fila').first().getByRole('link', { name: 'Ver' }).click();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTestId('btn-cancelar-reserva').click();
    await expect(page.getByTestId('reserva-estado')).toHaveText('Cancelada');
  });

  test('E2E 02: no se puede reservar el mismo vehículo en un horario ocupado', async ({ page, request }) => {
    const franja = franjaLibre();
    const tokenCliente = await tokenPorAPI(request, CLIENTE);
    const vehiculo = await vehiculoReservableAPI(request, tokenCliente);

    // Preparación: el cliente ya tiene el auto en esa franja
    const reservaExistente = await reservarPorAPI(request, tokenCliente, vehiculo.id, franja);

    try {
      // Otra persona intenta reservar el mismo auto en el mismo horario
      await loginPorUI(page, EMPLEADO);
      await page.goto(
        `/vehiculos/${vehiculo.id}/reservar?inicio=${encodeURIComponent(franja.inicio)}&fin=${encodeURIComponent(franja.fin)}`
      );
      await page.getByTestId('btn-confirmar-reserva').click();

      await expect(page.getByTestId('reserva-error')).toContainText('ya está reservado');
      await expect(page).toHaveURL(/\/reservar/); // no avanzó

      // Y en el buscador ese vehículo ya no aparece como disponible para esa franja
      await page.goto('/vehiculos');
      await page.getByTestId('input-fecha-inicio').fill(franja.inicio);
      await page.getByTestId('input-fecha-fin').fill(franja.fin);
      await page.getByTestId('btn-buscar').click();
      await expect(page.getByTestId('form-busqueda')).toBeVisible();
      await expect(page.getByTestId(`btn-reservar-${vehiculo.id}`)).toHaveCount(0);
    } finally {
      await cancelarPorAPI(request, tokenCliente, reservaExistente.id);
    }
  });

  test('E2E 03: cancelar una reserva la marca como cancelada y libera el horario', async ({ page, request }) => {
    const franja = franjaLibre();
    const tokenCliente = await tokenPorAPI(request, CLIENTE);
    const vehiculo = await vehiculoReservableAPI(request, tokenCliente);
    const reserva = await reservarPorAPI(request, tokenCliente, vehiculo.id, franja);

    try {
      await loginPorUI(page, CLIENTE);
      await page.goto(`/reservas/${reserva.id}`);
      await expect(page.getByTestId('reserva-estado')).toHaveText('Reservada');

      // Cancelar (la pantalla pide confirmación con un diálogo del navegador)
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByTestId('btn-cancelar-reserva').click();

      await expect(page.getByTestId('reserva-estado')).toHaveText('Cancelada');
      await expect(page.getByTestId('timeline-estados')).toContainText('cancelada');
      await expect(page.getByTestId('btn-cancelar-reserva')).toHaveCount(0); // ya no se puede cancelar otra vez

      // El horario quedó libre: el vehículo vuelve a figurar como disponible
      const disponibles = await disponiblesPorAPI(request, tokenCliente, franja);
      expect(disponibles.map((v) => v.id)).toContain(vehiculo.id);
    } finally {
      await cancelarPorAPI(request, tokenCliente, reserva.id);
    }
  });
});
