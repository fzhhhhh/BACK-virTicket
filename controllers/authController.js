const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Registro de usuario
exports.registerUser = async (req, res) => {
  const { nombre, correo, contraseña } = req.body;

  if (!nombre || !correo || !contraseña) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
  }

  try {
    const [[userExists]] = await pool.query("SELECT id FROM usuarios WHERE correo = ?", [correo]);
    if (userExists) {
      return res.status(400).json({ mensaje: "Correo ya registrado" });
    }

    const hashedPassword = await bcrypt.hash(contraseña, 10);
    await pool.query(
      "INSERT INTO usuarios (nombre, correo, contraseña) VALUES (?, ?, ?)",
      [nombre, correo, hashedPassword]
    );

    res.status(201).json({ mensaje: "Usuario registrado correctamente" });
  } catch (error) {
    console.error("❌ Error en registro:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};


// Inicio de sesión
exports.loginUser = async (req, res) => {
  const { correo, contraseña } = req.body;

  if (!correo || !contraseña) {
    return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
  }

  try {
    const [[usuario]] = await pool.query(
      "SELECT id, nombre, correo, contraseña, role FROM usuarios WHERE correo = ?", [correo]
    );

    if (!usuario) {
      return res.status(400).json({ mensaje: "Correo no encontrado" });
    }

    const match = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!match) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await pool.query(
      "UPDATE usuarios SET token = ? WHERE id = ?",
      [token, usuario.id]
    );

    res.json({
      token,
      role: usuario.role,
      correo: usuario.correo,
      id: usuario.id,
      nombre: usuario.nombre
    });

  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// Eliminar usuario
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ mensaje: "Se requiere un ID de usuario" });
  }

  try {
    const [resultado] = await pool.query("DELETE FROM usuarios WHERE id = ?", [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

// Actualizar datos del usuario autenticado
exports.updateUserData = async (req, res) => {
  const { id } = req.usuario; // ID desde el token
  const { nombre, correo, contraseña } = req.body;

  if (!nombre && !correo && !contraseña) {
    return res.status(400).json({ mensaje: "No se enviaron datos para actualizar" });
  }

  try {
    const campos = [];
    const valores = [];

    if (nombre) {
      campos.push("nombre = ?");
      valores.push(nombre);
    }

    if (correo) {
      campos.push("correo = ?");
      valores.push(correo);
    }

    if (contraseña) {
      const hashed = await bcrypt.hash(contraseña, 10);
      campos.push("contraseña = ?");
      valores.push(hashed);
    }

    valores.push(id); // Para el WHERE

    const query = `UPDATE usuarios SET ${campos.join(", ")} WHERE id = ?`;
    await pool.query(query, valores);

    res.json({ mensaje: "Datos actualizados correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar datos:", error);
    res.status(500).json({ error: "Error al actualizar datos del usuario" });
  }
};