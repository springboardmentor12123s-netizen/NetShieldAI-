export const ROLE_PERMISSIONS = {
  admin: ["dashboard", "upload", "train", "predict", "alerts", "history", "reports"],
  analyst: ["dashboard", "upload", "train", "predict", "alerts", "history", "reports"],
  viewer: ["dashboard", "alerts", "history", "reports"],
};

export const hasPermission = (permission) => {
  const role = localStorage.getItem("netshield_role");
  return ROLE_PERMISSIONS[role]?.includes(permission);
};