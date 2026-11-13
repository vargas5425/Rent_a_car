import CategoriaRepository from '../../infrastructure/repositories/CategoriaRepository.js';

export async function getCategorias(req, res) {
  try {
    const categorias = await CategoriaRepository.findAll();
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
}