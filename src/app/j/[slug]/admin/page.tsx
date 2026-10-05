import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { adminValidar } from "@/lib/jogos";
import { carregarJogo } from "../dados";
import { AdminView } from "./AdminView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel do jogo · Bora Vôlei",
  // O link de admin nunca deve ser indexado nem mandar o token adiante.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Page({ params, searchParams }: PageProps<"/j/[slug]/admin">) {
  const { slug } = await params;
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";

  const dados = await carregarJogo(slug);
  if (!dados) notFound();

  if (!token || !(await adminValidar(slug, token))) {
    return (
      <>
        <Header />
        <main className="flex flex-1 flex-col gap-3 p-5">
          <h1 className="text-[32px] tracking-[-0.03em]">Link de admin inválido</h1>
          <p className="text-[15px] text-neutral-800">
            Confere se você copiou o link inteiro, do jeito que apareceu quando o jogo foi criado.
          </p>
          <Link href={`/j/${slug}`} className="btn btn-secondary min-h-12 justify-between">
            Ver o jogo
          </Link>
        </main>
      </>
    );
  }

  return <AdminView jogo={dados.jogo} inscricoes={dados.inscricoes} token={token} />;
}
