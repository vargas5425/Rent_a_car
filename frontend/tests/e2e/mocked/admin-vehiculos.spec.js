import { test, expect } from '@playwright/test';
import { simularApi, ok, fallo, iniciarSesion, responderDialogos } from '../support/api.js';
import { crearFlota, crearVehiculo, categorias } from '../support/datos.js';

test.beforeEach(async ({ page }) => {
  await iniciarSesion(page, 'admin');
});

test.describe('Gestión de vehículos', () => {
  test('lista 5 vehículos por página con paginación', async ({ page }) => {
    await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(7)) });

    await page.goto('/dashboard/admin/vehiculos');

    await expect(page.getByRole('heading', { name: 'Gestión de Vehículos' })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(5);

    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });

  test('filtra por placa, marca o modelo y avisa cuando no hay resultados', async ({ page }) => {
    await simularApi(page, {
      'GET /api/vehiculos': ok([
        crearVehiculo(1),
        crearVehiculo(2, { marca: 'Kia', modelo: 'Sportage', placa: 'SUV-07' })
      ])
    });

    await page.goto('/dashboard/admin/vehiculos');
    const buscador = page.getByPlaceholder('Buscar por placa, marca o modelo...');

    await buscador.fill('suv-07');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('Kia Sportage');

    await buscador.fill('toyota');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('Toyota Modelo 1');

    await buscador.fill('inexistente');
    await expect(page.getByText('No se encontraron vehículos.')).toBeVisible();
  });

  test('elimina un vehículo tras confirmar', async ({ page }) => {
    const flota = crearFlota(3);
    const mensajes = responderDialogos(page);
    const api = await simularApi(page, {
      'GET /api/vehiculos': () => ok(flota),
      'DELETE /api/vehiculos/2': () => {
        flota.splice(1, 1);
        return ok({ mensaje: 'Vehículo eliminado' });
      }
    });

    await page.goto('/dashboard/admin/vehiculos');
    await page.locator('tbody tr').filter({ hasText: 'Modelo 2' }).getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.locator('tbody')).not.toContainText('Modelo 2');
    expect(mensajes[0]).toContain('eliminar este vehículo');
    expect(api.de('DELETE /api/vehiculos/2')).toHaveLength(1);
  });

  test('no elimina si se rechaza la confirmación', async ({ page }) => {
    responderDialogos(page, false);
    const api = await simularApi(page, { 'GET /api/vehiculos': ok(crearFlota(3)) });

    await page.goto('/dashboard/admin/vehiculos');
    await page.locator('tbody tr').first().getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.locator('tbody tr')).toHaveCount(3);
    expect(api.todas.filter((p) => p.clave.startsWith('DELETE'))).toHaveLength(0);
  });

  test('avisa si la eliminación falla', async ({ page }) => {
    const mensajes = responderDialogos(page);
    await simularApi(page, {
      'GET /api/vehiculos': ok(crearFlota(2)),
      'DELETE /api/vehiculos/1': fallo(409, 'Tiene reservas asociadas')
    });

    await page.goto('/dashboard/admin/vehiculos');
    await page.locator('tbody tr').first().getByRole('button', { name: 'Eliminar' }).click();

    await expect.poll(() => mensajes.some((m) => m.includes('Error al eliminar'))).toBe(true);
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });

  test('los botones Nuevo y Editar llevan a sus formularios', async ({ page }) => {
    await simularApi(page, {
      'GET /api/vehiculos': ok(crearFlota(2)),
      'GET /api/categorias': ok(categorias)
    });

    await page.goto('/dashboard/admin/vehiculos');
    await page.getByRole('link', { name: '+ Nuevo Vehículo' }).click();
    await expect(page).toHaveURL(/\/vehiculos\/crear$/);

    await page.goBack();
    await page.locator('tbody tr').first().getByRole('link', { name: 'Editar' }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/vehiculos\/1\/editar$/);
  });
});

