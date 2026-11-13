
import { CargoAdicionalModel } from '../models/index.js';

class CargoAdicionalRepository {

  // Registrar un nuevo cargo adicional
  async crear(datos, options = {}) {
    const cargo = await CargoAdicionalModel.create(
      datos,
      options
    );

    return cargo.toJSON();
  }

  // Buscar un cargo por su ID
  async buscarPorId(id) {
    return await CargoAdicionalModel.findByPk(id);
  }

  // Listar cargos de un alquiler
  async listarPorAlquiler(alquilerId) {
    return await CargoAdicionalModel.findAll({
      where: {
        alquiler_id: alquilerId
      },
      order: [['fecha_cargo', 'DESC']]
    });
  }

  // Calcular total de cargos de un alquiler
  
  async calcularTotal(alquilerId, options = {}) {
    const total = await CargoAdicionalModel.sum('monto', {
      ...options,
      where: {
        alquiler_id: alquilerId
      }
    });

    return Number(total ?? 0);
  }
}

export default new CargoAdicionalRepository();
