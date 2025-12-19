const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    req.usuario = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.usuario = null;
  }
  next();
};