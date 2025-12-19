const { ROLES } = require("../config/constants");

const soloSuperAdmin = (req, res, next) => {
  const role = req.usuario?.role?.replace("-", "_");
  if (role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({ error: "Acceso denegado: solo para super administradores." });
  }
  next();
};

module.exports = soloSuperAdmin;