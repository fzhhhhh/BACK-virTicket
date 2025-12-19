const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  deleteUser,
  updateUserData
} = require("../controllers/authController");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");

// Ruta de registro
router.post("/register", registerUser);

// Ruta de login
router.post("/login", loginUser);

// Ruta protegida: solo superAdmin puede eliminar usuarios
router.delete("/:id", verifyRole("superAdmin"), deleteUser);

// Ruta para actualizar datos del usuario autenticado
router.put("/update", verifyToken, updateUserData);

// Ruta de prueba
router.get("/test", (req, res) => {
  res.status(200).json({ mensaje: "Ruta auth funcionando!" });
});

module.exports = router;