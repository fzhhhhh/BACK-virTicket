const pool = require("../config/db");

// Obtener carrito de un cliente (y sus items)
exports.obtenerCarrito = async (req, res) => {
  try {
    const { clienteId } = req.params;
    // buscar carrito
    const [carritoRows] = await pool.query("SELECT * FROM carrito WHERE id_cliente = ?", [clienteId]);
    if (carritoRows.length === 0) return res.json({ carrito: null, items: [] });

    const carrito = carritoRows[0];
    const [items] = await pool.query(
      `SELECT ci.id, ci.id_carrito, ci.id_evento, ci.cantidad, ci.precio_unitario, ci.total,
              e.nombre, e.imagen, e.disponible
       FROM carritoItems ci
       JOIN eventos e ON e.id = ci.id_evento
       WHERE ci.id_carrito = ?`,
      [carrito.id]
    );

    res.json({ carrito, items });
  } catch (error) {
    console.error("obtenerCarrito:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

exports.crearCarrito = async (req, res) => {
  try {
    const { clienteId } = req.body;
    const fecha = new Date();
    const [result] = await pool.query("INSERT INTO carrito (id_cliente, fecha_creacion) VALUES (?, ?)", [clienteId, fecha]);
    res.status(201).json({ carritoId: result.insertId });
  } catch (error) {
    console.error("crearCarrito:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

exports.agregarItem = async (req, res) => {
  try {
    const { id_carrito, id_evento, cantidad = 1, precio_unitario } = req.body;

    // Comprobar disponibilidad del evento
    const [ev] = await pool.query("SELECT disponible, precio FROM eventos WHERE id = ?", [id_evento]);
    if (ev.length === 0) return res.status(404).json({ error: "Evento no encontrado" });
    const available = !!ev[0].disponible;
    const precio = precio_unitario ?? ev[0].precio ?? 0;
    if (!available) return res.status(400).json({ error: "Evento no disponible" });

    // Si item ya existe en carrito, sumar cantidad
    const [exist] = await pool.query("SELECT * FROM carritoItems WHERE id_carrito = ? AND id_evento = ?", [id_carrito, id_evento]);
    if (exist.length > 0) {
      const nuevoTotal = (exist[0].cantidad + cantidad) * precio;
      await pool.query("UPDATE carritoItems SET cantidad = cantidad + ?, total = ? WHERE id = ?", [cantidad, nuevoTotal, exist[0].id]);
      return res.json({ ok: true });
    }

    const total = cantidad * precio;
    await pool.query(
      "INSERT INTO carritoItems (id_carrito, id_evento, cantidad, precio_unitario, total) VALUES (?, ?, ?, ?, ?)",
      [id_carrito, id_evento, cantidad, precio, total]
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("agregarItem:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

exports.actualizarItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { cantidad } = req.body;
    if (!Number.isInteger(cantidad) || cantidad < 1) return res.status(400).json({ error: "Cantidad inválida" });

    // obtener precio_unitario
    const [rows] = await pool.query("SELECT precio_unitario FROM carritoItems WHERE id = ?", [itemId]);
    if (rows.length === 0) return res.status(404).json({ error: "Item no encontrado" });
    const precio = Number(rows[0].precio_unitario) || 0;
    const total = precio * cantidad;
    await pool.query("UPDATE carritoItems SET cantidad = ?, total = ? WHERE id = ?", [cantidad, total, itemId]);
    res.json({ ok: true });
  } catch (error) {
    console.error("actualizarItem:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

exports.eliminarItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await pool.query("DELETE FROM carritoItems WHERE id = ?", [itemId]);
    res.json({ ok: true });
  } catch (error) {
    console.error("eliminarItem:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

exports.vaciarCarrito = async (req, res) => {
  try {
    const { carritoId } = req.params;
    await pool.query("DELETE FROM carritoItems WHERE id_carrito = ?", [carritoId]);
    res.json({ ok: true });
  } catch (error) {
    console.error("vaciarCarrito:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};