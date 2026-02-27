// controllers/reportesController.js
const pool = require("../config/db");

// GET /api/reportes/eventos/:id/resumen
exports.getResumenEvento = async (req, res) => {
  try {
    const { id } = req.params;

    // Ventas APROBADAS => recaudación real
    const [resumenRows] = await pool.query(
      `SELECT
        e.id AS evento_id,
        e.nombre,
        COUNT(v.id) AS ventas,
        COALESCE(SUM(v.cantidad), 0) AS entradas_vendidas,
        COALESCE(SUM(v.total), 0) AS recaudado
      FROM eventos e
      LEFT JOIN ventas v
        ON v.evento_id = e.id
       AND v.estado_pago = 'aprobado'
      WHERE e.id = ?
      GROUP BY e.id, e.nombre`,
      [id]
    );

    if (!resumenRows.length) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    const [estadoEntradasRows] = await pool.query(
      `SELECT
        SUM(CASE WHEN estado = 'valida' THEN 1 ELSE 0 END) AS validas,
        SUM(CASE WHEN estado = 'usada'  THEN 1 ELSE 0 END) AS usadas
      FROM entradas
      WHERE evento_id = ?`,
      [id]
    );

    res.json({
      resumen: resumenRows[0],
      estadoEntradas: estadoEntradasRows[0] || { validas: 0, usadas: 0 },
    });
  } catch (err) {
    console.error("❌ getResumenEvento:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// GET /api/reportes/eventos/:id/ventas
exports.getVentasEvento = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
        v.id,
        v.fecha,
        v.cantidad,
        v.total,
        v.estado_pago,
        v.metodo_pago,
        v.email_cliente,
        u.nombre AS comprador
      FROM ventas v
      JOIN usuarios u ON u.id = v.usuario_id
      WHERE v.evento_id = ?
      ORDER BY v.fecha DESC`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ getVentasEvento:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};