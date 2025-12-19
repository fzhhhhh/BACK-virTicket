const express = require("express");
const router = express.Router();
const {
  getUsuarios,
  deleteUsuario,
  asignarRol,
} = require("../controllers/usuariosController");
const { verifyToken } = require("../middleware/authMiddleware");
const soloSuperAdmin = require("../middleware/soloSuperAdmin");

// Obtener todos los usuarios (solo super-admin autenticado)
router.get("/", verifyToken, soloSuperAdmin, getUsuarios);

// Eliminar un usuario por ID (solo super-admin autenticado)
router.delete("/:id", verifyToken, soloSuperAdmin, deleteUsuario);

// 🔐 Asignar rol a un usuario por ID (nuevo endpoint)
router.put("/:id/rol", verifyToken, soloSuperAdmin, asignarRol);

module.exports = router;