import { test, expect } from '@playwright/test';
import { simularApi, ok, fallo, iniciarSesion } from '../support/api.js';
import { crearAlquiler } from '../support/datos.js';

test.beforeEach(async ({ page }) => {
  await iniciarSesion(page, 'empleado');
});

test.describe('Alquileres pendientes', () => {
  test('lista los alquileres pendientes y abre el registro de entrega', async ({ page }) => {
    await simularApi(page, {
      'GET /api/alquileres/pendientes': ok({ alquileres: [crearAlquiler(7), crearAlquiler(8, { reserva_id: 3 })] })
    });

    await page.goto('/dashboard/alquileres-pendientes');

    await expect(page.getByRole('heading', { name: 'Alquileres pendientes', exact: true })).toBeVisible();
    await expect(page.locator('.card', { hasText: 'Total de alquileres pendientes' }).locator('h2')).toHaveText('2');
    await expect(page.locator('tbody tr')).toHaveCount(2);

    const primera = page.locator('tbody tr').nth(0);
    await expect(primera).toContainText('A-7');
    await expect(primera).toContainText('Reserva: R-2');
    await expect(primera).toContainText('Ana Rojas');
    await expect(primera).toContainText('Toyota Modelo 1');
    await expect(primera).toContainText('Bs 200.00');

    await primera.getByRole('button', { name: 'Registrar entrega' }).click();
    await expect(page).toHaveURL(/\/dashboard\/alquileres\/7\/entrega$/);
  });

  test('muestra el estado vacío', async ({ page }) => {
    await simularApi(page, { 'GET /api/alquileres/pendientes': ok({ alquileres: [] }) });

    await page.goto('/dashboard/alquileres-pendientes');

    await expect(page.getByText('No hay alquileres pendientes de entrega.')).toBeVisible();
  });

  test('muestra el error cuando la API falla', async ({ page }) => {
    await simularApi(page, { 'GET /api/alquileres/pendientes': fallo(500, 'Error interno del servidor') });

    await page.goto('/dashboard/alquileres-pendientes');

    await expect(page.locator('.alert-danger')).toHaveText('Error interno del servidor');
  });

  test('Actualizar lista vuelve a consultar la API', async ({ page }) => {
    const api = await simularApi(page, {
      'GET /api/alquileres/pendientes': ok({ alquileres: [crearAlquiler(7)] })
    });

    await page.goto('/dashboard/alquileres-pendientes');
    await expect(page.locator('tbody tr')).toHaveCount(1);
        await page.waitForLoadState('networkidle');
    const antes = api.de('GET /api/alquileres/pendientes').length;

    await page.getByRole('button', { name: 'Actualizar lista' }).click();

    await expect.poll(() => api.de('GET /api/alquileres/pendientes').length).toBe(antes + 1);
  });
});

