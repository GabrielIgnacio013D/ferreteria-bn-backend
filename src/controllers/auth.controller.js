const authService = require('../services/auth.service');

function responderError(err, res) {
  if (err && err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error('Error inesperado en auth:', err.message);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function registrar(req, res) {
  try {
    const usuario = await authService.registrar(req.body || {});
    res.status(201).json(usuario);
  } catch (err) {
    responderError(err, res);
  }
}

async function login(req, res) {
  try {
    const resultado = await authService.iniciarSesion(req.body || {});
    res.status(200).json(resultado);
  } catch (err) {
    responderError(err, res);
  }
}

// El usuario sale del token validado, nunca de un id enviado por el cliente
function perfil(req, res) {
  res.status(200).json(req.usuario);
}

module.exports = { registrar, login, perfil };
