import { VehiculoModel, CategoriaModel } from '../models/index.js';

class VehiculoRepository {
  async findAll() {
    // Trae todos los vehículos e incluye los datos de su categoría (JOIN)
    return await VehiculoModel.findAll({
      where: { activo: true },
      include: [{ model: CategoriaModel, as: 'categoria' }]
    });
  }

  
  // Buscar vehículo por ID con soporte para transacciones
  async findById(id, options = {}) {
    return await VehiculoModel.findByPk(id, {
      ...options,
      include: [{ model: CategoriaModel, as: 'categoria' }]
    });
  }


  async create(data) {
    return await VehiculoModel.create(data);
  }

  
  // Actualizar vehículo con soporte para transacciones
  async update(id, data, options = {}) {
    const vehiculo = await VehiculoModel.findByPk(id, options);

    if (!vehiculo) {
      return null;
    }

    return await vehiculo.update(data, options);
  }


  async delete(id) {
    const vehiculo = await VehiculoModel.findByPk(id);
    if (!vehiculo) return null;
    // Borrado lógico (recomendado)
    return await vehiculo.update({ activo: false }); 
  }
}

export default new VehiculoRepository();