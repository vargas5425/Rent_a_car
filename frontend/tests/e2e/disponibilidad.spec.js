import { test, expect } from '@playwright/test';
import {
  PRECIO_DIA,
  crearCliente,
  crearVehiculo,
  eliminarVehiculo,
  crearReserva,
  fechaFutura,
  fechaHora,
  soloFecha,
  soloHora,
  sumarHoras
} from './helpers/datos.js';
import { iniciarSesion } from './helpers/sesion.js';

async function llenarBusqueda(page, inicio, fin) {
  const formulario = page.locator('form');
  await formulario.locator('input[type="date"]').nth(0).fill(soloFecha(inicio));
  await formulario.locator('input[type="time"]').nth(0).fill(soloHora(inicio));
  await formulario.locator('input[type="date"]').nth(1).fill(soloFecha(fin));
  await formulario.locator('input[type="time"]').nth(1).fill(soloHora(fin));
  await page.getByRole('button', { name: 'Buscar' }).click();
}

async function apareceEnLaFlota(page, modelo) {
  await expect(page.getByText('vehículo(s) disponible(s)')).toBeVisible();
  const siguiente = page.getByRole('button', { name: 'Siguiente' });

  while (true) {
    if (await page.getByRole('heading', { name: `Prueba ${modelo}` }).count()) return true;
    if (!(await siguiente.count())) return false;
    if (await siguiente.locator('..').evaluate((li) => li.classList.contains('disabled'))) return false;
    await siguiente.click();
  }
}

test.describe('Disponibilidad y solapamientos', () => {
  let cliente;
  let vehiculo;

  test.beforeAll(async ({ request }) => {
    cliente = await crearCliente(request);
    vehiculo = await crearVehiculo(request);
  });

  test.afterAll(async ({ request }) => {
    await eliminarVehiculo(request, vehiculo);
  });

  test('valida las fechas del buscador', async ({ page }) => {
    await iniciarSesion(page, cliente);
    const futuro = fechaFutura(5);
    const error = page.locator('form .alert-danger');

    await llenarBusqueda(page, futuro, sumarHoras(futuro, -2));
    await expect(error).toHaveText('La fecha de devolución debe ser posterior a la de recogida.');

    await llenarBusqueda(page, fechaFutura(-2), futuro);
    await expect(error).toHaveText('La fecha de recogida no puede estar en el pasado.');

    await page.locator('form input[type="date"]').nth(0).fill('');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(error).toHaveText('Elige la fecha de inicio y la de fin.');
  });

  test('un vehículo reservado se oculta en ese horario y vuelve en el horario contiguo', async ({ page, request }) => {
    const inicio = fechaFutura(20, 10);
    const fin = sumarHoras(inicio, 4);
    await crearReserva(request, cliente, vehiculo, inicio, fin);
    await iniciarSesion(page, cliente);

    await llenarBusqueda(page, sumarHoras(inicio, 2), sumarHoras(fin, 2));
    expect(await apareceEnLaFlota(page, vehiculo.modelo)).toBe(false);

    await page.reload();
    await llenarBusqueda(page, fin, sumarHoras(fin, 4));
    expect(await apareceEnLaFlota(page, vehiculo.modelo)).toBe(true);
  });

  test('rechaza una reserva que se solapa con otra', async ({ page, request }) => {
    const inicio = fechaFutura(25, 10);
    await crearReserva(request, cliente, vehiculo, inicio, sumarHoras(inicio, 4));
    await iniciarSesion(page, cliente);
    await page.goto(`/vehiculos/${vehiculo.id}/reservar`);

    await page.locator('input[type="datetime-local"]').nth(0).fill(fechaHora(sumarHoras(inicio, 2)));
    await page.locator('input[type="datetime-local"]').nth(1).fill(fechaHora(sumarHoras(inicio, 5)));
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();

    await expect(page.locator('form .alert-danger')).toContainText('ya está reservado');
    await expect(page).toHaveURL(/\/reservar$/);
  });

  test('habilita el cobro por día cuando las horas superan la tarifa diaria', async ({ page }) => {
    await iniciarSesion(page, cliente);
    await page.goto(`/vehiculos/${vehiculo.id}/reservar`);
    const inicio = fechaFutura(30, 8);

    await page.locator('input[type="datetime-local"]').nth(0).fill(fechaHora(inicio));
    await page.locator('input[type="datetime-local"]').nth(1).fill(fechaHora(sumarHoras(inicio, 10)));

    await expect(page.locator('form select')).toHaveValue('DIA');
    await expect(page.getByText(`Bs ${PRECIO_DIA}.00`, { exact: true })).toBeVisible();
  });
});
