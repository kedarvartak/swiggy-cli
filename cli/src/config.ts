import process from "node:process";

export interface BackendConfig {
  baseUrl: string;
}

export function loadBackendConfig(): BackendConfig {
  const baseUrl = process.env.SWIGGY_BACKEND_URL?.trim() || "http://127.0.0.1:8000";
  return { baseUrl: baseUrl.replace(/\/+$/, "") };
}
