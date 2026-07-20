export const ROLE_PERMISSIONS = {
  admin: ["dashboard", "upload", "train", "predict", "alerts", "history"],
  analyst: ["dashboard", "upload", "train", "predict", "alerts", "history"],
  viewer: ["dashboard", "alerts", "history"],
};

export const hasPermission = (permission) => {
  const role = localStorage.getItem("netshield_role");
  return ROLE_PERMISSIONS[role]?.includes(permission);
};