import { NextResponse } from "next/server";
import { produtoPorDuracao } from "@/lib/payments/produtos";
import { criarPaymentLinkStripe, StripePaymentLinkApiError } from "@/lib/payments/stripe-client";

const QUANTITY_MAX = 20;

type Body = {
  duracao?: string;
  quantity?: number;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const produto = produtoPorDuracao(typeof body.duracao === "string" ? body.duracao : "");
  if (!produto) {
    return NextResponse.json({ error: "Duração inválida" }, { status: 422 });
  }

  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > QUANTITY_MAX) {
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 422 });
  }

  try {
    const paymentLink = await criarPaymentLinkStripe({
      quantity,
      priceId: produto.priceId,
      externalReferenceId: crypto.randomUUID(),
    });

    if (!paymentLink.url) {
      return NextResponse.json({ error: "Link de pagamento indisponível" }, { status: 502 });
    }

    return NextResponse.json({ url: paymentLink.url, id: paymentLink.id });
  } catch (e) {
    console.error("[pagamento/checkout]", e);
    const msg = e instanceof StripePaymentLinkApiError ? e.message : "Falha ao criar checkout";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
