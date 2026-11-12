const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuarios.repository');

const RONDAS = Number(process.env.BCRYPT_ROUNDS || 10);
// Hash falso para tardar lo mismo cuando el correo no existe (no revelar si la cuenta existe)
const HASH_FALSO = bcrypt.hashSync('clave-falsa-para-igualar-tiempos', RONDAS);
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ErrorNegocio extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

const vigencia = () => process.env.JWT_EXPIRES_IN || '15m';
const opcionesJwt = () => ({
  issuer: process.env.JWT_ISSUER || 'ferreteria-bn-backend',
  audience: process.env.JWT_AUDIENCE || 'ferreteria-bn-frontend'
});

function validarRegistro(datos) {
  const nombre = String(datos.nombre || '').trim();
  const correo = String(datos.correo || '').trim().toLowerCase();
  const password = typeof datos.password === 'string' ? datos.password : '';
  if (nombre.length < 1 || nombre.length > 100) {
    throw new ErrorNegocio(400, 'El nombre es obligatorio (máximo 100 caracteres)');
  }
  if (!REGEX_CORREO.test(correo) || correo.length > 150) {
    throw new ErrorNegocio(400, 'El correo no es válido');
  }
  if (password.length < 8 || password.length > 72) {
    throw new ErrorNegocio(400, 'La contraseña debe tener entre 8 y 72 caracteres');
  }
  return { nombre, correo, password };
}

// El rol lo asigna el servidor: nadie puede registrarse como administrador
async function registrar(datos) {
  const { nombre, correo, password } = validarRegistro(datos);
  const existente = await usuariosRepository.buscarPorCorreo(correo);
  if (existente) throw new ErrorNegocio(409, 'El correo ya está registrado');
  const passwordHash = await bcrypt.hash(password, RONDAS);
  try {
    const usuario = await usuariosRepository.crear({ nombre, correo, passwordHash, rolNombre: 'CLIENTE' });
    return { ...usuario, rol: 'CLIENTE' };
  } catch (err) {
    if (err.code === '23505') throw new ErrorNegocio(409, 'El correo ya está registrado');
    throw err;
  }
}

async function iniciarSesion(datos) {
  const correo = String(datos.correo || '').trim().toLowerCase();
  const password = typeof datos.password === 'string' ? datos.password : '';
  if (!correo || !password) {
    throw new ErrorNegocio(400, 'Correo y contraseña son obligatorios');
  }
  const usuario = await usuariosRepository.buscarPorCorreo(correo);
  const coincide = await bcrypt.compare(password, usuario ? usuario.password_hash : HASH_FALSO);
  if (!usuario || !usuario.activo || !coincide) {
    throw new ErrorNegocio(401, 'Credenciales inválidas');
  }
  // El token solo lleva la identidad (sub); el rol se consulta en la base en cada solicitud
  const accessToken = jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: vigencia(),
    subject: String(usuario.id),
    ...opcionesJwt()
  });
  return { accessToken, tokenType: 'Bearer', expiresIn: vigencia() };
}

function verificarToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
    ...opcionesJwt()
  });
}

module.exports = { registrar, iniciarSesion, verificarToken, ErrorNegocio };
