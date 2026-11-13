import { TarifaModel, VehiculoModel, CategoriaModel } from '../models/index.js';

class TarifaRepository {
  // Busca si hay una tarifa específica para este vehículo
  async buscarPorVehiculo(vehiculoId) {
    return await TarifaModel.findAll({ where: { vehiculo_id: vehiculoId } });
  }

  // Busca si hay una tarifa para la categoría de este vehículo
  async buscarPorCategoria(categoriaId) {
    return await TarifaModel.findAll({ where: { categoria_id: categoriaId } });
  }

  // Crea una nueva tarifa (útil para el CRUD del Admin)
  async crear(datos) {
    return await TarifaModel.create(datos);
  }
  
  // Obtener todas
  async listar() {
    return await TarifaModel.findAll();
  }

  async actualizar(id, datos) {
    const tarifa = await TarifaModel.findByPk(id);
    if (!tarifa) throw new Error('Tarifa no encontrada');
    return await tarifa.update(datos);
  }

  async eliminar(id) {
    const tarifa = await TarifaModel.findByPk(id);
    if (!tarifa) throw new Error('Tarifa no encontrada');
    return await tarifa.destroy();
  }
}

export default new TarifaRepository();