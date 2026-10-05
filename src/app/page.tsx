import Link from "next/link";
import { Header } from "@/components/Header";
import { IconArrow } from "@/components/icons";
import { SeusJogos } from "./SeusJogos";

export default function Home() {
  return (
    <>
      <Header>
        <Link href="/vagas" className="btn btn-ghost text-[14px]">
          Jogos com vagas
        </Link>
      </Header>
      <main className="flex-1">
        <div className="px-5 pt-7 pb-6">
          <div className="kicker mb-1.5">Vôlei com a galera</div>
          <h1 className="text-[40px] leading-[1.02] tracking-[-0.03em]">Marca o jogo. A galera confirma.</h1>
          <p className="mt-3 text-[16px] text-neutral-800">
            Cria o jogo, manda o link no grupo e cada um confirma só com o nome. Lotou? Vira lista de espera.
          </p>
        </div>
        <div className="flex flex-col gap-2 px-5 pb-6">
          <Link href="/novo" className="btn btn-primary min-h-[60px] justify-between px-5 text-[20px]">
            <span>Criar jogo</span>
            <IconArrow />
          </Link>
          <Link href="/vagas" className="btn btn-secondary min-h-[52px] justify-between px-5 text-[16px]">
            <span>Jogos com vagas</span>
            <IconArrow size={20} />
          </Link>
        </div>
        <SeusJogos />
      </main>
    </>
  );
}
