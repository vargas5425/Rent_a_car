import CategoriaRepository from '../../infrastructure/repositories/CategoriaRepository.js';

export async function getCategorias(req, res) {
  try {
    const categorias = await CategoriaRepository.findAll();
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
}

export async function postCategoria(req, res) {
  try {
    const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
    const descripcion =
      typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : null;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
    }

    const nuevaCategoria = await CategoriaRepository.create({
      nombre,
      descripcion: descripcion || null
    });

    res.status(201).json({
      mensaje: 'Categoría creada exitosamente',
      categoria: nuevaCategoria
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear la categoría' });
  }
}