import { describe, it, expect, beforeEach } from 'vitest';
import { construirCrearReserva } from '../../src/application/reservas/CrearReserva.js';
import { construirGestionReservas } from '../../src/application/reservas/GestionReservas.js';
import { ESTADOS } from '../../src/domain/reservas/Reserva.js';
import { ReservaError } from '../../src/domain/reservas/ReservaError.js';
import {
  crearReservaRepoEnMemoria,
  crearVehiculoRepoEnMemoria
} from '../helpers/repositoriosEnMemoria.js';

// Fechas relativas a "ahora" para que los tests no caduquen con el tiempo.
const HORA = 60 * 60 * 1000;
const enHoras = (h) => new Date(Date.now() + h * HORA);

const ANA = { id: 10, rol: 'CLIENTE' };
const LUIS = { id: 11, rol: 'CLIENTE' };
const EMPLEADO = { id: 20, rol: 'EMPLEADO' };

let reservaRepo;
let vehiculoRepo;
let crearReserva;
let gestion;

beforeEach(() => {
  reservaRepo = crearReservaRepoEnMemoria();
  vehiculoRepo = crearVehiculoRepoEnMemoria(reservaRepo);
  crearReserva = construirCrearReserva({ reservaRepo, vehiculoRepo });
  gestion = construirGestionReservas({ reservaRepo, vehiculoRepo });
});

