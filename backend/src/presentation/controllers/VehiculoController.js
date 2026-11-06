import { listarVehiculos } from '../../application/flota/ListarVehiculos.js';
import { crearVehiculo } from '../../application/flota/CrearVehiculo.js';
import { actualizarVehiculo } from '../../application/flota/ActualizarVehiculo.js';
import { eliminarVehiculo } from '../../application/flota/EliminarVehiculo.js';

export async function getVehiculos(req, res) {
  try {
    const vehiculos = await listarVehiculos();
    res.status(200).json(vehiculos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener vehículos', detalle: error.message });
  }
}

export async function postVehiculo(req, res) {
  try {
    const nuevoVehiculo = await crearVehiculo(req.body);
    res.status(201).json({
      mensaje: 'Vehículo creado exitosamente',
      vehiculo: nuevoVehiculo
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function putVehiculo(req, res) {
  try {
    const actualizado = await actualizarVehiculo(req.params.id, req.body);
    res.status(200).json({ mensaje: 'Vehículo actualizado', vehiculo: actualizado });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteVehiculo(req, res) {
  try {
    await eliminarVehiculo(req.params.id);
    res.status(200).json({ mensaje: 'Vehículo eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}