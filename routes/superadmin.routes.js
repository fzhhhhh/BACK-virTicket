const express = require("express");
const router = express.Router();
const { verifyRole } = require("../middleware/authMiddleware");
const { getAllUsers, deleteUser,deleteEvent,getEventById } = require("../controllers/superAdminController");



// Obtener todos los usuarios (solo super-admin)
router.get("/usuarios", verifyRole("superAdmin"), getAllUsers);

// Eliminar usuario por ID (solo super-admin)
router.delete("/usuarios/:id", verifyRole("superAdmin"), deleteUser);

// Eliminar eventos por ID
router.delete("/eventos/:id", verifyRole("admin", "superAdmin"), deleteEvent);

// Obtener un evento por ID
router.get("/:id", getEventById);

module.exports = router;