const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { verifyToken } = require('../middleware/authMiddleware');

// Crear preferencia de pago (requiere token)
router.post('/crear-preferencia', verifyToken, pagoController.crearPreferencia);

// Obtener pagos por usuario (requiere token)
router.get('/usuario/:usuario_id', verifyToken, pagoController.obtenerPagosPorUsuario);

// Registrar una venta (requiere token)
router.post('/registrar', verifyToken, pagoController.registrarVentaSimulada);

module.exports = router;