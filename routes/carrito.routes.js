const express = require("express");
const router = express.Router();
const carritoController = require("../controllers/carritoController");

// Crear carrito (por cliente)
router.post("/", carritoController.crearCarrito);

// Obtener carrito por cliente id
router.get("/cliente/:clienteId", carritoController.obtenerCarrito);

// Agregar item al carrito
router.post("/item", carritoController.agregarItem);

// Actualizar item (cantidad)
router.put("/item/:itemId", carritoController.actualizarItem);

// Eliminar item
router.delete("/item/:itemId", carritoController.eliminarItem);

// Vaciar carrito
router.delete("/vaciar/:carritoId", carritoController.vaciarCarrito);

module.exports = router;