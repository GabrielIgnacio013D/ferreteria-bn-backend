const pool = require('../config/db');

async function estado(req, res) {
  let baseDeDatos = 'ok';
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    baseDeDatos = 'no disponible';
  }
  res.status(200).json({
    estado: 'ok',
    servicio: 'ferreteria-bn-backend',
    baseDeDatos
  });
}

module.exports = { estado };
