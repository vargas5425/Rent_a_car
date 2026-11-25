const dos = (n) => String(n).padStart(2, '0');

export function fecha(dias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export function fechaHora(dias, hora) {
  return `${fecha(dias)}T${hora}`;
}

export const tarifasBase = [
  { id: 1, modalidad: 'HORA', precio: '20.00' },
  { id: 2, modalidad: 'DIA', precio: '200.00' }
];

export const categorias = [
  { id: 1, nombre: 'SUV' },
  { id: 2, nombre: 'Sedán' },
  { id: 3, nombre: 'Hatchback' }
];

export function crearVehiculo(id, extra = {}) {
  return {
    id,
    placa: `PLA-${String(id).padStart(2, '0')}`,
    marca: 'Toyota',
    modelo: `Modelo ${id}`,
    anio: 2022,
    categoria_id: 1,
    categoria: categorias[0],
    transmision: 'AUTOMATICA',
    pasajeros: 5,
    kilometraje_actual: 15000,
    estado: 'DISPONIBLE',
    imagen_url: null,
    tarifas: tarifasBase,
    ...extra
  };
}

export function crearFlota(cantidad) {
  return Array.from({ length: cantidad }, (_, i) => crearVehiculo(i + 1));
}

export function crearReserva(id, extra = {}) {
  const dia = fecha(10);
  return {
    id,
    estado: 'RESERVADA',
    modalidad: 'HORA',
    precio_unitario: '20.00',
    total: '60.00',
    fecha_inicio: `${dia}T10:00:00.000Z`,
    fecha_fin: `${dia}T13:00:00.000Z`,
    vehiculo: crearVehiculo(1),
    usuario: { id: 3, nombre: 'Ana Rojas' },
    ...extra
  };
}

export function crearAlquiler(id, extra = {}) {
  const dia = fecha(10);
  return {
    id,
    reserva_id: 2,
    usuario_id: 3,
    vehiculo_id: 1,
    usuario: { id: 3, nombre: 'Ana Rojas' },
    vehiculo: crearVehiculo(1),
    estado: 'PENDIENTE',
    modalidad: 'DIA',
    monto_total: '200.00',
    fecha_inicio: `${dia}T10:00:00.000Z`,
    fecha_fin: `${dia}T22:00:00.000Z`,
    ...extra
  };
}
