const authService = require('../services/auth.service');
const usuariosRepository = require('../repositories/usuarios.repository');

// Verifica el JWT (firma, algoritmo, expiración, emisor y destinatario) y carga al usuario desde la base
async function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token ausente o inválido' });
  }
  try {
    const payload = authService.verificarToken(token);
    const usuario = await usuariosRepository.buscarPorId(Number(payload.sub));
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Token ausente o inválido' });
    }
    req.usuario = { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token ausente o inválido' });
  }
}

// Permite el paso solo a los roles indicados
function requerirRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }
    next();
  };
}

module.exports = { autenticar, requerirRol };