// Espera que la promesa falle con un ReservaError de ese código (y status, si se indica).
async function esperarFallo(promesa, codigo, status) {
  let error;
  try {
    await promesa;
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(ReservaError);
  expect(error.codigo).toBe(codigo);
  if (status) expect(error.status).toBe(status);
}

// Atajo: reserva el vehículo 1 entre dos instantes
const reservar = (usuario, desdeH, hastaH, vehiculoId = 1, modalidad = 'HORA') =>
  crearReserva({
    usuarioId: usuario.id,
    vehiculoId,
    fechaInicio: enHoras(desdeH),
    fechaFin: enHoras(hastaH),
    modalidad
  });

describe('Integración: crear reserva', () => {
  it('Crea la reserva en estado RESERVADA con el total calculado', async () => {
    const reserva = await reservar(ANA, 48, 52); // 4 horas a Bs 40

    expect(reserva.estado).toBe(ESTADOS.RESERVADA);
    expect(reserva.usuario_id).toBe(ANA.id);
    expect(reserva.vehiculo_id).toBe(1);
    expect(reserva.precio_unitario).toBe(40);
    expect(reserva.total).toBe(160);
  });

  it('Guarda una "foto" del precio: si la tarifa sube después, la reserva no cambia', async () => {
    const reserva = await reservar(ANA, 48, 52);

    vehiculoRepo.vehiculos[0].precio_hora = 100;

    const guardada = await gestion.obtenerReserva(reserva.id, ANA);
    expect(guardada.precio_unitario).toBe(40);
    expect(guardada.total).toBe(160);
  });

  it('Cobra por día cuando la modalidad es DIA (1 día y 2 horas = 2 días)', async () => {
    const reserva = await reservar(ANA, 48, 48 + 26, 1, 'DIA');
    expect(reserva.total).toBe(600);
  });

  it('Rechaza reservar en el pasado', async () => {
    await esperarFallo(reservar(ANA, -5, 2), 'VALIDACION', 400);
  });

  it('Rechaza un vehículo que no existe', async () => {
    await esperarFallo(reservar(ANA, 48, 52, 999), 'NO_ENCONTRADA', 404);
  });

  it('Rechaza un vehículo en MANTENIMIENTO', async () => {
    await esperarFallo(reservar(ANA, 48, 52, 3), 'CONFLICTO', 409);
  });

  it('Rechaza si faltan datos obligatorios', async () => {
    await esperarFallo(crearReserva({ usuarioId: ANA.id }), 'VALIDACION', 400);
  });
});

describe('Integración: la reserva bloquea la disponibilidad', () => {
  it('No permite reservar el mismo auto en un horario que se cruza', async () => {
    await reservar(ANA, 48, 52); // 10:00-14:00
    await esperarFallo(reservar(LUIS, 50, 54), 'CONFLICTO', 409); // 12:00-16:00
  });

  it('Sí permite reservar justo cuando termina la anterior (intervalos [inicio, fin))', async () => {
    await reservar(ANA, 48, 52); // 10:00-14:00
    const siguiente = await reservar(LUIS, 52, 56); // 14:00-18:00
    expect(siguiente.estado).toBe(ESTADOS.RESERVADA);
  });

  it('Otro vehículo en el mismo horario no se ve afectado', async () => {
    await reservar(ANA, 48, 52, 1);
    const otra = await reservar(LUIS, 48, 52, 2);
    expect(otra.vehiculo_id).toBe(2);
  });

  it('Un auto reservado deja de aparecer en la búsqueda de disponibles para ese horario', async () => {
    await reservar(ANA, 48, 52, 1);

    const disponibles = await gestion.buscarVehiculosDisponibles({
      fechaInicio: enHoras(49),
      fechaFin: enHoras(51)
    });

    const ids = disponibles.map((v) => v.id);
    expect(ids).not.toContain(1); // reservado
    expect(ids).toContain(2); // libre
    expect(ids).not.toContain(3); // en mantenimiento
  });

  it('Fuera del horario reservado el auto sigue apareciendo como disponible', async () => {
    await reservar(ANA, 48, 52, 1);

    const disponibles = await gestion.buscarVehiculosDisponibles({
      fechaInicio: enHoras(60),
      fechaFin: enHoras(64)
    });

    expect(disponibles.map((v) => v.id)).toContain(1);
  });

  it('Las reservas confirmadas también bloquean', async () => {
    const reserva = await reservar(ANA, 48, 52);
    await gestion.confirmarReserva(reserva.id);

    await esperarFallo(reservar(LUIS, 49, 51), 'CONFLICTO');
  });
});

describe('Integración: cancelar una reserva libera el intervalo', () => {
  it('Tras cancelar, otro cliente puede reservar ese mismo horario', async () => {
    const reservaAna = await reservar(ANA, 48, 52);
    await esperarFallo(reservar(LUIS, 48, 52), 'CONFLICTO');

    const cancelada = await gestion.cancelarReserva(reservaAna.id, ANA);
    expect(cancelada.estado).toBe(ESTADOS.CANCELADA);

    const reservaLuis = await reservar(LUIS, 48, 52);
    expect(reservaLuis.estado).toBe(ESTADOS.RESERVADA);
  });

  it('Tras cancelar, el auto vuelve a aparecer como disponible', async () => {
    const reserva = await reservar(ANA, 48, 52);
    await gestion.cancelarReserva(reserva.id, ANA);

    const disponibles = await gestion.buscarVehiculosDisponibles({
      fechaInicio: enHoras(48),
      fechaFin: enHoras(52)
    });
    expect(disponibles.map((v) => v.id)).toContain(1);
  });

  it('Se puede cancelar una reserva CONFIRMADA', async () => {
    const reserva = await reservar(ANA, 48, 52);
    await gestion.confirmarReserva(reserva.id);

    const cancelada = await gestion.cancelarReserva(reserva.id, ANA);
    expect(cancelada.estado).toBe(ESTADOS.CANCELADA);
  });

  it('No se puede cancelar una reserva ya entregada', async () => {
    const reserva = await reservar(ANA, 48, 52);
    reservaRepo.reservas[0].estado = ESTADOS.ENTREGADA; // la entrega aún no tiene caso de uso propio

    await esperarFallo(gestion.cancelarReserva(reserva.id, ANA), 'TRANSICION_INVALIDA', 409);
  });

  it('No se puede cancelar dos veces', async () => {
    const reserva = await reservar(ANA, 48, 52);
    await gestion.cancelarReserva(reserva.id, ANA);

    await esperarFallo(gestion.cancelarReserva(reserva.id, ANA), 'TRANSICION_INVALIDA');
  });
});

describe('Integración: el cliente solo ve sus reservas', () => {
  beforeEach(async () => {
    await reservar(ANA, 48, 52, 1);
    await reservar(ANA, 72, 76, 1);
    await reservar(LUIS, 48, 52, 2);
  });

  it('"Mis reservas" devuelve únicamente las del usuario', async () => {
    const deAna = await gestion.listarMisReservas(ANA.id);
    const deLuis = await gestion.listarMisReservas(LUIS.id);

    expect(deAna).toHaveLength(2);
    expect(deAna.every((r) => r.usuario_id === ANA.id)).toBe(true);
    expect(deLuis).toHaveLength(1);
    expect(deLuis[0].usuario_id).toBe(LUIS.id);
  });

  it('Un cliente no puede ver el detalle de la reserva de otro (404)', async () => {
    const reservaDeLuis = reservaRepo.reservas.find((r) => r.usuario_id === LUIS.id);

    await esperarFallo(gestion.obtenerReserva(reservaDeLuis.id, ANA), 'NO_ENCONTRADA', 404);
  });

  it('Un cliente no puede cancelar la reserva de otro', async () => {
    const reservaDeLuis = reservaRepo.reservas.find((r) => r.usuario_id === LUIS.id);

    await esperarFallo(gestion.cancelarReserva(reservaDeLuis.id, ANA), 'NO_ENCONTRADA');
    expect(reservaRepo.reservas.find((r) => r.id === reservaDeLuis.id).estado).toBe(ESTADOS.RESERVADA);
  });

  it('El empleado ve todas las reservas y el detalle de cualquiera', async () => {
    const todas = await gestion.listarTodas();
    expect(todas).toHaveLength(3);

    const detalle = await gestion.obtenerReserva(todas[0].id, EMPLEADO);
    expect(detalle.id).toBe(todas[0].id);
  });
});

describe('Integración: confirmar reserva (empleado)', () => {
  it('Pasa de RESERVADA a CONFIRMADA', async () => {
    const reserva = await reservar(ANA, 48, 52);
    const confirmada = await gestion.confirmarReserva(reserva.id);
    expect(confirmada.estado).toBe(ESTADOS.CONFIRMADA);
  });

  it('No se puede confirmar una reserva cancelada', async () => {
    const reserva = await reservar(ANA, 48, 52);
    await gestion.cancelarReserva(reserva.id, ANA);

    await esperarFallo(gestion.confirmarReserva(reserva.id), 'TRANSICION_INVALIDA');
  });

  it('No se puede confirmar dos veces', async () => {
    const reserva = await reservar(ANA, 48, 52);
    await gestion.confirmarReserva(reserva.id);

    await esperarFallo(gestion.confirmarReserva(reserva.id), 'TRANSICION_INVALIDA');
  });

  it('Una reserva inexistente da 404', async () => {
    await esperarFallo(gestion.confirmarReserva(999), 'NO_ENCONTRADA', 404);
  });
});

describe('Integración: revalidar la disponibilidad al confirmar', () => {
  // Una reserva vigente "colada" en el mismo horario, como si hubiera entrado por otro camino
  // (la creación normal no deja que dos reservas vigentes se crucen).
  const colarReserva = (estado, desdeH, hastaH, vehiculoId = 1) =>
    reservaRepo.reservas.push({
      id: 99,
      usuario_id: LUIS.id,
      vehiculo_id: vehiculoId,
      fecha_inicio: enHoras(desdeH),
      fecha_fin: enHoras(hastaH),
      modalidad: 'HORA',
      precio_unitario: 40,
      total: 160,
      estado
    });

  it('No confirma si otra reserva vigente ocupa el mismo horario (409) y deja la reserva como estaba', async () => {
    const reserva = await reservar(ANA, 48, 52);
    colarReserva(ESTADOS.CONFIRMADA, 50, 54);

    await esperarFallo(gestion.confirmarReserva(reserva.id), 'CONFLICTO', 409);

    const guardada = await gestion.obtenerReserva(reserva.id, ANA);
    expect(guardada.estado).toBe(ESTADOS.RESERVADA);
  });

  it('Una reserva CANCELADA en el mismo horario no impide confirmar', async () => {
    const reserva = await reservar(ANA, 48, 52);
    colarReserva(ESTADOS.CANCELADA, 50, 54);

    const confirmada = await gestion.confirmarReserva(reserva.id);
    expect(confirmada.estado).toBe(ESTADOS.CONFIRMADA);
  });

  it('Una reserva vigente de OTRO vehículo en el mismo horario no impide confirmar', async () => {
    const reserva = await reservar(ANA, 48, 52, 1);
    colarReserva(ESTADOS.CONFIRMADA, 48, 52, 2);

    const confirmada = await gestion.confirmarReserva(reserva.id);
    expect(confirmada.estado).toBe(ESTADOS.CONFIRMADA);
  });

  it('No confirma si el vehículo pasó a MANTENIMIENTO después de reservar (409)', async () => {
    const reserva = await reservar(ANA, 48, 52);
    vehiculoRepo.vehiculos[0].estado = 'MANTENIMIENTO';

    await esperarFallo(gestion.confirmarReserva(reserva.id), 'CONFLICTO', 409);

    const guardada = await gestion.obtenerReserva(reserva.id, ANA);
    expect(guardada.estado).toBe(ESTADOS.RESERVADA);
  });

  it('Sigue validando primero la transición de estado (una cancelada da TRANSICION_INVALIDA)', async () => {
    const reserva = await reservar(ANA, 48, 52);
    await gestion.cancelarReserva(reserva.id, ANA);
    vehiculoRepo.vehiculos[0].estado = 'MANTENIMIENTO';

    await esperarFallo(gestion.confirmarReserva(reserva.id), 'TRANSICION_INVALIDA', 409);
  });
});

describe('Integración: consultar disponibilidad', () => {
  const consultar = (desdeH, hastaH) =>
    gestion.buscarVehiculosDisponibles({ fechaInicio: enHoras(desdeH), fechaFin: enHoras(hastaH) });

  it('Sin reservas devuelve todas las unidades, menos las que están en MANTENIMIENTO', async () => {
    const ids = (await consultar(48, 52)).map((v) => v.id);
    expect(ids).toEqual([1, 2]);
  });

  it('No devuelve unidades dadas de baja', async () => {
    vehiculoRepo.vehiculos[1].activo = false;

    const ids = (await consultar(48, 52)).map((v) => v.id);
    expect(ids).toEqual([1]);
  });

  it('Un horario que termina justo cuando empieza una reserva (o empieza justo cuando termina) no la ve como ocupada', async () => {
    // Se reutilizan las MISMAS fechas como borde, para que no haya milisegundos de diferencia.
    const inicioReserva = enHoras(48);
    const finReserva = enHoras(52);
    await crearReserva({
      usuarioId: ANA.id,
      vehiculoId: 1,
      fechaInicio: inicioReserva,
      fechaFin: finReserva,
      modalidad: 'HORA'
    });

    const antes = await gestion.buscarVehiculosDisponibles({ fechaInicio: enHoras(44), fechaFin: inicioReserva });
    const despues = await gestion.buscarVehiculosDisponibles({ fechaInicio: finReserva, fechaFin: enHoras(56) });

    expect(antes.map((v) => v.id)).toContain(1);
    expect(despues.map((v) => v.id)).toContain(1);
  });

  it('Un horario que se cruza con la reserva aunque sea un poco la ve como ocupada', async () => {
    await reservar(ANA, 48, 52, 1);

    expect((await consultar(44, 49)).map((v) => v.id)).not.toContain(1);
    expect((await consultar(51, 56)).map((v) => v.id)).not.toContain(1);
  });

  it('Rechaza fechas inválidas con un error 400', async () => {
    await esperarFallo(consultar(52, 48), 'VALIDACION', 400); // fin antes que inicio
    await esperarFallo(consultar(-5, 2), 'VALIDACION', 400); // inicio en el pasado
    await esperarFallo(
      gestion.buscarVehiculosDisponibles({ fechaInicio: 'mañana', fechaFin: 'pasado' }),
      'VALIDACION',
      400
    );
  });
});

describe('Integración: la segunda reserva solapada se rechaza', () => {
  // La primera reserva es de 48 a 52 horas desde ahora; estas son segundas reservas que chocan.
  const choques = [
    ['idéntica', 48, 52],
    ['empieza antes y termina dentro', 46, 50],
    ['empieza dentro y termina después', 50, 54],
    ['queda contenida', 49, 51],
    ['envuelve a la primera', 46, 54]
  ];

  choques.forEach(([descripcion, desdeH, hastaH]) => {
    it(`Rechaza la segunda reserva (${descripcion}) con CONFLICTO 409`, async () => {
      await reservar(ANA, 48, 52);
      await esperarFallo(reservar(LUIS, desdeH, hastaH), 'CONFLICTO', 409);
    });
  });

  it('Al rechazarla no guarda nada: solo queda la primera reserva', async () => {
    await reservar(ANA, 48, 52);
    await esperarFallo(reservar(LUIS, 50, 54), 'CONFLICTO');

    expect(reservaRepo.reservas).toHaveLength(1);
    expect(reservaRepo.reservas[0].usuario_id).toBe(ANA.id);
  });
});

describe('Integración: liberar el intervalo al cancelar (flujo completo)', () => {
  it('Tras cancelar, la reserva que antes chocaba se crea y se puede confirmar', async () => {
    const primera = await reservar(ANA, 48, 52);
    await esperarFallo(reservar(LUIS, 50, 54), 'CONFLICTO');

    await gestion.cancelarReserva(primera.id, ANA);

    const segunda = await reservar(LUIS, 50, 54);
    const confirmada = await gestion.confirmarReserva(segunda.id);
    expect(confirmada.estado).toBe(ESTADOS.CONFIRMADA);
  });

  it('Cancelar solo libera ese vehículo: el otro sigue como estaba', async () => {
    const enAuto1 = await reservar(ANA, 48, 52, 1);
    await reservar(LUIS, 48, 52, 2);

    await gestion.cancelarReserva(enAuto1.id, ANA);

    const ids = (
      await gestion.buscarVehiculosDisponibles({ fechaInicio: enHoras(48), fechaFin: enHoras(52) })
    ).map((v) => v.id);
    expect(ids).toContain(1); // liberado
    expect(ids).not.toContain(2); // sigue reservado
  });
});
