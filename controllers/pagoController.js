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

    // ✅ CLAVE: esto llega en paymentData.external_reference
    external_reference: String(usuario_id),

    // ✅ metadata para multi-evento
    metadata: {
      usuario_id,                 // lo dejamos también
      email_cliente,
      carrito: items.map((i) => ({
        evento_id: i.evento_id,   // IMPORTANTE: ahora cada item debe traer evento_id
        title: i.title,
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
      })),
    },

    back_urls: {
      success: `${process.env.APP_URL}/pago-exitoso`,
      failure: `${process.env.APP_URL}/pago-error`,
      pending: `${process.env.APP_URL}/pago-pendiente`,
    },

    notification_url: process.env.MP_WEBHOOK_URL,
  },
});

    res.json({
      mp_preference_id: response.id,
      init_point: response.init_point,
    });

  } catch (error) {
    console.log("🔔 Webhook URL:", process.env.MP_WEBHOOK_URL);
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

// sleep simple
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const webhookMercadoPago = async (req, res) => {
  try {

    console.log("📩 WEBHOOK HIT", {
  method: req.method,
  url: req.originalUrl,
  query: req.query,
  body: req.body,
  headers: {
    "content-type": req.headers["content-type"],
    "user-agent": req.headers["user-agent"],
  },
});
    const topic = req.body?.type || req.body?.topic || req.query?.topic;

    // 1) Ignorar merchant_order (evita spam)
    if (topic === "merchant_order") {
      return res.sendStatus(200);
    }

    // 2) Obtener paymentId de todas las variantes
    let paymentId =
      req.body?.data?.id ||
      req.query?.id ||
      req.body?.resource;

    // Si resource viene como URL o no es un id numérico, ignorar
    if (!paymentId) return res.sendStatus(200);
    paymentId = String(paymentId);

    if (paymentId.includes("merchant_orders") || isNaN(Number(paymentId))) {
      return res.sendStatus(200);
    }

    // 3) Intentar obtener el pago con retry (evita 404 por “no listo”)
    const payment = new Payment(client);

    let paymentData = null;
    for (let i = 0; i < 6; i++) {
      try {
        paymentData = await payment.get({ id: paymentId });
        break;
      } catch (err) {
        const status = err?.status || err?.response?.status;
        // 404 frecuente por carrera: reintentar y NO loguear como error
        if (status === 404 && i < 5) {
          await sleep(900);
          continue;
        }
        console.error("❌ Webhook MP (get payment):", err);
        return res.sendStatus(200);
      }
    }

    if (!paymentData) return res.sendStatus(200);

    const {
      status,
      transaction_amount,
      metadata,
      payment_method_id,
      payer,
      id,
      external_reference,
    } = paymentData;

    // 4) Solo aprobados
    if (status !== "approved") return res.sendStatus(200);

    // 5) Dedupe
    const [existente] = await pool.query(
      "SELECT id FROM ventas WHERE mp_payment_id = ?",
      [String(id)]
    );
    if (existente.length > 0) {
      console.log("⚠️ Pago duplicado", String(id));
      return res.sendStatus(200);
    }

    // 6) Usuario id confiable
    const usuario_id =
      metadata?.usuario_id ??
      (external_reference ? Number(external_reference) : null);

    if (!usuario_id) {
      console.log("⚠️ Pago aprobado pero sin usuario_id/external_reference. Se ignora.");
      return res.sendStatus(200);
    }

    // 7) Multi-evento: carrito en metadata
    const carrito = Array.isArray(metadata?.carrito) ? metadata.carrito : [];
    const cantidadTotal = carrito.length
      ? carrito.reduce((acc, it) => acc + Number(it.quantity || 0), 0)
      : (metadata?.cantidad || 1);

    const email_cliente = metadata?.email_cliente || payer?.email || null;

    const [result] = await pool.query(
      `INSERT INTO ventas (
        usuario_id, evento_id, cantidad, total, estado_pago,
        email_cliente, mp_payment_id, metodo_pago
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id,
        carrito[0]?.evento_id ?? metadata?.evento_id ?? null,
        cantidadTotal,
        Number(transaction_amount || 0),
        "aprobado",
        email_cliente,
        String(id),
        payment_method_id || null,
      ]
    );

    if (carrito.length) {
      for (const it of carrito) {
        await generarEntradasPorVenta({
          id: result.insertId,
          evento_id: Number(it.evento_id),
          cantidad: Number(it.quantity || 1),
        });
      }
    } else {
      await generarEntradasPorVenta({
        id: result.insertId,
        evento_id: metadata?.evento_id,
        cantidad: metadata?.cantidad || 1,
      });
    }

    console.log("✅ Venta registrada + entradas generadas", String(id));
    return res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook MP:", error);
    return res.sendStatus(200); // MP reintenta; mejor 200 para evitar loops
  }
};


module.exports = {
  crearPreferencia,
  registrarPago,
  webhookMercadoPago,
};