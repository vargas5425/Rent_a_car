import { haySolapamiento } from '../../src/domain/disponibilidad/SolapamientoService.js';
import { ESTADOS_BLOQUEANTES } from '../../src/domain/reservas/Reserva.js';

// Repositorios falsos que guardan todo en arrays. Tienen la misma "forma" que los
// repositorios reales (ReservaRepository / VehiculoRepository), así los casos de uso
// se prueban de punta a punta sin necesitar MySQL.

// Recibe el repositorio de reservas en memoria para poder responder findDisponibles
// (qué vehículos no tienen una reserva bloqueante en ese intervalo), igual que la consulta SQL real.
export function crearVehiculoRepoEnMemoria(reservaRepo = { idsVehiculosOcupados: async () => [] }) {
  const vehiculos = [
    { id: 1, placa: 'SUV-01', marca: 'Toyota', modelo: 'RAV4', estado: 'DISPONIBLE', activo: true, precio_hora: 40, precio_dia: 300 },
    { id: 2, placa: 'SED-04', marca: 'Toyota', modelo: 'Corolla', estado: 'DISPONIBLE', activo: true, precio_hora: 30, precio_dia: 250 },
    { id: 3, placa: 'HB-03', marca: 'Suzuki', modelo: 'Swift', estado: 'MANTENIMIENTO', activo: true, precio_hora: 25, precio_dia: 200 }
  ];

  return {
    vehiculos,
    async findAll() {
      return vehiculos.filter((v) => v.activo).map((v) => ({ ...v }));
    },
    async findById(id) {
      const v = vehiculos.find((x) => x.id === Number(id));
      return v ? { ...v } : null;
    },
    async findDisponibles(inicio, fin) {
      const ocupados = new Set(await reservaRepo.idsVehiculosOcupados(inicio, fin));
      return vehiculos
        .filter((v) => v.activo && v.estado !== 'MANTENIMIENTO' && !ocupados.has(v.id))
        .map((v) => ({ ...v }));
    }
  };
}

export function crearReservaRepoEnMemoria() {
  const reservas = [];
  let siguienteId = 1;

  const choca = (r, vehiculoId, inicio, fin) =>
    r.vehiculo_id === vehiculoId &&
    ESTADOS_BLOQUEANTES.includes(r.estado) &&
    haySolapamiento(r.fecha_inicio, r.fecha_fin, inicio, fin);

  return {
    reservas,

    async crearSiDisponible(datos) {
      if (reservas.some((r) => choca(r, datos.vehiculo_id, datos.fecha_inicio, datos.fecha_fin))) {
        return null;
      }
      const nueva = { id: siguienteId++, ...datos };
      reservas.push(nueva);
      return { ...nueva };
    },

    async findById(id) {
      const r = reservas.find((x) => x.id === Number(id));
      return r ? { ...r } : null;
    },

    async findByUsuario(usuarioId) {
      return reservas.filter((r) => r.usuario_id === Number(usuarioId)).map((r) => ({ ...r }));
    },

    async findAll() {
      return reservas.map((r) => ({ ...r }));
    },

    async actualizarEstado(id, estado) {
      const r = reservas.find((x) => x.id === Number(id));
      if (!r) return null;
      r.estado = estado;
      return { ...r };
    },

    // Como el real: solo cambia el estado si ninguna OTRA reserva vigente choca con la suya.
    async actualizarEstadoSiLibre(id, estado) {
      const r = reservas.find((x) => x.id === Number(id));
      if (!r) return null;
      if (reservas.some((otra) => otra.id !== r.id && choca(otra, r.vehiculo_id, r.fecha_inicio, r.fecha_fin))) {
        return null;
      }
      r.estado = estado;
      return { ...r };
    },

    async idsVehiculosOcupados(inicio, fin) {
      return [
        ...new Set(reservas.filter((r) => choca(r, r.vehiculo_id, inicio, fin)).map((r) => r.vehiculo_id))
      ];
    }
  };
}
