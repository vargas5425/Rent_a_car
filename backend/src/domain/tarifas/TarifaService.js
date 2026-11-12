// 👇 EL DOMINIO YA NO IMPORTA EL REPOSITORIO. Es 100% puro.

export function calcularPrecio(duracionEnHoras, modalidad, precioBase) {
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

// 👇 Ahora recibe el repositorio como parámetro (Inyección de Dependencias)
export async function calcularPrecioReserva(vehiculo, duracionEnHoras, modalidad, tarifaRepo) {
  const tarifasVehiculo = await tarifaRepo.buscarPorVehiculo(vehiculo.id);
  const tarifaVehiculo = tarifasVehiculo.find(t => t.modalidad === modalidad);

  if (tarifaVehiculo) {
    return calcularPrecio(duracionEnHoras, modalidad, tarifaVehiculo.precio);
  }

  const tarifasCategoria = await tarifaRepo.buscarPorCategoria(vehiculo.categoria_id);
  const tarifaCategoria = tarifasCategoria.find(t => t.modalidad === modalidad);

  if (tarifaCategoria) {
    return calcularPrecio(duracionEnHoras, modalidad, tarifaCategoria.precio);
  }

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

// Snapshot también recibe el repositorio
export async function generarSnapshotTarifa(vehiculo, duracionEnHoras, modalidad, tarifaRepo) {
  const tarifasVehiculo = await tarifaRepo.buscarPorVehiculo(vehiculo.id);
  let tarifaAplicada = tarifasVehiculo.find(t => t.modalidad === modalidad);

  if (!tarifaAplicada) {
    const tarifasCategoria = await tarifaRepo.buscarPorCategoria(vehiculo.categoria_id);
    tarifaAplicada = tarifasCategoria.find(t => t.modalidad === modalidad);
  }

  if (!tarifaAplicada) {
    throw new Error('No hay tarifa configurada para este vehículo ni para su categoría');
  }

  const precioTotal = calcularPrecio(duracionEnHoras, modalidad, tarifaAplicada.precio);

  return {
    tarifa_id: tarifaAplicada.id,
    modalidad_aplicada: modalidad,
    precio_unitario_al_momento: tarifaAplicada.precio,
    duracion_cobrada: duracionEnHoras,
    precio_total_calculado: precioTotal
  };
}