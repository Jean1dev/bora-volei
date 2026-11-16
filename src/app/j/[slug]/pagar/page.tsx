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
    description: `Pagamento do jogo ${jogo.titulo} — ${formatDiaHora(jogo.data_hora)}. Crédito ou carteiras digitais.`,
  };
}

export default async function Page({ params }: PageProps<"/j/[slug]/pagar">) {
  const dados = await carregarJogo((await params).slug);
  if (!dados) notFound();
  return <PagarView jogo={dados.jogo} />;
}
