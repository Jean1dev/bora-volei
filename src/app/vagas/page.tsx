import type { Metadata } from "next";
import Link from "next/link";
import { GameRow } from "@/components/GameRow";
import { Header } from "@/components/Header";
import { IconArrow } from "@/components/icons";
import { getJogosComVaga } from "@/lib/jogos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jogos com vaga · Bora Vôlei",
  description: "Jogos de vôlei abertos pra quem quiser chegar junto.",
};

export default async function Page() {
  const jogos = await getJogosComVaga();
  return (
    <>
      <Header>
        <Link href="/novo" className="btn btn-ghost text-[14px]">
          + Marcar jogo
        </Link>
      </Header>
      <main className="flex-1">
        <div className="px-5 pt-5 pb-4">
          <h1 className="mb-1 text-[36px] tracking-[-0.03em]">Tem vaga aí</h1>
          <div className="text-[15px] text-neutral-800">Jogos abertos pra quem quiser chegar junto.</div>
        </div>
        <div className="border-t-2 border-ink">
          {jogos.map((j) => (
            <GameRow key={j.id} jogo={j} />
          ))}
        </div>
        {jogos.length === 0 && (
          <div className="flex flex-col gap-3 px-5 py-6">
            <div className="text-[17px] font-bold">Nenhum jogo aberto agora.</div>
            <div className="text-[15px] text-neutral-800">Que tal marcar um e abrir as vagas pra galera de fora?</div>
            <Link href="/novo" className="btn btn-primary min-h-[60px] justify-between px-5 text-[19px]">
              <span>Marcar um jogo</span>
              <IconArrow />
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
