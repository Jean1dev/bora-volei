import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-3 p-5">
        <h1 className="text-[32px] tracking-[-0.03em]">Jogo não encontrado</h1>
        <p className="text-[15px] text-neutral-800">O link pode estar errado ou o jogo foi apagado.</p>
        <Link href="/vagas" className="btn btn-secondary min-h-12 justify-between">
          Ver jogos com vaga
        </Link>
      </main>
    </>
  );
}
