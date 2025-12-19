const pool = require("../config/db");

// Obtener todos los usuarios
const getUsuarios = async (req, res) => {
  try {
    // Excluye el campo contraseña
    const [usuarios] = await pool.query(
      "SELECT id, nombre, correo, role, creado_en FROM usuarios"
    );
    res.json(usuarios);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// Eliminar un usuario por ID
const deleteUsuario = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const [resultado] = await pool.query("DELETE FROM usuarios WHERE id = ?", [id]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};


//  CAMBIAR ROL

const { ROLES_PERMITIDOS } = require("../config/constants");

const asignarRol = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  if (!rol) {
    return res.status(400).json({ error: "El campo 'rol' es obligatorio." });
  }

  if (!ROLES_PERMITIDOS.includes(rol)) {
    return res.status(400).json({ error: `Rol inválido. Roles permitidos: ${ROLES_PERMITIDOS.join(", ")}` });
  }

  try {
    const [resultado] = await pool.query(
      "UPDATE usuarios SET role = ? WHERE id = ?",
      [rol, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json({ success: true, mensaje: `Rol actualizado para el usuario ${id}` });
  } catch (error) {
    console.error("❌ Error al asignar rol:", error);
    res.status(500).json({ error: "Error al actualizar el rol del usuario" });
  }
};


module.exports = {
  getUsuarios,
  deleteUsuario,
  asignarRol,
};