const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');

router.use('/health', healthRoutes);
// Próximos módulos: auth, productos, categorias, solicitudes, usuarios

module.exports = router;
