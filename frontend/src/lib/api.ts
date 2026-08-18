export function getApiBaseUrl(): string {
  const fallback = "http://localhost:8000";
  return process.env.NEXT_PUBLIC_API_URL || fallback;
}
