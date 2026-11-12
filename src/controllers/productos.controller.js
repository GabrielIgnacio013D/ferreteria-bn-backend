const productosRepository = require('../repositories/productos.repository');

async function listar(req, res) {
  try {
    res.status(200).json(await productosRepository.listar());
  } catch (err) {
    console.error('Error al listar productos:', err.message);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
}

async function detalle(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }
  try {
    const producto = await productosRepository.buscarPorId(id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(200).json(producto);
  } catch (err) {
    console.error('Error al buscar el producto:', err.message);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
}

module.exports = { listar, detalle };
