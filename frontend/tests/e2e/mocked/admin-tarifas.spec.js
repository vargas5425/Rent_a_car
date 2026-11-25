import { test, expect } from '@playwright/test';
import { simularApi, ok, fallo, iniciarSesion, responderDialogos } from '../support/api.js';
import { crearFlota, categorias } from '../support/datos.js';

const tarifasIniciales = () => [
  { id: 1, categoria_id: 1, vehiculo_id: null, modalidad: 'HORA', precio: '20.00' },
  { id: 2, categoria_id: null, vehiculo_id: 1, modalidad: 'DIA', precio: '180.00' }
];

const apiBase = (tarifas) => ({
  'GET /api/tarifas': () => ok(tarifas),
  'GET /api/categorias': ok(categorias),
  'GET /api/vehiculos': ok(crearFlota(2))
});

test.beforeEach(async ({ page }) => {
  await iniciarSesion(page, 'admin');
});

test.describe('Gestión de tarifas', () => {
  test('lista las tarifas por categoría y por vehículo', async ({ page }) => {
    await simularApi(page, apiBase(tarifasIniciales()));

    await page.goto('/admin/tarifas');

    await expect(page.getByRole('heading', { name: 'Gestión de Tarifas' })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.locator('tbody tr').nth(0)).toContainText('Categoría: SUV');
    await expect(page.locator('tbody tr').nth(0)).toContainText('HORA');
    await expect(page.locator('tbody tr').nth(1)).toContainText('Vehículo: Toyota Modelo 1 (PLA-01)');
    await expect(page.locator('tbody tr').nth(1)).toContainText('180.00');
  });

  test('muestra el estado vacío cuando no hay tarifas', async ({ page }) => {
    await simularApi(page, apiBase([]));

    await page.goto('/admin/tarifas');

    await expect(page.getByText('No hay tarifas registradas')).toBeVisible();
  });

  test('crea una tarifa para una categoría', async ({ page }) => {
    const tarifas = tarifasIniciales();
    const api = await simularApi(page, {
      ...apiBase(tarifas),
      'POST /api/tarifas': (peticion) => {
        const cuerpo = peticion.postDataJSON();
        tarifas.push({ id: 3, vehiculo_id: null, ...cuerpo });
        return ok({ id: 3 }, 201);
      }
    });

    await page.goto('/admin/tarifas');
    const selects = page.locator('form select');
    await selects.nth(1).selectOption('2');
    await selects.nth(2).selectOption('SEMANA');
    await page.locator('form input[type="number"]').fill('900');
    await page.getByRole('button', { name: 'Guardar Tarifa' }).click();

    await expect(page.locator('.alert-info')).toHaveText('¡Tarifa creada con éxito!');
    await expect(page.locator('tbody tr')).toHaveCount(3);
    await expect(page.locator('tbody tr').nth(2)).toContainText('Categoría: Sedán');
    expect(api.de('POST /api/tarifas')[0].cuerpo).toEqual({
      modalidad: 'SEMANA',
      precio: 900,
      categoria_id: 2,
      vehiculo_id: null
    });
  });

  test('crea una tarifa para un vehículo específico', async ({ page }) => {
    const api = await simularApi(page, {
      ...apiBase(tarifasIniciales()),
      'POST /api/tarifas': ok({ id: 4 }, 201)
    });

    await page.goto('/admin/tarifas');
    const selects = page.locator('form select');
    await selects.nth(0).selectOption('vehiculo');
    await expect(page.getByText('Seleccione vehículo')).toBeAttached();
    await selects.nth(1).selectOption('2');
    await selects.nth(2).selectOption('HORA');
    await page.locator('form input[type="number"]').fill('35');
    await page.getByRole('button', { name: 'Guardar Tarifa' }).click();

    await expect(page.locator('.alert-info')).toHaveText('¡Tarifa creada con éxito!');
    expect(api.de('POST /api/tarifas')[0].cuerpo).toEqual({
      modalidad: 'HORA',
      precio: 35,
      categoria_id: null,
      vehiculo_id: 2
    });
  });

  test('exige elegir categoría y precio antes de guardar', async ({ page }) => {
    const api = await simularApi(page, apiBase(tarifasIniciales()));

    await page.goto('/admin/tarifas');
    await page.getByRole('button', { name: 'Guardar Tarifa' }).click();

    expect(api.de('POST /api/tarifas')).toHaveLength(0);
    await expect(page.locator('.alert-info')).toHaveCount(0);
  });

  test('muestra el error del servidor al crear', async ({ page }) => {
    await simularApi(page, {
      ...apiBase(tarifasIniciales()),
      'POST /api/tarifas': fallo(409, 'Ya existe una tarifa para esa modalidad')
    });

    await page.goto('/admin/tarifas');
    const selects = page.locator('form select');
    await selects.nth(1).selectOption('1');
    await page.locator('form input[type="number"]').fill('20');
    await page.getByRole('button', { name: 'Guardar Tarifa' }).click();

    await expect(page.locator('.alert-info')).toHaveText('Error: Ya existe una tarifa para esa modalidad');
  });

  test('Cancelar limpia el formulario', async ({ page }) => {
    await simularApi(page, apiBase(tarifasIniciales()));

    await page.goto('/admin/tarifas');
    await page.locator('form input[type="number"]').fill('77');
    await page.locator('form').getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.locator('form input[type="number"]')).toHaveValue('');
  });

  test('edita el precio en línea', async ({ page }) => {
    const tarifas = tarifasIniciales();
    const api = await simularApi(page, {
      ...apiBase(tarifas),
      'PUT /api/tarifas/1': (peticion) => {
        tarifas[0].precio = String(peticion.postDataJSON().precio);
        return ok({ id: 1 });
      }
    });

    await page.goto('/admin/tarifas');
    const fila = page.locator('tbody tr').nth(0);
    await fila.getByRole('button', { name: 'Editar' }).click();

    const campo = fila.locator('input[type="number"]');
    await expect(campo).toHaveValue('20.00');
    await campo.fill('25');
    await fila.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.locator('tbody tr').nth(0).locator('strong')).toHaveText('25');
    expect(api.de('PUT /api/tarifas/1')[0].cuerpo).toEqual({ precio: 25 });
  });

  test('cancela la edición sin llamar a la API', async ({ page }) => {
    const api = await simularApi(page, apiBase(tarifasIniciales()));

    await page.goto('/admin/tarifas');
    const fila = page.locator('tbody tr').nth(0);
    await fila.getByRole('button', { name: 'Editar' }).click();
    await fila.getByRole('button', { name: 'Cancelar' }).click();

    await expect(fila.locator('input[type="number"]')).toHaveCount(0);
    expect(api.de('PUT /api/tarifas/1')).toHaveLength(0);
  });

  test('elimina una tarifa tras confirmar', async ({ page }) => {
    const tarifas = tarifasIniciales();
    const mensajes = responderDialogos(page);
    const api = await simularApi(page, {
      ...apiBase(tarifas),
      'DELETE /api/tarifas/2': () => {
        tarifas.splice(1, 1);
        return ok({ mensaje: 'Tarifa eliminada' });
      }
    });

    await page.goto('/admin/tarifas');
    await page.locator('tbody tr').nth(1).getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.locator('tbody tr')).toHaveCount(1);
    expect(mensajes[0]).toContain('eliminar esta tarifa');
    expect(api.de('DELETE /api/tarifas/2')).toHaveLength(1);
  });

  test('no elimina si se rechaza la confirmación', async ({ page }) => {
    responderDialogos(page, false);
    const api = await simularApi(page, apiBase(tarifasIniciales()));

    await page.goto('/admin/tarifas');
    await page.locator('tbody tr').nth(1).getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.locator('tbody tr')).toHaveCount(2);
    expect(api.de('DELETE /api/tarifas/2')).toHaveLength(0);
  });
});
