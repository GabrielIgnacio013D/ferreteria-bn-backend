const pool = require('../config/db');

const SELECT_PRODUCTO = `
  SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.imagen_url, c.nombre AS categoria
  FROM productos p
  JOIN categorias c ON c.id = p.categoria_id
  WHERE p.activo = TRUE
`;

async function listar() {
  const result = await pool.query(`${SELECT_PRODUCTO} ORDER BY p.id`);
  return result.rows;
}

async function buscarPorId(id) {
  const result = await pool.query(`${SELECT_PRODUCTO} AND p.id = $1`, [id]);
  return result.rows[0] || null;
}

module.exports = { listar, buscarPorId };