test.describe('Formulario de vehículo', () => {
  test('registra un vehículo nuevo y vuelve al listado', async ({ page }) => {
    const mensajes = responderDialogos(page);
    const api = await simularApi(page, {
      'GET /api/categorias': ok(categorias),
      'GET /api/vehiculos': ok(crearFlota(1)),
      'POST /api/vehiculos': ok({ id: 10 }, 201)
    });

    await page.goto('/vehiculos/crear');
    await expect(page.getByRole('heading', { name: 'Registrar Nuevo Vehículo' })).toBeVisible();

    await page.fill('input[name="placa"]', 'NEW-99');
    await page.fill('input[name="marca"]', 'Nissan');
    await page.fill('input[name="modelo"]', 'Kicks');
    await page.fill('input[name="anio"]', '2024');
    await page.selectOption('select[name="categoria_id"]', '2');
    await page.selectOption('select[name="estado"]', 'DISPONIBLE');
    await page.fill('input[name="kilometraje_actual"]', '1200');
    await page.getByRole('button', { name: 'Registrar Vehículo' }).click();

    await expect(page).toHaveURL(/\/dashboard\/admin\/vehiculos$/);
    expect(mensajes[0]).toContain('creado exitosamente');
    expect(api.de('POST /api/vehiculos')[0].cuerpo).toMatchObject({
      placa: 'NEW-99',
      marca: 'Nissan',
      modelo: 'Kicks',
      categoria_id: '2',
      estado: 'DISPONIBLE'
    });
  });

  test('exige los campos obligatorios', async ({ page }) => {
    const api = await simularApi(page, { 'GET /api/categorias': ok(categorias) });

    await page.goto('/vehiculos/crear');
    await page.getByRole('button', { name: 'Registrar Vehículo' }).click();

    await expect(page).toHaveURL(/\/vehiculos\/crear$/);
    expect(api.de('POST /api/vehiculos')).toHaveLength(0);
  });

  test('muestra el error del servidor cuando la placa ya existe', async ({ page }) => {
    await simularApi(page, {
      'GET /api/categorias': ok(categorias),
      'POST /api/vehiculos': fallo(409, 'La placa ya existe')
    });

    await page.goto('/vehiculos/crear');
    await page.fill('input[name="placa"]', 'SUV-01');
    await page.fill('input[name="marca"]', 'Toyota');
    await page.fill('input[name="modelo"]', 'RAV4');
    await page.getByRole('button', { name: 'Registrar Vehículo' }).click();

    await expect(page.locator('.alert-danger')).toHaveText('La placa ya existe');
    await expect(page).toHaveURL(/\/vehiculos\/crear$/);
  });

  test('Cancelar vuelve al listado sin guardar', async ({ page }) => {
    const api = await simularApi(page, {
      'GET /api/categorias': ok(categorias),
      'GET /api/vehiculos': ok(crearFlota(1))
    });

    await page.goto('/vehiculos/crear');
    await page.getByRole('button', { name: 'Cancelar' }).click();

    await expect(page).toHaveURL(/\/dashboard\/admin\/vehiculos$/);
    expect(api.de('POST /api/vehiculos')).toHaveLength(0);
  });

  test('edita un vehículo existente precargando sus datos', async ({ page }) => {
    const mensajes = responderDialogos(page);
    const api = await simularApi(page, {
      'GET /api/categorias': ok(categorias),
      'GET /api/vehiculos': ok(crearFlota(2)),
      'PUT /api/vehiculos/1': ok({ id: 1 })
    });

    await page.goto('/dashboard/admin/vehiculos/1/editar');

    await expect(page.getByRole('heading', { name: 'Editar Vehículo' })).toBeVisible();
    await expect(page.locator('input[name="placa"]')).toHaveValue('PLA-01');
    await expect(page.locator('input[name="marca"]')).toHaveValue('Toyota');

    await page.fill('input[name="marca"]', 'Mazda');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    await expect(page).toHaveURL(/\/dashboard\/admin\/vehiculos$/);
    expect(mensajes[0]).toContain('actualizado exitosamente');
    expect(api.de('PUT /api/vehiculos/1')[0].cuerpo).toMatchObject({ id: 1, marca: 'Mazda', placa: 'PLA-01' });
  });

  test('avisa cuando el vehículo a editar no existe', async ({ page }) => {
    await simularApi(page, {
      'GET /api/categorias': ok(categorias),
      'GET /api/vehiculos': ok(crearFlota(2))
    });

    await page.goto('/dashboard/admin/vehiculos/999/editar');

    await expect(page.locator('.alert-danger')).toHaveText('Vehículo no encontrado');
  });
});
