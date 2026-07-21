export function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function formatTime(dateStr) {
  return new Date(dateStr + "Z").toLocaleTimeString();
}

export function formatDateTime(dateStr) {
  return new Date(dateStr + "Z").toLocaleString();
}

export function kb(bytes) {
  return (bytes / 1024).toFixed(1) + "KB";
}
