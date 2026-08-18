export function getApiBaseUrl(): string {
  const fallback = "http://127.0.0.1:8000";
  return process.env.NEXT_PUBLIC_API_URL || fallback;
}
