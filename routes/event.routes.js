const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");


router.get("/", optionalAuth, eventsController.listarEventos);

// Listar todos los eventos (admin ve todos, público solo los visibles)
router.get("/", verifyToken, eventsController.listarEventos);

// Obtener evento por id
router.get("/:id", eventsController.obtenerEventoPorId);

// Crear un evento (solo admin / superAdmin)
router.post("/", verifyRole("admin", "superAdmin"), eventsController.crearEvento);

// Actualizar evento (solo admin / superAdmin)
router.put("/:id", verifyRole("admin", "superAdmin"), eventsController.actualizarEvento);

// Eliminar evento (requiere token y rol)
router.delete("/:id", verifyToken, verifyRole("admin", "superAdmin"), eventsController.eliminarEvento);

// Ocultar evento (requiere token y rol)
router.patch("/:id/ocultar", verifyToken, verifyRole("admin", "superAdmin"), eventsController.ocultarEvento);

// Mostrar evento oculto (requiere token y rol)
router.patch("/:id/mostrar", verifyToken, verifyRole("admin", "superAdmin"), eventsController.mostrarEvento);

module.exports = router;