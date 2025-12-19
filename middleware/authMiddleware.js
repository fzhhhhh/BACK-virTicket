const jwt = require("jsonwebtoken");
const { ROLES } = require("../config/constants");

// Función auxiliar para extraer y verificar el token
function getDecodedToken(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Verificación general de token
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("🔐 Authorization header:", authHeader);

  const decoded = getDecodedToken(req);
  console.log("🔓 Token decodificado:", decoded);

  if (!decoded) {
    return res.status(401).json({ mensaje: "Token inválido, expirado o no enviado" });
  }

  req.usuario = decoded;
  next();
};

// Verificación específica para admin
exports.verifyAdmin = (req, res, next) => {
  const decoded = getDecodedToken(req);
  if (!decoded) {
    return res.status(401).json({ mensaje: "Token inválido, expirado o no enviado" });
  }
  if (decoded.role !== ROLES.ADMIN) {
    return res.status(403).json({ mensaje: "Acceso denegado: solo administradores" });
  }
  req.usuario = decoded;
  next();
};

// Middleware genérico para verificar uno o varios roles
exports.verifyRole = (...rolesEsperados) => {
  return (req, res, next) => {
    const decoded = getDecodedToken(req);
    if (!decoded) {
      return res.status(401).json({ mensaje: "Token inválido, expirado o no enviado" });
    }
    if (!rolesEsperados.includes(decoded.role)) {
      return res.status(403).json({ mensaje: `Acceso denegado: se requiere rol ${rolesEsperados.join(" o ")}` });
    }
    req.usuario = decoded;
    next();
  };
};