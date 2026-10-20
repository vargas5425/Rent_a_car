import { UsuarioModel } from '../models/index.js';

class UsuarioRepository {
  async findByEmail(email) {
    return await UsuarioModel.findOne({ where: { email } });
  }

  async create(data) {
    return await UsuarioModel.create(data);
  }
}

export default new UsuarioRepository();