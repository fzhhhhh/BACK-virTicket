const { v4: uuidv4 } = require("uuid");

// Genera un token único para la entrada
const generarCodigoQR = async (data) => {
  const token = uuidv4();

  return {
    token,
    payload: {
      ...data,
      token,
      created_at: new Date(),
    },
  };
};

module.exports = {
  generarCodigoQR,
};