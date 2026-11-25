import { test, expect } from '@playwright/test';
import {
  EMPLEADO,
  crearCliente,
  crearVehiculo,
  eliminarVehiculo,
  crearReserva,
  sumarHoras
} from './helpers/datos.js';
import { iniciarSesion, aceptarDialogos } from './helpers/sesion.js';

test.describe('Flujo completo de alquiler', () => {
  let cliente;
  let vehiculo;

  test.beforeAll(async ({ request }) => {
    cliente = await crearCliente(request);
    vehiculo = await crearVehiculo(request);
  });

  test.afterAll(async ({ request }) => {
    await eliminarVehiculo(request, vehiculo);
  });

  test('confirmar, entregar, devolver, cobrar y finalizar', async ({ page, request }) => {
    test.setTimeout(120000);
    const inicio = new Date(Date.now() + 5000);
    const reserva = await crearReserva(request, cliente, vehiculo, inicio, sumarHoras(inicio, 2));
    const mensajes = aceptarDialogos(page);
    const filaReserva = page.locator('tbody tr').filter({
      has: page.locator(`a[href="/reservas/${reserva.id}"]`)
    });
    const filaAlquiler = page.locator('tbody tr').filter({ hasText: vehiculo.placa });
    let alquilerId;

    await iniciarSesion(page, EMPLEADO);

    await test.step('confirmar la reserva y crear el alquiler', async () => {
      await page.goto('/dashboard/reservas');
      await filaReserva.getByRole('button', { name: 'Confirmar' }).click();
      await filaReserva.getByRole('button', { name: 'Crear alquiler' }).click();
      await expect.poll(() => mensajes.join(' ')).toContain('creado correctamente');
    });

    await test.step('registrar la entrega', async () => {
      await page.waitForTimeout(Math.max(0, inicio.getTime() + 2000 - Date.now()));
      await page.goto('/dashboard/alquileres-pendientes');
      await filaAlquiler.getByRole('button', { name: 'Registrar entrega' }).click();
      await expect(page).toHaveURL(/\/alquileres\/\d+\/entrega$/);
      alquilerId = page.url().match(/alquileres\/(\d+)\//)[1];

      await page.locator('#kilometrajeInicial').fill('1000');
      await page.locator('#combustibleInicial').fill('100');
      await page.locator('#observacionesEntrega').fill('Entrega E2E sin daños');
      await page.getByRole('button', { name: 'Registrar entrega' }).click();

      await expect(page).toHaveURL(/\/dashboard\/alquileres-activos$/);
      await expect(filaAlquiler).toContainText('ACTIVO');
    });

    await test.step('registrar la devolución con cargos', async () => {
      await filaAlquiler.getByRole('button', { name: 'Registrar devolución' }).click();

      await page.locator('input[name="kilometraje_final"]').fill('1150');
      await page.locator('input[name="combustible_final"]').fill('75');
      await page.locator('textarea[name="observaciones_devolucion"]').fill('Rayón en la puerta');
      await page.getByPlaceholder('Ej. Rayón en puerta').fill('Rayón en puerta');
      await page.getByPlaceholder('0.00').fill('25');
      await page.getByRole('button', { name: 'Agregar' }).click();
      await page.getByRole('button', { name: 'Confirmar devolución y calcular total' }).click();

      await expect(page.getByText('Devolución registrada correctamente')).toBeVisible();
      await expect(page.getByText('Estado del vehículo: DISPONIBLE')).toBeVisible();
      await expect(page.getByText('Combustible faltante: 25% (Cargo: Bs 50.00)')).toBeVisible();
      await expect(page.getByText('Rayón en puerta: Bs 25.00')).toBeVisible();
      await expect(page.getByText('Bs 155.00')).toBeVisible();
    });

    await test.step('pagar el saldo en dos partes sin excederlo', async () => {
      await page.goto(`/dashboard/alquileres/${alquilerId}/pagos`);
      const monto = page.locator('form input[type="number"]');
      const pagar = page.getByRole('button', { name: 'Registrar pago' });
      await expect(monto).toHaveValue('155.00');

      await monto.fill('100');
      await pagar.click();
      await expect(page.getByText('Pagos registrados (1)')).toBeVisible();
      await expect(monto).toHaveValue('55.00');

      await monto.fill('100');
      await pagar.click();
      await expect(page.getByText('Pagos registrados (1)')).toBeVisible();

      await monto.fill('55');
      await pagar.click();
      await expect(page.getByText('Pagos registrados (2)')).toBeVisible();
      await expect(page.getByText('Este alquiler no tiene saldo pendiente por pagar.')).toBeVisible();
    });

    await test.step('finalizar la reserva y verla en el historial', async () => {
      await page.goto('/dashboard/reservas');
      await filaReserva.getByRole('button', { name: 'Finalizar' }).click();
      await expect(filaReserva.getByTestId('reserva-estado')).toHaveText('Finalizada');

      await page.goto('/dashboard/alquileres-historial');
      await expect(page.getByText(vehiculo.placa)).toBeVisible();
    });
  });
});
