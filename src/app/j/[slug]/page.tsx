import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDiaHora } from "@/lib/format";
import { carregarJogo } from "./dados";
import { JogoView } from "./JogoView";

// Jogos são criados depois do deploy e a lista muda o tempo todo.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/j/[slug]">): Promise<Metadata> {
  const dados = await carregarJogo((await params).slug);
  if (!dados) return { title: "Jogo não encontrado · Bora Vôlei" };
  const { jogo } = dados;
  const confirmados = Math.min(jogo.inscritos, jogo.vagas);
  const title = `🏐 ${jogo.titulo} — ${formatDiaHora(jogo.data_hora)}`;
  const description =
    `${confirmados} de ${jogo.vagas} confirmados · ` +
    (jogo.vagas_restantes > 0 ? `faltam ${jogo.vagas_restantes}` : "lotado, tem fila");
  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "pt_BR", siteName: "Bora Vôlei" },
  };
}

export default async function Page({ params }: PageProps<"/j/[slug]">) {
  const dados = await carregarJogo((await params).slug);
  if (!dados) notFound();
  return <JogoView jogo={dados.jogo} inscricoes={dados.inscricoes} jaAconteceu={dados.jaAconteceu} />;
}
