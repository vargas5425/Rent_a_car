// Utilidades compartidas por los tests E2E.
// Usan los usuarios que crea el seeder de demostración (backend/.../seeders/...-demo-data.cjs).

export const API_URL = process.env.E2E_API_URL || 'http://localhost:4000/api';

export const CLIENTE = { email: 'cliente@rentacar.com', password: 'cliente123' };
export const EMPLEADO = { email: 'empleado@rentacar.com', password: 'empleado123' };

const dos = (n) => String(n).padStart(2, '0');

// "YYYY-MM-DDTHH:mm" en hora local: el formato de <input type="datetime-local">
function aInputFecha(fecha) {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

// Una franja de 4 horas en un día lejano y al azar, para no chocar con reservas
// que hayan quedado de otras ejecuciones.
export function franjaLibre(horas = 4) {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() + 40 + Math.floor(Math.random() * 320));
  inicio.setHours(8 + Math.floor(Math.random() * 8), 0, 0, 0);
  const fin = new Date(inicio.getTime() + horas * 60 * 60 * 1000);

  return {
    inicio: aInputFecha(inicio),
    fin: aInputFecha(fin),
    isoInicio: inicio.toISOString(),
    isoFin: fin.toISOString()
  };
}

// Inicia sesión por la pantalla de login, como lo haría una persona.
export async function loginPorUI(page, { email, password }) {
  await page.goto('/login');
  await page.getByPlaceholder('tu@correo.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Entrar al sistema' }).click();
  await page.waitForURL(/\/(vehiculos|dashboard)/);
}

// --- Atajos por API para preparar datos sin pasar por la pantalla ---

export async function tokenPorAPI(request, { email, password }) {
  const res = await request.post(`${API_URL}/auth/login`, { data: { email, password } });
  if (!res.ok()) throw new Error(`No se pudo iniciar sesión por API (${res.status()})`);
  return (await res.json()).token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Primer vehículo que se puede alquilar (no está en mantenimiento)
export async function vehiculoReservableAPI(request, token) {
  const res = await request.get(`${API_URL}/vehiculos`, { headers: auth(token) });
  const vehiculos = await res.json();
  const vehiculo = vehiculos.find((v) => v.estado !== 'MANTENIMIENTO');
  if (!vehiculo) throw new Error('No hay vehículos reservables en la base de datos de prueba');
  return vehiculo;
}

export async function reservarPorAPI(request, token, vehiculoId, franja, modalidad = 'HORA') {
  const res = await request.post(`${API_URL}/reservas`, {
    headers: auth(token),
    data: { vehiculoId, fechaInicio: franja.isoInicio, fechaFin: franja.isoFin, modalidad }
  });
  if (res.status() !== 201) throw new Error(`No se pudo crear la reserva por API (${res.status()})`);
  return (await res.json()).reserva;
}

export async function cancelarPorAPI(request, token, reservaId) {
  // Limpieza: si ya estaba cancelada, no pasa nada.
  await request.patch(`${API_URL}/reservas/${reservaId}/cancelar`, { headers: auth(token) });
}

export async function disponiblesPorAPI(request, token, franja) {
  const res = await request.get(`${API_URL}/reservas/disponibilidad`, {
    headers: auth(token),
    params: { fechaInicio: franja.isoInicio, fechaFin: franja.isoFin }
  });
  return await res.json();
}
