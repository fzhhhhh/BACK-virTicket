const express = require("express");
const router = express.Router();
const lugaresController = require("../controllers/lugaresController");

// GET /api/lugares - Obtener lugares únicos de eventos
router.get("/", lugaresController.getLugaresUnicos);

module.exports = router;