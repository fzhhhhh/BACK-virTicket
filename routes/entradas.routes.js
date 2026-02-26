const express = require("express");
const router = express.Router();

const entradasController = require("../controllers/entradasController");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");

// Mis entradas (usuario logueado)
router.get("/mis", verifyToken, entradasController.getMisEntradas);

// Validar entrada (solo admin/superAdmin)
router.post(
  "/validar",
  verifyToken,
  verifyRole("admin", "superAdmin"),
  entradasController.validarEntrada
);

module.exports = router;