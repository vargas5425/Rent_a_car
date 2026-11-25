import { expect } from '@playwright/test';

export const ADMIN = { email: 'admin@rentacar.com', password: 'admin123' };
export const EMPLEADO = { email: 'empleado@rentacar.com', password: 'empleado123' };

export const PRECIO_HORA = 40;
export const PRECIO_DIA = 300;

const HORA_MS = 60 * 60 * 1000;

export function sufijoUnico() {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`.toUpperCase();
}

export function fechaFutura(dias, hora = 10) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, 0, 0, 0);
  return fecha;
}

export function sumarHoras(fecha, horas) {
  return new Date(fecha.getTime() + horas * HORA_MS);
}

const dos = (n) => String(n).padStart(2, '0');

export function soloFecha(fecha) {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

export function soloHora(fecha) {
  return `${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

export function fechaHora(fecha) {
  return `${soloFecha(fecha)}T${soloHora(fecha)}`;
}

async function leer(respuesta) {
  expect(respuesta.ok(), `${respuesta.url()} respondió ${respuesta.status()}: ${await respuesta.text()}`).toBeTruthy();
  return respuesta.json();
}

export async function tokenDe(request, usuario) {
  const datos = await leer(await request.post('/api/auth/login', {
    data: { email: usuario.email, password: usuario.password }
  }));
  return datos.token;
}

export function cabeceras(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function crearCliente(request) {
  const sufijo = sufijoUnico();
  const cliente = {
    nombre: `Cliente E2E ${sufijo}`,
    email: `e2e_${sufijo.toLowerCase()}@tierracamba.com`,
    password: 'Password123*'
  };
  await leer(await request.post('/api/auth/register', { data: cliente }));
  cliente.token = await tokenDe(request, cliente);
  return cliente;
}

export async function crearVehiculo(request) {
  const token = await tokenDe(request, ADMIN);
  const headers = cabeceras(token);
  const categorias = await leer(await request.get('/api/categorias', { headers }));
  const sufijo = sufijoUnico();

  const { vehiculo } = await leer(await request.post('/api/vehiculos', {
    headers,
    data: {
      placa: `E2E-${sufijo}`.slice(0, 20),
      marca: 'Prueba',
      modelo: `Modelo-${sufijo}`,
      anio: 2024,
      categoria_id: categorias[0].id,
      transmision: 'MANUAL',
      pasajeros: 5,
      kilometraje_actual: 1000
    }
  }));

  const tarifas = [];
  for (const [modalidad, precio] of [['HORA', PRECIO_HORA], ['DIA', PRECIO_DIA]]) {
    tarifas.push(await leer(await request.post('/api/tarifas', {
      headers,
      data: { modalidad, precio, vehiculo_id: vehiculo.id }
    })));
  }

  return { ...vehiculo, tarifas };
}

export async function eliminarVehiculo(request, vehiculo) {
  if (!vehiculo) return;
  const token = await tokenDe(request, ADMIN);
  for (const tarifa of vehiculo.tarifas) {
    await request.delete(`/api/tarifas/${tarifa.id}`, { headers: cabeceras(token) });
  }
  await request.delete(`/api/vehiculos/${vehiculo.id}`, { headers: cabeceras(token) });
}

export async function crearReserva(request, cliente, vehiculo, inicio, fin, modalidad = 'HORA') {
  const { reserva } = await leer(await request.post('/api/reservas', {
    headers: cabeceras(cliente.token),
    data: {
      vehiculoId: vehiculo.id,
      fechaInicio: inicio.toISOString(),
      fechaFin: fin.toISOString(),
      modalidad
    }
  }));
  return reserva;
}
