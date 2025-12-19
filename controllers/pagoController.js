const mercadopago = require('mercadopago');
const client = new mercadopago.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});
const preference = new mercadopago.Preference(client);
const pool = require('../config/db');

// Crear preferencia de pago de Mercado Pago
exports.crearPreferencia = async (req, res) => {
  try {
    const items = req.body.items;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items inválidos' });
    }

    const result = await preference.create({ body: { items } });
    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error("❌ Error al crear preferencia:", error);
    res.status(500).json({ error: error.message });
  }
};

// Simular pago y guardar en la base de datos (en tabla 'pagos')
exports.simularPago = async (req, res) => {
  const { usuario_id, evento_id, monto, metodo } = req.body;
  try {
    await pool.query(
      "INSERT INTO pagos (usuario_id, evento_id, monto, metodo, fecha) VALUES (?, ?, ?, ?, NOW())",
      [usuario_id, evento_id, monto, metodo]
    );
    res.json({ mensaje: "Pago simulado y guardado correctamente" });
  } catch (error) {
    console.error("❌ Error al simular pago:", error);
    res.status(500).json({ error: "Error al simular pago" });
  }
};

// Obtener pagos por usuario
exports.obtenerPagosPorUsuario = async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const [pagos] = await pool.query(
      "SELECT * FROM pagos WHERE usuario_id = ? ORDER BY fecha DESC",
      [usuario_id]
    );
    res.json(pagos);
  } catch (error) {
    console.error("❌ Error al obtener pagos:", error);
    res.status(500).json({ error: "Error al obtener pagos" });
  }
};

// Nueva función para registrar ventas simuladas en tabla 'ventas'
exports.registrarVentaSimulada = async (req, res) => {
  const {
    usuario_id,
    evento_id,
    cantidad,
    total,
    estado_pago,
    email_cliente,
    datos_extra
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO ventas (
        usuario_id,
        evento_id,
        cantidad,
        total,
        estado_pago,
        email_cliente,
        datos_extra
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id,
        evento_id,
        cantidad,
        total,
        estado_pago || 'simulado',
        email_cliente,
        JSON.stringify(datos_extra || {})
      ]
    );

    res.status(201).json({
      success: true,
      mensaje: 'Venta registrada correctamente'
    });
  } catch (error) {
    console.error("❌ Error al registrar venta:", error);
    res.status(500).json({ error: 'Error al registrar venta' });
  }
};

const ALLOWED_ESTADOS = ["pendiente", "aprobado", "rechazado"];

// Registrar pago (simulado o webhook)
exports.registrarPago = async (req, res) => {
  try {
    console.log("POST /api/pago/registrar body:", req.body);

    const {
      usuario_id,
      evento_id,
      cantidad = 1,
      total,
      estado_pago,
      email_cliente = null,
      mp_preference_id = null,
      mp_payment_id = null,
      metodo_pago = null,
      datos_extra = null,
    } = req.body;

    if (!usuario_id || !evento_id || typeof total === "undefined") {
      return res.status(400).json({ error: "Faltan datos obligatorios: usuario_id, evento_id o total" });
    }

    const cantidadNum = Number(cantidad) || 1;
    const totalNum = Number(total);
    if (isNaN(totalNum)) return res.status(400).json({ error: "Total inválido" });

    // Normalizar estado_pago: mapear valores no permitidos a 'pendiente'
    let estadoNormalized = String(estado_pago || "").toLowerCase();
    if (estadoNormalized === "simulado" || !ALLOWED_ESTADOS.includes(estadoNormalized)) {
      console.warn("estado_pago no permitido, usando 'pendiente' en su lugar:", estado_pago);
      estadoNormalized = "pendiente";
    }

    let datosExtraString = null;
    try {
      if (typeof datos_extra !== "undefined" && datos_extra !== null) {
        datosExtraString = typeof datos_extra === "string" ? datos_extra : JSON.stringify(datos_extra);
      }
    } catch (err) {
      console.warn("Error serializando datos_extra, se almacena NULL:", err);
      datosExtraString = null;
    }

    const sql = `
      INSERT INTO ventas (
        usuario_id, evento_id, cantidad, total, estado_pago, email_cliente,
        mp_preference_id, mp_payment_id, metodo_pago, datos_extra
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      usuario_id,
      evento_id,
      cantidadNum,
      totalNum,
      estadoNormalized,
      email_cliente,
      mp_preference_id,
      mp_payment_id,
      metodo_pago,
      datosExtraString,
    ];

    const [result] = await pool.query(sql, params);
    console.log("registrarPago - venta insertada id:", result.insertId);
    return res.status(201).json({ ok: true, ventaId: result.insertId });
  } catch (error) {
    console.error("registrarPago ERROR:", error && (error.stack || error.message || error));
    return res.status(500).json({ error: "Error interno del servidor", details: error && (error.message || String(error)) });
  }
};