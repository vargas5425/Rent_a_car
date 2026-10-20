export function calcularPrecio(duracionEnHoras, modalidad, precioBase) {
  if (duracionEnHoras <= 0) throw new Error('La duración debe ser mayor a 0');
  if (precioBase <= 0) throw new Error('El precio base debe ser mayor a 0');

  let unidadesACobrar = 0;

  switch (modalidad) {
    case 'HORA':
      unidadesACobrar = Math.ceil(duracionEnHoras);
      break;
    case 'DIA':
      unidadesACobrar = Math.ceil(duracionEnHoras / 24);
      break;
    case 'SEMANA':
      unidadesACobrar = Math.ceil(duracionEnHoras / (24 * 7));
      break;
    case 'MES':
      unidadesACobrar = Math.ceil(duracionEnHoras / (24 * 30));
      break;
    default:
      throw new Error('Modalidad no válida');
  }

  return unidadesACobrar * precioBase;
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