test.describe('Registro de entrega', () => {
  const llenarEntrega = async (page, { km, combustible, deposito, observaciones }) => {
    await page.getByLabel('Kilometraje inicial (km)').fill(km);
    await page.getByLabel('Combustible inicial (%)').fill(combustible);
    if (deposito !== undefined) await page.getByLabel(/Depósito \/ Garantía/).fill(deposito);
    if (observaciones !== undefined) await page.getByLabel(/Observaciones del estado/).fill(observaciones);
  };

  test('registra la entrega y pasa a alquileres activos', async ({ page }) => {
    const api = await simularApi(page, {
      'PATCH /api/alquileres/7/entrega': ok({ alquiler: crearAlquiler(7, { estado: 'ACTIVO' }) }),
      'GET /api/alquileres/activos': ok({
        alquileres: [crearAlquiler(7, { estado: 'ACTIVO', fecha_entrega: new Date().toISOString() })]
      })
    });

    await page.goto('/dashboard/alquileres/7/entrega');
    await expect(page.getByRole('heading', { name: 'Registrar entrega del vehículo' })).toBeVisible();
    await expect(page.getByText('Alquiler #7')).toContainText('Empleado Demo');

    await llenarEntrega(page, { km: '25000', combustible: '100', deposito: '500', observaciones: 'Rayón leve en puerta' });
    await page.getByRole('button', { name: 'Registrar entrega' }).click();

    await expect(page).toHaveURL(/\/dashboard\/alquileres-activos$/);
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('#7');
    expect(api.de('PATCH /api/alquileres/7/entrega')[0].cuerpo).toEqual({
      kilometraje_inicial: 25000,
      combustible_inicial: 100,
      deposito_garantia: 500,
      observaciones_entrega: 'Rayón leve en puerta'
    });
  });

  test('el depósito es opcional y se envía como cero', async ({ page }) => {
    const api = await simularApi(page, {
      'PATCH /api/alquileres/7/entrega': ok({ alquiler: crearAlquiler(7, { estado: 'ACTIVO' }) }),
      'GET /api/alquileres/activos': ok({ alquileres: [] })
    });

    await page.goto('/dashboard/alquileres/7/entrega');
    await llenarEntrega(page, { km: '100', combustible: '80' });
    await page.getByRole('button', { name: 'Registrar entrega' }).click();

    await expect(page).toHaveURL(/\/dashboard\/alquileres-activos$/);
    expect(api.de('PATCH /api/alquileres/7/entrega')[0].cuerpo).toMatchObject({
      deposito_garantia: 0,
      observaciones_entrega: ''
    });
  });

  test('no envía el formulario con un combustible mayor a 100', async ({ page }) => {
    const api = await simularApi(page, {});

    await page.goto('/dashboard/alquileres/7/entrega');
    await llenarEntrega(page, { km: '100', combustible: '150' });
    await page.getByRole('button', { name: 'Registrar entrega' }).click();

    await expect(page).toHaveURL(/\/entrega$/);
    expect(api.de('PATCH /api/alquileres/7/entrega')).toHaveLength(0);
  });

  test('no envía el formulario sin kilometraje ni combustible', async ({ page }) => {
    const api = await simularApi(page, {});

    await page.goto('/dashboard/alquileres/7/entrega');
    await page.getByRole('button', { name: 'Registrar entrega' }).click();

    await expect(page).toHaveURL(/\/entrega$/);
    expect(api.de('PATCH /api/alquileres/7/entrega')).toHaveLength(0);
  });

  test('muestra el error del servidor', async ({ page }) => {
    await simularApi(page, {
      'PATCH /api/alquileres/7/entrega': fallo(409, 'El alquiler ya fue entregado')
    });

    await page.goto('/dashboard/alquileres/7/entrega');
    await llenarEntrega(page, { km: '100', combustible: '80' });
    await page.getByRole('button', { name: 'Registrar entrega' }).click();

    await expect(page.locator('.alert-danger')).toHaveText('El alquiler ya fue entregado');
    await expect(page).toHaveURL(/\/entrega$/);
  });

  test('Cancelar vuelve al dashboard', async ({ page }) => {
    await simularApi(page, {});

    await page.goto('/dashboard/alquileres/7/entrega');
    await page.getByRole('button', { name: 'Cancelar' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe('Alquileres activos y devolución', () => {
  const alquilerActivo = () =>
    crearAlquiler(7, {
      estado: 'ACTIVO',
      fecha_entrega: new Date().toISOString(),
      kilometraje_inicial: 25000,
      combustible_inicial: 100,
      deposito_garantia: 0
    });

  test('lista los alquileres activos con sus acciones', async ({ page }) => {
    await simularApi(page, { 'GET /api/alquileres/activos': ok({ alquileres: [alquilerActivo()] }) });

    await page.goto('/dashboard/alquileres-activos');

    await expect(page.getByRole('heading', { name: 'Alquileres activos', exact: true })).toBeVisible();
    const fila = page.locator('tbody tr');
    await expect(fila).toContainText('Toyota Modelo 1 (PLA-01)');
    await expect(fila.locator('.badge')).toHaveText('ACTIVO');

    await fila.getByRole('button', { name: 'Registrar pago' }).click();
    await expect(page).toHaveURL(/\/dashboard\/alquileres\/7\/pagos$/);
  });

  test('muestra el estado vacío', async ({ page }) => {
    await simularApi(page, { 'GET /api/alquileres/activos': ok({ alquileres: [] }) });

    await page.goto('/dashboard/alquileres-activos');

    await expect(page.getByText('No hay alquileres activos actualmente.')).toBeVisible();
  });

  test('registra la devolución con un cargo manual y muestra el resumen', async ({ page }) => {
    const api = await simularApi(page, {
      'GET /api/alquileres/activos': ok({ alquileres: [alquilerActivo()] }),
      'GET /api/alquileres/7': ok({ alquiler: alquilerActivo() }),
      'PATCH /api/alquileres/7/devolucion': ok({
        mensaje: 'Devolución registrada correctamente.',
        vehiculo: { estado: 'DISPONIBLE' },
        retraso: { horas_retraso: 0, monto: 0 },
        combustible: { combustible_faltante: 20, monto: 40 },
        cargos_generados: [{ id: 1, tipo: 'DANIO', descripcion: 'Rayón en puerta', monto: 150 }],
        monto_base: 200,
        total_cargos: 190,
        deposito_garantia: 0,
        saldo_a_pagar: 390
      })
    });

    await page.goto('/dashboard/alquileres-activos');
    await page.getByRole('button', { name: 'Registrar devolución' }).click();

    await expect(page).toHaveURL(/\/dashboard\/alquileres\/7\/devolucion$/);
    await expect(page.getByRole('heading', { name: 'Registrar devolución', exact: true })).toBeVisible();
    await expect(page.locator('input[name="kilometraje_final"]')).toHaveValue('25000');
    await expect(page.locator('input[name="combustible_final"]')).toHaveValue('100');

    await page.fill('input[name="kilometraje_final"]', '25300');
    await page.fill('input[name="combustible_final"]', '80');
    await page.fill('textarea[name="observaciones_devolucion"]', 'Todo en orden salvo un rayón');

    await page.locator('select.form-select').selectOption('DANIO');
    await page.getByPlaceholder('Ej. Rayón en puerta').fill('Rayón en puerta');
    await page.getByPlaceholder('0.00').fill('150');
    await page.getByRole('button', { name: 'Agregar' }).click();
    await expect(page.locator('.list-group-item')).toContainText('Rayón en puerta');
    await expect(page.locator('.list-group-item')).toContainText('Bs 150.00');

    await page.getByRole('button', { name: 'Confirmar devolución y calcular total' }).click();

    await expect(page.locator('.alert-success')).toHaveText('Devolución registrada correctamente.');
    await expect(page.getByText('Saldo Final a Pagar:')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bs 390.00' })).toBeVisible();
    expect(api.de('PATCH /api/alquileres/7/devolucion')[0].cuerpo).toMatchObject({
      kilometraje_final: 25300,
      combustible_final: 80,
      requiere_mantenimiento: false,
      observaciones_devolucion: 'Todo en orden salvo un rayón',
      cargos_manuales: [{ tipo: 'DANIO', descripcion: 'Rayón en puerta', monto: 150 }]
    });
  });

  test('permite quitar un cargo manual antes de confirmar', async ({ page }) => {
    await simularApi(page, { 'GET /api/alquileres/7': ok({ alquiler: alquilerActivo() }) });

    await page.goto('/dashboard/alquileres/7/devolucion');
    await page.getByPlaceholder('Ej. Rayón en puerta').fill('Limpieza profunda');
    await page.getByPlaceholder('0.00').fill('60');
    await page.getByRole('button', { name: 'Agregar' }).click();
    await expect(page.locator('.list-group-item')).toHaveCount(1);

    await page.getByRole('button', { name: 'X', exact: true }).click();

    await expect(page.locator('.list-group-item')).toHaveCount(0);
  });

  test('rechaza un kilometraje final menor al inicial sin llamar a la API', async ({ page }) => {
    const api = await simularApi(page, { 'GET /api/alquileres/7': ok({ alquiler: alquilerActivo() }) });

    await page.goto('/dashboard/alquileres/7/devolucion');
    await page.fill('input[name="kilometraje_final"]', '100');
    await page.fill('textarea[name="observaciones_devolucion"]', 'Observación');
    await page.getByRole('button', { name: 'Confirmar devolución y calcular total' }).click();

    await expect(page).toHaveURL(/\/devolucion$/);
    expect(api.de('PATCH /api/alquileres/7/devolucion')).toHaveLength(0);
  });

  test('avisa cuando el alquiler no está activo', async ({ page }) => {
    await simularApi(page, {
      'GET /api/alquileres/7': ok({ alquiler: crearAlquiler(7, { estado: 'FINALIZADO' }) })
    });

    await page.goto('/dashboard/alquileres/7/devolucion');

    await expect(page.locator('.alert-danger')).toHaveText('Este alquiler no está activo actualmente.');
  });
});
