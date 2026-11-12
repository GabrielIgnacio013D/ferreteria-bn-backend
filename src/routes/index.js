const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const productosRoutes = require('./productos.routes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/productos', productosRoutes);
// Próximos módulos: categorias, solicitudes, usuarios (administración)

module.exports = router;
