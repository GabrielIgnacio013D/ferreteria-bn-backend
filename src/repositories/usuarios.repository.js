const pool = require('../config/db');

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.correo, u.password_hash, u.activo, r.nombre AS rol
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
`;

async function buscarPorCorreo(correo) {
  const result = await pool.query(`${SELECT_USUARIO} WHERE u.correo = $1`, [correo]);
  return result.rows[0] || null;
}

async function buscarPorId(id) {
  const result = await pool.query(`${SELECT_USUARIO} WHERE u.id = $1`, [id]);
  return result.rows[0] || null;
}

async function crear({ nombre, correo, passwordHash, rolNombre }) {
  const result = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol_id)
     VALUES ($1, $2, $3, (SELECT id FROM roles WHERE nombre = $4))
     RETURNING id, nombre, correo`,
    [nombre, correo, passwordHash, rolNombre]
  );
  return result.rows[0];
}

module.exports = { buscarPorCorreo, buscarPorId, crear };
