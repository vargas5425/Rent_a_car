import TarifaRepository from '../../infrastructure/repositories/TarifaRepository.js';

// Función pura para calcular el precio con redondeo
export function calcularPrecioMatematico(duracionEnHoras, modalidad, precioBase) {
  if (duracionEnHoras <= 0) throw new Error('La duración debe ser mayor a 0');
  if (precioBase <= 0) throw new Error('El precio base debe ser mayor a 0');

  let unidadesACobrar = 0;
  switch (modalidad) {
    case 'HORA': unidadesACobrar = Math.ceil(duracionEnHoras); break;
    case 'DIA': unidadesACobrar = Math.ceil(duracionEnHoras / 24); break;
    case 'SEMANA': unidadesACobrar = Math.ceil(duracionEnHoras / (24 * 7)); break;
    case 'MES': unidadesACobrar = Math.ceil(duracionEnHoras / (24 * 30)); break;
    default: throw new Error('Modalidad no válida');
  }
  return unidadesACobrar * precioBase;
}

// Lógica que consulta la BD y aplica la prioridad
export async function calcularPrecioReserva(vehiculo, duracionEnHoras, modalidad) {
  // 1. Intentar buscar tarifa específica para el vehículo
  const tarifasVehiculo = await TarifaRepository.buscarPorVehiculo(vehiculo.id);
  const tarifaVehiculo = tarifasVehiculo.find(t => t.modalidad === modalidad);

  if (tarifaVehiculo) {
    return calcularPrecioMatematico(duracionEnHoras, modalidad, tarifaVehiculo.precio);
  }

  // 2. Si no hay para el vehículo, buscar para su categoría
  const tarifasCategoria = await TarifaRepository.buscarPorCategoria(vehiculo.categoria_id);
  const tarifaCategoria = tarifasCategoria.find(t => t.modalidad === modalidad);

  if (tarifaCategoria) {
    return calcularPrecioMatematico(duracionEnHoras, modalidad, tarifaCategoria.precio);
  }

  // 3. Si no hay ninguna, lanzar error
  throw new Error('No hay tarifa configurada para este vehículo ni para su categoría');
}

export function calcularCargoRetraso(horasDeRetraso, precioHora) {
  if (horasDeRetraso <= 0) return 0;
  return Math.ceil(horasDeRetraso) * precioHora;
}

export function calcularCargoCombustible(nivelSalida, nivelLlegada) {
  const niveles = { 'VACIO': 0, '1/4': 1, '1/2': 2, '3/4': 3, 'LLENO': 4 };
  
  const salida = niveles[nivelSalida];
  const llegada = niveles[nivelLlegada];

  if (salida === undefined || llegada === undefined) throw new Error('Nivel de combustible inválido');
  if (llegada >= salida) return 0;

  const cuartosFaltantes = salida - llegada;
  return cuartosFaltantes * 50;
}

// Genera la "foto" del precio al momento de la reserva
export async function generarSnapshotTarifa(vehiculo, duracionEnHoras, modalidad) {
  // 1. Buscamos la tarifa que aplica (Prioridad: Vehículo)
  const tarifasVehiculo = await TarifaRepository.buscarPorVehiculo(vehiculo.id);
  let tarifaAplicada = tarifasVehiculo.find(t => t.modalidad === modalidad);

  // 2. Si no hay, buscamos en la Categoría
  if (!tarifaAplicada) {
    const tarifasCategoria = await TarifaRepository.buscarPorCategoria(vehiculo.categoria_id);
    tarifaAplicada = tarifasCategoria.find(t => t.modalidad === modalidad);
  }

  if (!tarifaAplicada) {
    throw new Error('No hay tarifa configurada para este vehículo ni para su categoría');
  }

  // 3. Calculamos el precio final
  const precioTotal = calcularPrecioMatematico(duracionEnHoras, modalidad, tarifaAplicada.precio);

  // 4. Retornamos el "Snapshot"
  return {
    tarifa_id: tarifaAplicada.id,
    modalidad_aplicada: modalidad,
    precio_unitario_al_momento: tarifaAplicada.precio,
    duracion_cobrada: duracionEnHoras,
    precio_total_calculado: precioTotal
  };
}