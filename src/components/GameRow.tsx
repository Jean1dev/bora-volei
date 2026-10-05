import Link from "next/link";
import type { Jogo } from "@/lib/jogos";
import { dataCurta, diaSemanaCurto, formatValor, horaCurta } from "@/lib/format";

/** Linha de jogo usada em "Jogos com vaga" e em "Seus jogos". */
export function GameRow({ jogo, href, tag }: { jogo: Jogo; href?: string; tag?: string }) {
  const lotado = jogo.vagas_restantes === 0;
  return (
    <Link
      href={href ?? `/j/${jogo.slug}`}
      className="grid grid-cols-[84px_1fr] border-b-2 border-divider text-ink no-underline hover:bg-surface hover:text-ink"
    >
      <div className="flex flex-col border-r-2 border-divider py-4 pl-5">
        <span className="text-[13px] font-extrabold tracking-[0.06em] uppercase">{diaSemanaCurto(jogo.data_hora)}</span>
        <span className="text-[22px] leading-[1.1] font-extrabold">{dataCurta(jogo.data_hora)}</span>
        <span className="text-[15px] font-semibold">{horaCurta(jogo.data_hora)}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5 py-4 pr-5 pl-4">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[18px] leading-[1.2] font-extrabold">{jogo.titulo}</div>
          {tag && <span className="tag tag-accent shrink-0 font-semibold">{tag}</span>}
        </div>
        <div className="text-[14px] text-neutral-800">{jogo.local}</div>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-[16px] font-extrabold text-accent-700">
            {lotado ? "lotado" : `faltam ${jogo.vagas_restantes}`}
          </span>
          <span className="text-[14px] font-semibold">{formatValor(jogo.valor)}</span>
        </div>
      </div>
    </Link>
  );
}
