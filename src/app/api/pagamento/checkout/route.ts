import { NextResponse } from "next/server";
import { valorCobranca } from "@/lib/format";
import { getJogo } from "@/lib/jogos";
import { criarCheckoutStripe, StripeCheckoutApiError } from "@/lib/payments/stripe-client";

const QUANTITY_MAX = 20;
const VALOR_MINIMO = 0.5;

type Body = {
  slug?: string;
  quantity?: number;
};

function origem(req: Request) {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  return configurada || new URL(req.url).origin;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug : "";
  const quantity = Number(body.quantity);
  if (!slug || !Number.isInteger(quantity) || quantity < 1 || quantity > QUANTITY_MAX) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 422 });
  }

  try {
    const jogo = await getJogo(slug);
    if (!jogo) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });

    const confirmados = Math.min(jogo.inscritos, jogo.vagas);
    const amount = valorCobranca(Number(jogo.valor) || null, confirmados, quantity);
    if (amount == null) {
      return NextResponse.json({ error: "O rateio ainda não fechou" }, { status: 422 });
    }
    if (amount < VALOR_MINIMO) {
      return NextResponse.json({ error: "O valor mínimo do cartão é R$ 0,50" }, { status: 422 });
    }

    const base = `${origem(req)}/j/${slug}/pagar`;
    const pessoas = quantity === 1 ? "1 pessoa" : `${quantity} pessoas`;
    const checkout = await criarCheckoutStripe({
      amount,
      description: `Vôlei — ${jogo.titulo} (${pessoas})`,
      externalReferenceId: `${slug}:${crypto.randomUUID()}`,
      successUrl: `${base}?pago=1`,
      cancelUrl: base,
    });

    if (!checkout.url) {
      return NextResponse.json({ error: "Link de pagamento indisponível" }, { status: 502 });
    }

    return NextResponse.json({ url: checkout.url, id: checkout.id, amount });
  } catch (e) {
    console.error("[pagamento/checkout]", e);
    const msg = e instanceof StripeCheckoutApiError ? e.message : "Falha ao criar checkout";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
