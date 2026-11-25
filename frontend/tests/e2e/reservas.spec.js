import { test, expect } from '@playwright/test';
import {
  EMPLEADO,
  crearCliente,
  crearVehiculo,
  eliminarVehiculo,
  crearReserva,
  cabeceras,
  fechaFutura,
  fechaHora,
  sumarHoras
} from './helpers/datos.js';
import { iniciarSesion, aceptarDialogos } from './helpers/sesion.js';

test.describe('Reservas', () => {
  let cliente;
  let vehiculo;

  test.beforeAll(async ({ request }) => {
    cliente = await crearCliente(request);
    vehiculo = await crearVehiculo(request);
  });

  test.afterAll(async ({ request }) => {
    await eliminarVehiculo(request, vehiculo);
  });

  test('E2E 01: el cliente crea una reserva y la ve en Mis reservas', async ({ page }) => {
    const inicio = fechaFutura(10);
    await iniciarSesion(page, cliente);
    await page.goto(`/vehiculos/${vehiculo.id}/reservar`);

    await page.locator('input[type="datetime-local"]').nth(0).fill(fechaHora(inicio));
    await page.locator('input[type="datetime-local"]').nth(1).fill(fechaHora(sumarHoras(inicio, 2)));
    await expect(page.getByText('2 horas × Bs 40.00')).toBeVisible();
    await expect(page.getByText('Bs 80.00', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();

    await expect(page).toHaveURL(/\/reservas\/\d+$/);
    await expect(page.getByTestId('reserva-estado')).toHaveText('Reservada');
    await expect(page.locator('[data-estado="RESERVADA"]')).toHaveAttribute('data-activo', 'true');

    await page.goto('/mis-reservas');
    const fila = page.locator('tbody tr').filter({ hasText: vehiculo.modelo });
    await expect(fila).toContainText('Bs 80.00');
    await expect(fila.getByTestId('reserva-estado')).toHaveText('Reservada');
  });

  test('E2E 02: el cliente cancela su reserva', async ({ page, request }) => {
    const inicio = fechaFutura(12);
    const reserva = await crearReserva(request, cliente, vehiculo, inicio, sumarHoras(inicio, 2));
    aceptarDialogos(page);

    await iniciarSesion(page, cliente);
    await page.goto(`/reservas/${reserva.id}`);
    await page.getByRole('button', { name: 'Cancelar reserva' }).click();

    await expect(page.getByTestId('reserva-estado')).toHaveText('Cancelada');
    await expect(page.getByTestId('timeline-estados')).toContainText('fue cancelada');
    await expect(page.getByRole('button', { name: 'Cancelar reserva' })).toHaveCount(0);
  });

  test('E2E 03: el empleado confirma una reserva', async ({ page, request }) => {
    const inicio = fechaFutura(14);
    const reserva = await crearReserva(request, cliente, vehiculo, inicio, sumarHoras(inicio, 2));

    await iniciarSesion(page, EMPLEADO);
    await page.goto('/dashboard/reservas');
    const fila = page.locator('tbody tr').filter({
      has: page.locator(`a[href="/reservas/${reserva.id}"]`)
    });
    await fila.getByRole('button', { name: 'Confirmar' }).click();

    await expect(fila.getByTestId('reserva-estado')).toHaveText('Confirmada');
    await expect(fila.getByRole('button', { name: 'Crear alquiler' })).toBeVisible();
  });

  test('un cliente no ve reservas ajenas ni puede confirmar', async ({ page, request }) => {
    const inicio = fechaFutura(16);
    const reserva = await crearReserva(request, cliente, vehiculo, inicio, sumarHoras(inicio, 2));
    const intruso = await crearCliente(request);

    const confirmar = await request.patch(`/api/reservas/${reserva.id}/confirmar`, {
      headers: cabeceras(cliente.token)
    });
    expect(confirmar.status()).toBe(403);

    await iniciarSesion(page, intruso);
    await page.goto(`/reservas/${reserva.id}`);
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.getByTestId('reserva-estado')).toHaveCount(0);
  });
});
