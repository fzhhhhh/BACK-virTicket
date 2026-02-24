const pool = require("../config/db");
const { generarEntradasPorVenta } = require("../services/entradas.service");
const { MercadoPagoConfig, Preference } = require("mercadopago");

// ================================
// CONFIG MERCADO PAGO (SDK NUEVO)
// ================================
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});
console.log("🟢 MP TOKEN:", process.env.MP_ACCESS_TOKEN);

// ================================
// CREAR PREFERENCIA
// ================================
const crearPreferencia = async (req, res) => {
  try {
    const { items, usuario_id, evento_id, email_cliente } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items inválidos" });
    }

    const preference = new Preference(client);

    const response = await preference.create({
  body: {
    items: items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      currency_id: "ARS",
    })),

    payer: { email: email_cliente },

    metadata: {
      usuario_id,
      evento_id,
      cantidad: items.reduce((acc, i) => acc + i.quantity, 0),
    },

  back_urls: {
  success: "http://localhost:3000/pago-exitoso",
  failure: "http://localhost:3000/pago-error",
  pending: "http://localhost:3000/pago-pendiente",
},

    //auto_return: "approved",

    //  FUERA de back_urls
    notification_url:
      "https://odontoid-colacobiotic-sadie.ngrok-free.dev/api/pago/webhook",
  },
});

    res.json({
      mp_preference_id: response.id,
      init_point: response.init_point,
    });

  } catch (error) {
    console.error("❌ crearPreferencia:", error);
    res.status(500).json({ error: "Error al crear preferencia" });
  }
};

// ================================
// REGISTRAR PAGO / VENTA
// ================================
const registrarPago = async (req, res) => {
  try {
    const {
      usuario_id,
      evento_id,
      cantidad,
      total,
      estado_pago,
      email_cliente,
      mp_preference_id,
      mp_payment_id,
      metodo_pago,
      datos_extra,
    } = req.body;

    if (!usuario_id || !evento_id || total == null) {
      return res.status(400).json({ error: "Datos obligatorios faltantes" });
    }

    const [result] = await pool.query(
      `INSERT INTO ventas (
        usuario_id, evento_id, cantidad, total, estado_pago,
        email_cliente, mp_preference_id, mp_payment_id, metodo_pago, datos_extra
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id,
        evento_id,
        cantidad,
        total,
        estado_pago,
        email_cliente,
        mp_preference_id,
        mp_payment_id,
        metodo_pago,
        datos_extra ? JSON.stringify(datos_extra) : null,
      ]
    );

    if (estado_pago === "aprobado") {
      await generarEntradasPorVenta({
        id: result.insertId,
        evento_id,
        cantidad,
      });
    }

    res.status(201).json({ ok: true, ventaId: result.insertId });
  } catch (error) {
    console.error("❌ registrarPago:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


// CONTROLADOR WEBHOOK MERCADO PAGO
const { Payment } = require("mercadopago");

const webhookMercadoPago = async (req, res) => {
  try {
    console.log("📩 WEBHOOK RECIBIDO");
    console.log(req.body, req.query);

    const paymentId =
      req.body?.data?.id || req.query?.id;

    if (!paymentId) {
      return res.sendStatus(200);
    }

    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    const {
      status,
      transaction_amount,
      metadata,
      payment_method_id,
      payer,
      id,
    } = paymentData;

    if (status !== "approved") {
      return res.sendStatus(200);
    }

    const [existente] = await pool.query(
      "SELECT id FROM ventas WHERE mp_payment_id = ?",
      [id]
    );

    if (existente.length > 0) {
      console.log("⚠️ Pago duplicado");
      return res.sendStatus(200);
    }

    const [result] = await pool.query(
      `INSERT INTO ventas (
        usuario_id,
        evento_id,
        cantidad,
        total,
        estado_pago,
        email_cliente,
        mp_payment_id,
        metodo_pago
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        metadata.usuario_id,
        metadata.evento_id,
        metadata.cantidad || 1,
        transaction_amount,
        "aprobado",
        payer.email,
        id,
        payment_method_id,
      ]
    );

    await generarEntradasPorVenta({
      id: result.insertId,
      evento_id: metadata.evento_id,
      cantidad: metadata.cantidad || 1,
    });

    console.log("✅ Venta registrada");

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook MP:", error);
    res.sendStatus(500);
  }
};

module.exports = {
  crearPreferencia,
  registrarPago,
  webhookMercadoPago,
};