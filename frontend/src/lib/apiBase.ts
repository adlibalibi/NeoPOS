export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL?.toString()?.replace(/\/$/, "") ||
  "https://neopos-1.onrender.com";

