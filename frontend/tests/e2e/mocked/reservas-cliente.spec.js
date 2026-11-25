import { test, expect } from '@playwright/test';
import { simularApi, ok, fallo, iniciarSesion, responderDialogos } from '../support/api.js';
import { crearFlota, crearVehiculo, crearReserva, fechaHora } from '../support/datos.js';

const urlReserva = (inicio, fin) =>
  `/vehiculos/1/reservar?inicio=${encodeURIComponent(inicio)}&fin=${encodeURIComponent(fin)}`;

const totalEstimado = (page) => page.locator('.fs-4.fw-bold.text-warning');

test.beforeEach(async ({ page }) => {
  await iniciarSesion(page, 'cliente');
});

test.describe('Nueva reserva', () => {
  test('calcula el total por horas y bloquea la modalidad Día cuando conviene cobrar por hora', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(1)) });

    await page.goto(urlReserva(fechaHora(10, '10:00'), fechaHora(10, '13:00')));

    await expect(page.getByRole('heading', { name: 'Confirmar reserva' })).toBeVisible();
    await expect(page.getByText('3 horas × Bs 20.00')).toBeVisible();
    await expect(totalEstimado(page)).toHaveText('Bs 60.00');
    await expect(page.locator('form select')).toHaveValue('HORA');
    await expect(page.locator('form select option[value="DIA"]')).toBeDisabled();
    await expect(page.getByText(/conviene cobrar por hora/)).toBeVisible();
  });

  test('cambia automáticamente a Día cuando el cobro por hora iguala la tarifa diaria', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(1)) });

    await page.goto(urlReserva(fechaHora(10, '10:00'), fechaHora(10, '22:00')));

    await expect(page.locator('form select')).toHaveValue('DIA');
    await expect(page.getByText('1 día × Bs 200.00')).toBeVisible();
    await expect(totalEstimado(page)).toHaveText('Bs 200.00');
    await expect(page.getByText(/modalidad Día habilitada/)).toBeVisible();
  });

  test('recalcula el total al editar las fechas', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(1)) });

    await page.goto(urlReserva(fechaHora(10, '10:00'), fechaHora(10, '12:00')));
    await expect(totalEstimado(page)).toHaveText('Bs 40.00');

    await page.locator('input[type="datetime-local"]').nth(1).fill(fechaHora(10, '15:00'));

    await expect(page.getByText('5 horas × Bs 20.00')).toBeVisible();
    await expect(totalEstimado(page)).toHaveText('Bs 100.00');
  });

  test('crea la reserva y abre su detalle', async ({ page }) => {
    const api = await simularApi(page, {
      'GET /api/vehiculos': ok(crearFlota(1)),
      'POST /api/reservas': ok({ reserva: crearReserva(99) }, 201),
      'GET /api/reservas/99': ok(crearReserva(99))
    });

    await page.goto(urlReserva(fechaHora(10, '10:00'), fechaHora(10, '13:00')));
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();

    await expect(page).toHaveURL(/\/reservas\/99$/);
    await expect(page.getByRole('heading', { name: 'Reserva R-99' })).toBeVisible();
    await expect(page.getByTestId('reserva-estado')).toHaveText('Reservada');

    const cuerpo = api.de('POST /api/reservas')[0].cuerpo;
    expect(cuerpo).toMatchObject({ vehiculoId: 1, modalidad: 'HORA' });
    expect(new Date(cuerpo.fechaFin).getTime()).toBeGreaterThan(new Date(cuerpo.fechaInicio).getTime());
  });

  test('muestra el conflicto cuando el horario ya está ocupado', async ({ page }) => {
    await simularApi(page, {
      'GET /api/vehiculos': ok(crearFlota(1)),
      'POST /api/reservas': fallo(409, 'El vehículo ya está reservado en ese horario')
    });

    await page.goto(urlReserva(fechaHora(10, '10:00'), fechaHora(10, '13:00')));
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();

    await expect(page.locator('.alert-danger')).toHaveText('El vehículo ya está reservado en ese horario');
    await expect(page).toHaveURL(/\/reservar/);
  });

  test('no envía la reserva si la devolución es anterior a la recogida', async ({ page }) => {
    const api = await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(1)) });

    await page.goto(urlReserva(fechaHora(10, '13:00'), fechaHora(10, '10:00')));

    await expect(page.getByText('Elige las fechas para ver el total.')).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();

    await expect(page).toHaveURL(/\/reservar/);
    expect(api.de('POST /api/reservas')).toHaveLength(0);
  });

  test('deshabilita la confirmación de un vehículo en mantenimiento', async ({ page }) => {
    await simularApi(page, {
      'GET /api/vehiculos': ok([crearVehiculo(1, { estado: 'MANTENIMIENTO' })])
    });

    await page.goto(urlReserva(fechaHora(10, '10:00'), fechaHora(10, '13:00')));

    await expect(page.getByRole('button', { name: 'Confirmar reserva' })).toBeDisabled();
  });

  test('avisa cuando el vehículo no existe', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(1)) });

    await page.goto('/vehiculos/999/reservar');

    await expect(page.getByText('No encontramos ese vehículo.')).toBeVisible();
  });
});

