import { UsuarioModel } from '../models/index.js';

const ATRIBUTOS_SEGUROS = ['id', 'nombre', 'email', 'rol', 'activo', 'createdAt', 'updatedAt'];

class UsuarioRepository {
  async findAll() {
    return await UsuarioModel.findAll({
      attributes: ATRIBUTOS_SEGUROS,
      order: [['id', 'ASC']]
    });
  }

  async findById(id) {
    return await UsuarioModel.findByPk(id, {
      attributes: ATRIBUTOS_SEGUROS
    });
  }

  async findByEmail(email) {
    return await UsuarioModel.findOne({ where: { email } });
  }

  async create(data) {
    return await UsuarioModel.create(data);
  }

  async update(id, data) {
    const usuario = await UsuarioModel.findByPk(id);
    if (!usuario) return null;
    await usuario.update(data);
    return await this.findById(id);
  }

  async delete(id) {
    const usuario = await UsuarioModel.findByPk(id);
    if (!usuario) return false;
    await usuario.destroy();
    return true;
  }
}

export default new UsuarioRepository();