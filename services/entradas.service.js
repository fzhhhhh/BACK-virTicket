const pool = require("../config/db");
const { generarCodigoQR } = require("./qr.service");

const generarEntradasPorVenta = async (venta) => {
  const { id, evento_id, cantidad } = venta;

  for (let i = 0; i < cantidad; i++) {
    const { token } = await generarCodigoQR({
      venta_id: id,
      evento_id,
    });

    await pool.query(
      `INSERT INTO entradas (evento_id, venta_id, codigo_qr, estado)
       VALUES (?, ?, ?, 'valida')`,
      [evento_id, id, token]
    );
  }
};

module.exports = {
  generarEntradasPorVenta,
};