const ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "superAdmin"
};

module.exports = {
  ROLES,
  ROLES_PERMITIDOS: Object.values(ROLES)
};