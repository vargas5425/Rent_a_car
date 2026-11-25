import { test, expect } from '@playwright/test';
import { simularApi, ok, fallo, iniciarSesion, responderDialogos } from '../support/api.js';
import { crearVehiculo, crearReserva } from '../support/datos.js';

const reservasBase = () => [
  crearReserva(1, { usuario: { id: 3, nombre: 'Ana Rojas' } }),
  crearReserva(2, {
    estado: 'CONFIRMADA',
    usuario: { id: 4, nombre: 'Luis Vargas' },
    vehiculo: crearVehiculo(2, { marca: 'Kia', modelo: 'Sportage' })
  }),
  crearReserva(3, { estado: 'DEVUELTA', usuario: { id: 5, nombre: 'Marta Flores' } }),
  crearReserva(4, { estado: 'FINALIZADA', usuario: { id: 6, nombre: 'Pedro Quispe' } })
];

const fila = (page, nombre) => page.locator('tbody tr').filter({ hasText: nombre });

for (const rol of ['empleado', 'admin']) {
  test.describe(`Gestión de reservas como ${rol}`, () => {
    test.beforeEach(async ({ page }) => {
      await iniciarSesion(page, rol);
    });

    test('lista todas las reservas con cliente, vehículo y estado', async ({ page }) => {
      await simularApi(page, { 'GET /api/reservas': ok(reservasBase()) });

      await page.goto('/dashboard/reservas');

      await expect(page.getByRole('heading', { name: 'Gestión de Reservas' })).toBeVisible();
      await expect(page.locator('tbody tr')).toHaveCount(4);
      await expect(fila(page, 'Luis Vargas')).toContainText('Kia Sportage');
      await expect(fila(page, 'Luis Vargas').getByTestId('reserva-estado')).toHaveText('Confirmada');
    });

    test('muestra solo las acciones válidas para cada estado', async ({ page }) => {
      await simularApi(page, { 'GET /api/reservas': ok(reservasBase()) });

      await page.goto('/dashboard/reservas');

      const reservada = fila(page, 'Ana Rojas');
      await expect(reservada.getByRole('button', { name: 'Confirmar' })).toBeVisible();
      await expect(reservada.getByRole('button', { name: 'Cancelar' })).toBeVisible();
      await expect(reservada.getByRole('button', { name: 'Crear alquiler' })).toHaveCount(0);

      const confirmada = fila(page, 'Luis Vargas');
      await expect(confirmada.getByRole('button', { name: 'Crear alquiler' })).toBeVisible();
      await expect(confirmada.getByRole('button', { name: 'Cancelar' })).toBeVisible();

      const devuelta = fila(page, 'Marta Flores');
      await expect(devuelta.getByRole('button', { name: 'Finalizar' })).toBeVisible();
      await expect(devuelta.getByRole('button', { name: 'Cancelar' })).toHaveCount(0);

      const finalizada = fila(page, 'Pedro Quispe');
      await expect(finalizada.getByRole('button')).toHaveCount(0);
      await expect(finalizada.getByRole('link', { name: 'Ver' })).toBeVisible();
    });

    test('filtra por estado y avisa cuando no hay resultados', async ({ page }) => {
      await simularApi(page, { 'GET /api/reservas': ok(reservasBase()) });

      await page.goto('/dashboard/reservas');
      const filtro = page.locator('select.form-select');

      await filtro.selectOption('DEVUELTA');
      await expect(page.locator('tbody tr')).toHaveCount(1);
      await expect(page.locator('tbody tr')).toContainText('Marta Flores');

      await filtro.selectOption('ENTREGADA');
      await expect(page.getByText('No hay reservas para mostrar.')).toBeVisible();

      await filtro.selectOption('TODAS');
      await expect(page.locator('tbody tr')).toHaveCount(4);
    });

    test('confirma una reserva y habilita Crear alquiler', async ({ page }) => {
      const reservas = reservasBase();
      const api = await simularApi(page, {
        'GET /api/reservas': () => ok(reservas),
        'PATCH /api/reservas/1/confirmar': () => {
          reservas[0].estado = 'CONFIRMADA';
          return ok({ reserva: reservas[0] });
        }
      });

      await page.goto('/dashboard/reservas');
      await fila(page, 'Ana Rojas').getByRole('button', { name: 'Confirmar' }).click();

      await expect(fila(page, 'Ana Rojas').getByTestId('reserva-estado')).toHaveText('Confirmada');
      await expect(fila(page, 'Ana Rojas').getByRole('button', { name: 'Crear alquiler' })).toBeVisible();
      expect(api.de('PATCH /api/reservas/1/confirmar')).toHaveLength(1);
    });

    test('muestra el error si la confirmación falla', async ({ page }) => {
      await simularApi(page, {
        'GET /api/reservas': ok(reservasBase()),
        'PATCH /api/reservas/1/confirmar': fallo(409, 'La reserva ya no está en estado Reservada')
      });

      await page.goto('/dashboard/reservas');
      await fila(page, 'Ana Rojas').getByRole('button', { name: 'Confirmar' }).click();

      await expect(page.locator('.alert-danger')).toHaveText('La reserva ya no está en estado Reservada');
    });

    test('crea un alquiler desde una reserva confirmada', async ({ page }) => {
      const mensajes = responderDialogos(page);
      const api = await simularApi(page, {
        'GET /api/reservas': ok(reservasBase()),
        'POST /api/alquileres': ok({ alquiler: { id: 5 } }, 201)
      });

      await page.goto('/dashboard/reservas');
      await fila(page, 'Luis Vargas').getByRole('button', { name: 'Crear alquiler' }).click();

      await expect.poll(() => mensajes.length).toBe(2);
      expect(mensajes[0]).toContain('reserva #2');
      expect(mensajes[1]).toContain('Alquiler #5 creado correctamente');
      expect(api.de('POST /api/alquileres')[0].cuerpo).toEqual({ reservaId: 2 });
    });

    test('no crea el alquiler si se rechaza la confirmación', async ({ page }) => {
      responderDialogos(page, false);
      const api = await simularApi(page, { 'GET /api/reservas': ok(reservasBase()) });

      await page.goto('/dashboard/reservas');
      await fila(page, 'Luis Vargas').getByRole('button', { name: 'Crear alquiler' }).click();

      expect(api.de('POST /api/alquileres')).toHaveLength(0);
    });

    test('muestra el error si no se puede crear el alquiler', async ({ page }) => {
      responderDialogos(page);
      await simularApi(page, {
        'GET /api/reservas': ok(reservasBase()),
        'POST /api/alquileres': fallo(409, 'El vehículo no está disponible para entrega')
      });

      await page.goto('/dashboard/reservas');
      await fila(page, 'Luis Vargas').getByRole('button', { name: 'Crear alquiler' }).click();

      await expect(page.locator('.alert-danger')).toHaveText('El vehículo no está disponible para entrega');
    });

    test('finaliza una reserva devuelta', async ({ page }) => {
      const reservas = reservasBase();
      responderDialogos(page);
      const api = await simularApi(page, {
        'GET /api/reservas': () => ok(reservas),
        'PATCH /api/reservas/3/finalizar': () => {
          reservas[2].estado = 'FINALIZADA';
          return ok({ reserva: reservas[2] });
        }
      });

      await page.goto('/dashboard/reservas');
      await fila(page, 'Marta Flores').getByRole('button', { name: 'Finalizar' }).click();

      await expect(fila(page, 'Marta Flores').getByTestId('reserva-estado')).toHaveText('Finalizada');
      expect(api.de('PATCH /api/reservas/3/finalizar')).toHaveLength(1);
    });

    test('cancela una reserva confirmada tras aceptar el diálogo', async ({ page }) => {
      const reservas = reservasBase();
      responderDialogos(page);
      const api = await simularApi(page, {
        'GET /api/reservas': () => ok(reservas),
        'PATCH /api/reservas/2/cancelar': () => {
          reservas[1].estado = 'CANCELADA';
          return ok({ reserva: reservas[1] });
        }
      });

      await page.goto('/dashboard/reservas');
      await fila(page, 'Luis Vargas').getByRole('button', { name: 'Cancelar' }).click();

      await expect(fila(page, 'Luis Vargas').getByTestId('reserva-estado')).toHaveText('Cancelada');
      expect(api.de('PATCH /api/reservas/2/cancelar')).toHaveLength(1);
    });

    test('muestra el error cuando la lista no carga', async ({ page }) => {
      await simularApi(page, { 'GET /api/reservas': fallo(500, 'Error interno del servidor') });

      await page.goto('/dashboard/reservas');

      await expect(page.locator('.alert-danger')).toHaveText('Error interno del servidor');
    });

    test('el detalle muestra al cliente y permite confirmar', async ({ page }) => {
      const reservas = reservasBase();
      await simularApi(page, {
        'GET /api/reservas': ok(reservas),
        'GET /api/reservas/1': ok(reservas[0]),
        'PATCH /api/reservas/1/confirmar': ok({ reserva: { ...reservas[0], estado: 'CONFIRMADA' } })
      });

      await page.goto('/dashboard/reservas');
      await fila(page, 'Ana Rojas').getByRole('link', { name: 'Ver' }).click();

      await expect(page).toHaveURL(/\/reservas\/1$/);
      await expect(page.getByText('Ana Rojas')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Volver a las reservas' })).toBeVisible();

      await page.getByRole('button', { name: 'Confirmar reserva' }).click();
      await expect(page.getByTestId('reserva-estado')).toHaveText('Confirmada');
    });
  });
}
