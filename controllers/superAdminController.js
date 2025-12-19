const pool = require("../config/db");

// Obtener todos los usuarios (solo para super-admin)
exports.getAllUsers = async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      "SELECT id, nombre, correo, role, creado_en FROM usuarios"
    );
    res.json({ usuarios });
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ mensaje: "Error al obtener usuarios" });
  }
};

// Eliminar usuario por ID (solo super-admin)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ mensaje: "Se requiere un ID de usuario" });
  }

  try {
    const [resultado] = await pool.query("DELETE FROM usuarios WHERE id = ?", [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ mensaje: "Error al eliminar usuario" });
  }
};


// Obtener todos los eventos (solo para super-admin)

exports.getEvents = async (req, res) => {
  try {
    const [eventos] = await pool.query(
      "SELECT id, nombre, descripcion, lugar, fecha FROM eventos"
    );
    res.json({ eventos });
  } catch (error) {
    console.error("❌ Error al obtener eventos:", error);
    res.status(500).json({ mensaje: "Error al obtener eventos" });
  }
};


// Eliminar un evento
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ mensaje: "Se requiere un ID de evento" });
  }

  try {
    const [resultado] = await pool.query("DELETE FROM eventos WHERE id = ?", [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    res.json({ mensaje: "Evento eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar evento:", error);
    res.status(500).json({ error: "Error al eliminar evento" });
  }
};

// traer eventos por id 

exports.getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM eventos WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Error al obtener evento:", error);
    res.status(500).json({ mensaje: "Error al obtener evento" });
  }
};