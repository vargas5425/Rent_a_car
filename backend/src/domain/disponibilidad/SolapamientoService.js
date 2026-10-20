export function haySolapamiento(inicioA, finA, inicioB, finB) {
  const startA = new Date(inicioA).getTime();
  const endA = new Date(finA).getTime();
  const startB = new Date(inicioB).getTime();
  const endB = new Date(finB).getTime();

  return startA < endB && startB < endA;
}

export function validarFechas(fechaInicio, fechaFin) {
  const inicio = new Date(fechaInicio).getTime();
  const fin = new Date(fechaFin).getTime();
  const ahora = new Date().getTime();

  if (isNaN(inicio) || isNaN(fin)) throw new Error('Formato de fecha inválido');
  if (fin <= inicio) throw new Error('La fecha de fin debe ser posterior a la de inicio');
  if (inicio < ahora) throw new Error('No se puede reservar en el pasado');
  
  return true;
}