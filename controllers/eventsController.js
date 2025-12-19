const pool = require("../config/db");

// Listar eventos (admin ve todos, público solo los visibles)
exports.listarEventos = async (req, res) => {
  try {
    const { role } = req.usuario || {};
    console.log("🧠 Rol detectado en listarEventos:", role);
    const esAdmin = role === "admin" || role === "superAdmin";

    const query = esAdmin
      ? "SELECT id, nombre, descripcion, fecha, horario, lugar, precio, imagen, disponible, visible FROM eventos ORDER BY fecha ASC"
      : "SELECT id, nombre, descripcion, fecha, horario, lugar, precio, imagen, disponible, visible FROM eventos WHERE visible = TRUE ORDER BY fecha ASC";

    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("listarEventos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Obtener evento por ID
exports.obtenerEventoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT id, nombre, descripcion, fecha, horario, lugar, precio, imagen, disponible, visible FROM eventos WHERE id = ?",
      [id]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Evento no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error("obtenerEventoPorId:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Crear evento
exports.crearEvento = async (req, res) => {
  try {
    const { nombre, descripcion, fecha, horario, lugar, precio, imagen, disponible } = req.body;
    const [result] = await pool.query(
      "INSERT INTO eventos (nombre, descripcion, fecha, horario, lugar, precio, imagen, disponible, visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)",
      [nombre, descripcion, fecha, horario, lugar, precio, imagen, disponible ? 1 : 0]
    );
    res.status(201).json({
      id: result.insertId,
      nombre,
      descripcion,
      fecha,
      horario,
      lugar,
      precio,
      imagen,
      disponible: !!disponible,
      visible: true
    });
  } catch (error) {
    console.error("crearEvento:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Actualizar evento
exports.actualizarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, fecha, horario, lugar, precio, imagen, disponible } = req.body;
    await pool.query(
      "UPDATE eventos SET nombre = ?, descripcion = ?, fecha = ?, horario = ?, lugar = ?, precio = ?, imagen = ?, disponible = ? WHERE id = ?",
      [nombre, descripcion, fecha, horario, lugar, precio, imagen, disponible ? 1 : 0, id]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error("actualizarEvento:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Eliminar evento (no recomendado si hay ventas)
exports.eliminarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM eventos WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (error) {
    console.error("eliminarEvento:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Ocultar evento sin eliminar
exports.ocultarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE eventos SET visible = FALSE WHERE id = ?", [id]);
    res.status(200).json({ mensaje: "Evento ocultado correctamente" });
  } catch (error) {
    console.error("ocultarEvento:", error);
    res.status(500).json({ error: "Error interno al ocultar el evento" });
  }
};

// Mostrar evento oculto
exports.mostrarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE eventos SET visible = TRUE WHERE id = ?", [id]);
    res.status(200).json({ mensaje: "Evento mostrado correctamente" });
  } catch (error) {
    console.error("mostrarEvento:", error);
    res.status(500).json({ error: "Error interno al mostrar el evento" });
  }
};