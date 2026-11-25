import { paymentsConfig } from "./config";

export type CriarCheckoutStripeInput = {
  amount: number;
  description: string;
  externalReferenceId: string;
  successUrl: string;
  cancelUrl: string;
};

export type CriarCheckoutStripeOutput = {
  url?: string;
  id?: string;
};

export class StripeCheckoutApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeCheckoutApiError";
  }
}

export async function criarCheckoutStripe(input: CriarCheckoutStripeInput): Promise<CriarCheckoutStripeOutput> {
  const cfg = paymentsConfig();
  if (!cfg.baseUrl) throw new StripeCheckoutApiError("PIX_API_URL não configurada");
  if (!cfg.apiKey) throw new StripeCheckoutApiError("PIX_API_KEY não configurada");

  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/stripe/checkout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-API-KEY": cfg.apiKey,
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: "brl",
        description: input.description,
        externalReferenceId: input.externalReferenceId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      }),
      signal: AbortSignal.timeout(cfg.readTimeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    throw new StripeCheckoutApiError(`Falha ao criar checkout: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { mensagem?: string };
    throw new StripeCheckoutApiError(data.mensagem || `API de pagamento respondeu ${res.status}`);
  }

  return (await res.json().catch(() => ({}))) as CriarCheckoutStripeOutput;
}
