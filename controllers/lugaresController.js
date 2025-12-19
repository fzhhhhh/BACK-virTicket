const pool = require("../config/db");

// Obtener todos los lugares únicos de la tabla eventos
exports.getLugaresUnicos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT DISTINCT lugar FROM eventos WHERE lugar IS NOT NULL AND lugar <> ''");
    const lugares = rows.map(row => row.lugar);
    res.json({ lugares });
  } catch (error) {
    console.error("Error al obtener lugares únicos:", error);
    res.status(500).json({ error: "Error al obtener los lugares" });
  }
};