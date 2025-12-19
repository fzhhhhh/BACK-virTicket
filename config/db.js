require("dotenv").config();
const mysql = require("mysql2/promise");

const requiredVars = ["DB_HOST", "DB_USER", "DB_NAME"];
const missingVars = requiredVars.filter((v) => !process.env[v]);
if (missingVars.length) {
  console.warn(`⚠️  Faltan variables de entorno: ${missingVars.join(", ")}. Se usarán valores por defecto.`);
}

// Configuración de conexión
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "admin123456",
  database: process.env.DB_NAME || "entradas2",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(process.env.DB_SSL === "true" && {
    ssl: { rejectUnauthorized: false },
  }),
});

// Probar la conexión al iniciar el servidor
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Conexión a la base de datos MySQL exitosa");
    connection.release();
  } catch (err) {
    console.error(`❌ Error al conectar a MySQL: ${err.code} - ${err.message}`);
    process.exit(1); // Detiene la app si no hay conexión
  }
})();

module.exports = pool;