import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDiaHora } from "@/lib/format";
import { carregarJogo } from "../dados";
import { PagarView } from "./PagarView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/j/[slug]/pagar">): Promise<Metadata> {
  const dados = await carregarJogo((await params).slug);
  if (!dados) return { title: "Pagamento · Bora Vôlei" };
  const { jogo } = dados;
  return {
    title: `Pagar · ${jogo.titulo}`,
    description: `Pagamento do jogo ${jogo.titulo} — ${formatDiaHora(jogo.data_hora)}. PIX, crédito ou carteira digital.`,
  };
}

export default async function Page({ params, searchParams }: PageProps<"/j/[slug]/pagar">) {
  const dados = await carregarJogo((await params).slug);
  if (!dados) notFound();
  const { pago } = await searchParams;
  return <PagarView jogo={dados.jogo} pago={pago === "1"} />;
}