test.describe('Mis reservas', () => {
  const reservasBase = () => [
    crearReserva(1),
    crearReserva(2, {
      estado: 'CONFIRMADA',
      vehiculo: crearVehiculo(2, { marca: 'Kia', modelo: 'Sportage', placa: 'SUV-07' })
    }),
    crearReserva(3, { estado: 'FINALIZADA' })
  ];

  test('muestra el estado vacío con enlace a la flota', async ({ page }) => {
    await simularApi(page, {
      'GET /api/reservas/mias': ok([]),
      'GET /api/vehiculos': ok(crearFlota(2))
    });

    await page.goto('/mis-reservas');

    await expect(page.getByText('Todavía no tienes reservas')).toBeVisible();
    await page.getByRole('link', { name: 'Ver la flota' }).click();
    await expect(page).toHaveURL(/\/vehiculos$/);
  });

  test('cuenta el total, las activas y las completadas', async ({ page }) => {
    await simularApi(page, { 'GET /api/reservas/mias': ok(reservasBase()) });

    await page.goto('/mis-reservas');

    const contador = (titulo) => page.locator('.card', { hasText: titulo }).locator('h4');
    await expect(contador('Total de reservas')).toHaveText('3');
    await expect(contador('En curso / Pendientes')).toHaveText('2');
    await expect(contador('Completadas')).toHaveText('1');
    await expect(page.locator('tbody tr')).toHaveCount(3);
  });

  test('filtra por estado', async ({ page }) => {
    await simularApi(page, { 'GET /api/reservas/mias': ok(reservasBase()) });

    await page.goto('/mis-reservas');
    await page.locator('select.form-select').selectOption('FINALIZADA');

    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByTestId('reserva-estado')).toHaveText('Finalizada');
  });

  test('busca por vehículo y avisa cuando no hay coincidencias', async ({ page }) => {
    await simularApi(page, { 'GET /api/reservas/mias': ok(reservasBase()) });

    await page.goto('/mis-reservas');
    const buscador = page.getByPlaceholder(/Buscar por vehículo/);

    await buscador.fill('sportage');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('Kia Sportage');

    await buscador.fill('zzz');
    await expect(page.getByText('No se encontraron reservas con los filtros aplicados.')).toBeVisible();

    await page.getByRole('button', { name: 'Limpiar' }).click();
    await expect(page.locator('tbody tr')).toHaveCount(3);
  });

  test('solo permite cancelar las reservas en estado Reservada', async ({ page }) => {
    await simularApi(page, { 'GET /api/reservas/mias': ok(reservasBase()) });

    await page.goto('/mis-reservas');

    const filas = page.locator('tbody tr');
    await expect(filas.nth(0).getByRole('button', { name: 'Cancelar' })).toBeEnabled();
    await expect(filas.nth(1).getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await expect(filas.nth(2).getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  test('cancela una reserva tras confirmar el diálogo', async ({ page }) => {
    const reservas = reservasBase();
    const mensajes = responderDialogos(page);
    const api = await simularApi(page, {
      'GET /api/reservas/mias': () => ok(reservas),
      'PATCH /api/reservas/1/cancelar': () => {
        reservas[0].estado = 'CANCELADA';
        return ok({ reserva: reservas[0] });
      }
    });

    await page.goto('/mis-reservas');
    await page.locator('tbody tr').nth(0).getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.locator('tbody tr').nth(0).getByTestId('reserva-estado')).toHaveText('Cancelada');
    expect(mensajes[0]).toContain('cancelar esta reserva');
    expect(api.de('PATCH /api/reservas/1/cancelar')).toHaveLength(1);
  });

  test('no cancela si se rechaza el diálogo de confirmación', async ({ page }) => {
    responderDialogos(page, false);
    const api = await simularApi(page, { 'GET /api/reservas/mias': ok(reservasBase()) });

    await page.goto('/mis-reservas');
    await page.locator('tbody tr').nth(0).getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.locator('tbody tr').nth(0).getByTestId('reserva-estado')).toHaveText('Reservada');
    expect(api.de('PATCH /api/reservas/1/cancelar')).toHaveLength(0);
  });

  test('muestra el error del servidor si la cancelación falla', async ({ page }) => {
    responderDialogos(page);
    await simularApi(page, {
      'GET /api/reservas/mias': ok(reservasBase()),
      'PATCH /api/reservas/1/cancelar': fallo(409, 'La reserva ya no se puede cancelar')
    });

    await page.goto('/mis-reservas');
    await page.locator('tbody tr').nth(0).getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.locator('.alert-danger')).toHaveText('La reserva ya no se puede cancelar');
  });

  test('el botón Ver abre el detalle de la reserva', async ({ page }) => {
    await simularApi(page, {
      'GET /api/reservas/mias': ok(reservasBase()),
      'GET /api/reservas/2': ok(reservasBase()[1])
    });

    await page.goto('/mis-reservas');
    await page.locator('tbody tr').nth(1).getByRole('link', { name: 'Ver' }).click();

    await expect(page).toHaveURL(/\/reservas\/2$/);
    await expect(page.getByRole('heading', { name: 'Reserva R-2' })).toBeVisible();
  });
});

