const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');

router.get('/', productosController.listar);
router.get('/:id', productosController.detalle);

module.exports = router;
