require("dotenv").config();
const mysql = require("mysql2/promise");

const requiredVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingVars = requiredVars.filter((v) => !process.env[v]);
if (missingVars.length) {
  console.error(`❌ Faltan variables de entorno: ${missingVars.join(", ")}`);
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Log para verificar qué DB está usando REALMENTE
console.log("🧾 DB CONFIG:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

(async () => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT DATABASE() AS db");
    console.log("✅ MySQL OK. DB activa:", rows?.[0]?.db);
    connection.release();
  } catch (err) {
    console.error(`❌ Error al conectar a MySQL: ${err.code} - ${err.message}`);
    process.exit(1);
  }
})();

module.exports = pool;