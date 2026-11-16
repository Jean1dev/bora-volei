export type PaymentsConfig = {
  baseUrl: string;
  apiKey: string;
  readTimeoutMs: number;
};

export function paymentsConfig(): PaymentsConfig {
  return {
    baseUrl: (process.env.PIX_API_URL ?? "").replace(/\/+$/, ""),
    apiKey: process.env.PIX_API_KEY ?? "",
    readTimeoutMs: Number(process.env.PIX_READ_TIMEOUT_MS ?? "35000"),
  };
}
