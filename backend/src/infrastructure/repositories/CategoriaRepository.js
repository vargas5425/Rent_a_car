import { CategoriaModel } from '../models/index.js';

class CategoriaRepository {
  async findAll() {
    return await CategoriaModel.findAll({ order: [['id', 'ASC']] });
  }

  async create(data) {
    return await CategoriaModel.create(data);
  }
}

export default new CategoriaRepository();