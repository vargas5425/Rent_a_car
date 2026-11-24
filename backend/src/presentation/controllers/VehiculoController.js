
import { listarVehiculos } from '../../application/flota/ListarVehiculos.js';
import { crearVehiculo } from '../../application/flota/CrearVehiculo.js';
import { actualizarVehiculo } from '../../application/flota/ActualizarVehiculo.js';
import { eliminarVehiculo } from '../../application/flota/EliminarVehiculo.js';

// ===================================
// 1. LISTAR VEHÍCULOS
// ===================================

export async function getVehiculos(req, res) {
  try {
    const vehiculos = await listarVehiculos();

    return res.status(200).json(vehiculos);

  } catch (error) {
    return res.status(500).json({
      error: 'Error al obtener vehículos',
      detalle: error.message
    });
  }
}

// ===================================
// 2. CREAR VEHÍCULO
// ===================================

export async function postVehiculo(req, res) {
  try {
    // Obtener usuario autenticado
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    // Crear vehículo y registrar historial
    const nuevoVehiculo = await crearVehiculo(
      req.body,
      usuarioId
    );

    return res.status(201).json({
      mensaje: 'Vehículo creado exitosamente',
      vehiculo: nuevoVehiculo
    });

  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
}

// ===================================
// 3. ACTUALIZAR VEHÍCULO
// ===================================

export async function putVehiculo(req, res) {
  try {
    // Obtener usuario autenticado
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    // Actualizar vehículo y registrar historial
    const actualizado = await actualizarVehiculo(
      req.params.id,
      req.body,
      usuarioId
    );

    return res.status(200).json({
      mensaje: 'Vehículo actualizado',
      vehiculo: actualizado
    });

  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
}

// ===================================
// 4. ELIMINAR VEHÍCULO
// BAJA LÓGICA
// ===================================

export async function deleteVehiculo(req, res) {
  try {
    // Obtener usuario autenticado
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    // Dar de baja y registrar historial
    await eliminarVehiculo(
      req.params.id,
      usuarioId
    );

    return res.status(200).json({
      mensaje: 'Vehículo eliminado correctamente'
    });

  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
}
