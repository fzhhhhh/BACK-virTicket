const express = require("express");
const router = express.Router();
const pagoController = require("../controllers/pagoController");
const { verifyToken } = require("../middleware/authMiddleware");

// Crear preferencia
router.post("/crear-preferencia", verifyToken, pagoController.crearPreferencia);

// Registrar pago / venta
router.post("/registrar", verifyToken, pagoController.registrarPago);

// Webhook Mercado Pago (NO lleva verifyToken)
router.post("/webhook", pagoController.webhookMercadoPago);

module.exports = router;

