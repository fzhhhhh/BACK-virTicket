const pool = require("../config/db");


// Controlador para obtener las entradas de un usuario

exports.getMisEntradas = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;

    const [rows] = await pool.query(
      `
      SELECT 
        en.id,
        en.codigo_qr,
        en.estado,
        en.evento_id,
        en.venta_id,
        ev.nombre,
        ev.fecha,
        ev.horario,
        ev.lugar,
        ev.imagen
      FROM entradas en
      JOIN ventas v ON en.venta_id = v.id
      JOIN eventos ev ON en.evento_id = ev.id
      WHERE v.usuario_id = ?
      ORDER BY en.id DESC
      `,
      [usuario_id]
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ getMisEntradas:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

 // Controlador para validar una entrada usando el código QR

exports.validarEntrada = async (req, res) => {
  try {
    const { codigo_qr } = req.body;

    if (!codigo_qr) {
      return res.status(400).json({ error: "codigo_qr es obligatorio" });
    }

    const [rows] = await pool.query(
      `SELECT id, estado, evento_id, venta_id
       FROM entradas
       WHERE codigo_qr = ?
       LIMIT 1`,
      [codigo_qr]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Entrada no encontrada" });
    }

    const entrada = rows[0];

    if (entrada.estado === "usada") {
      return res.status(409).json({ ok: false, error: "Entrada ya fue usada", entradaId: entrada.id });
    }

    await pool.query(
      `UPDATE entradas
       SET estado = 'usada', usada_en = NOW(), usada_por = ?
       WHERE id = ?`,
      [req.usuario.id, entrada.id]
    );

    return res.json({
      ok: true,
      mensaje: "✅ Entrada validada",
      entradaId: entrada.id,
      evento_id: entrada.evento_id,
      venta_id: entrada.venta_id,
    });
  } catch (error) {
    console.error("❌ validarEntrada:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};