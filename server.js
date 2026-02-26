require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();

// Middlewares de autenticación
const { verifyToken, verifyAdmin } = require("./middleware/authMiddleware");

//  Rutas
const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const superAdminRoutes = require("./routes/superadmin.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const pagoRoutes = require("./routes/pago.routes");
const lugaresRoutes = require("./routes/lugares.routes");
const carritoRoutes = require("./routes/carrito.routes");


// Configuración global
const CLIENT_URL = process.env.CLIENT_URL || "*";
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Endpoint raíz para comprobar que el servidor está vivo
app.get("/", (req, res) => {
  res.json({ mensaje: "API funcionando correctamente" });
});

// Rutas públicas y protegidas
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/pago", pagoRoutes);
app.use("/api/lugares", lugaresRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/entradas", require("./routes/entradas.routes"));

// Ruta protegida solo para admins (prueba)
app.get("/api/admin/panel", verifyAdmin, (req, res) => {
  res.json({ mensaje: "Bienvenido al panel de administrador", usuario: req.usuario });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`🌐 CORS permitido para: ${CLIENT_URL}`);
});


//test mercado pago


/* app.get("/test-mp", async (req, res) => {
  try {
    console.log("🟢 MP TOKEN:", process.env.MP_ACCESS_TOKEN);

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Test Mercado Pago",
            quantity: 1,
            unit_price: 100,
          },
        ],
      },
    });

    res.json({
      ok: true,
      preferenceId: result.id,
      init_point: result.init_point,
    });
  } catch (error) {
    console.error("❌ TEST MP ERROR:", error);
    res.status(500).json(error);
  }
});*/