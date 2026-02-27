// routes/reportes.routes.js
const express = require("express");
const router = express.Router();

const reportesController = require("../controllers/reportesController");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");

// Solo admin/superAdmin
router.get(
  "/eventos/:id/resumen",
  verifyToken,
  verifyRole("admin", "superAdmin"),
  reportesController.getResumenEvento
);

router.get(
  "/eventos/:id/ventas",
  verifyToken,
  verifyRole("admin", "superAdmin"),
  reportesController.getVentasEvento
);

module.exports = router;