test.describe('Detalle de la reserva (cliente)', () => {
  test('muestra el estado, el cobro y solo las acciones de cliente', async ({ page }) => {
    await simularApi(page, { 'GET /api/reservas/5': ok(crearReserva(5)) });

    await page.goto('/reservas/5');

    await expect(page.getByRole('heading', { name: 'Reserva R-5' })).toBeVisible();
    await expect(page.getByTestId('reserva-estado')).toHaveText('Reservada');
    await expect(page.locator('[data-estado="RESERVADA"]')).toHaveAttribute('data-activo', 'true');
    await expect(page.getByText('Alquiler base')).toBeVisible();
    await expect(page.getByText('(3 horas × Bs 20.00)')).toBeVisible();
    await expect(page.locator('.fs-4.fw-bold.text-warning')).toHaveText('Bs 60.00');
    await expect(page.getByRole('button', { name: 'Cancelar reserva' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmar reserva' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Volver a mis reservas' })).toBeVisible();
  });

  test('una reserva cancelada muestra el aviso y no ofrece cancelar de nuevo', async ({ page }) => {
    await simularApi(page, { 'GET /api/reservas/6': ok(crearReserva(6, { estado: 'CANCELADA' })) });

    await page.goto('/reservas/6');

    await expect(page.getByTestId('timeline-estados')).toContainText('Esta reserva fue cancelada');
    await expect(page.getByRole('button', { name: 'Cancelar reserva' })).toHaveCount(0);
  });

  test('muestra el error si la reserva no existe', async ({ page }) => {
    await simularApi(page, { 'GET /api/reservas/404': fallo(404, 'Reserva no encontrada') });

    await page.goto('/reservas/404');

    await expect(page.locator('.alert-danger')).toHaveText('Reserva no encontrada');
  });

  test('cancela desde el detalle y actualiza el estado', async ({ page }) => {
    responderDialogos(page);
    await simularApi(page, {
      'GET /api/reservas/5': ok(crearReserva(5)),
      'PATCH /api/reservas/5/cancelar': ok({ reserva: crearReserva(5, { estado: 'CANCELADA' }) })
    });

    await page.goto('/reservas/5');
    await page.getByRole('button', { name: 'Cancelar reserva' }).click();

    await expect(page.getByTestId('reserva-estado')).toHaveText('Cancelada');
  });
});
