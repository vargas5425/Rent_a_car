import { CategoriaModel } from '../models/index.js';

class CategoriaRepository {
  async findAll() {
    return await CategoriaModel.findAll();
  }
}

export default new CategoriaRepository();