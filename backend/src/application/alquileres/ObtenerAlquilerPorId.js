import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import { errorValidacion, errorNoEncontrada } from '../../domain/reservas/ReservaError.js';

export async function obtenerAlquilerPorId(alquilerId, usuario = null) {
  const id = Number(alquilerId);

  if (!Number.isInteger(id) || id <= 0) {
    throw errorValidacion('El ID del alquiler no es válido');
  }

  const alquiler = await AlquileresRepository.buscarPorIdConRelaciones(id);

  if (!alquiler) {
    throw errorNoEncontrada('El alquiler no existe');
  }

  // Seguridad: si no es staff, solo puede ver sus propios alquileres
  const esStaff = usuario && ['EMPLEADO', 'ADMINISTRADOR'].includes(usuario.rol);
  const esDueno = usuario && Number(alquiler.usuario_id) === Number(usuario.id);

  if (usuario && !esStaff && !esDueno) {
    throw errorNoEncontrada('El alquiler no existe'); // 404 para no filtrar info
  }

  return alquiler;
}