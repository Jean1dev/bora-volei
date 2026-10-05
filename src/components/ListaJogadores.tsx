import type { Inscricao } from "@/lib/jogos";
import { ordinal } from "@/lib/format";
import { IconX } from "./icons";

type Props = {
  confirmados: Inscricao[];
  espera: Inscricao[];
  vagas: number;
  /** id da inscrição deste celular, para marcar "você" */
  meuId?: string | null;
  /** no painel: mostra o × em cada linha */
  onRemover?: (i: Inscricao) => void;
};

export function ListaJogadores({ confirmados, espera, vagas, meuId, onRemover }: Props) {
  const admin = !!onRemover;
  const livres = Math.max(0, vagas - confirmados.length);

  const linha = (i: Inscricao, rotulo: string | number) => (
    <div
      key={i.id}
      className={`flex items-center gap-3 border-b border-divider ${admin ? "min-h-12 pr-2 pl-5" : "min-h-[46px] px-5"}`}
    >
      <span className="w-6 font-extrabold text-neutral-700 tabular-nums">{rotulo}</span>
      <span className="flex-1 truncate text-[16px] font-semibold">{i.nome}</span>
      {i.id === meuId && <span className="tag tag-accent font-semibold">você</span>}
      {admin && (
        <button
          type="button"
          aria-label={`Remover ${i.nome}`}
          className="btn btn-icon h-11 w-11 text-neutral-700 hover:bg-accent-100 hover:text-accent"
          onClick={() => onRemover(i)}
        >
          <IconX />
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className={`flex items-baseline justify-between px-5 pb-1.5 ${admin ? "pt-2" : "pt-5"}`}>
        <h4 className="text-[18px]">Confirmados</h4>
        <span className="text-[13px] text-neutral-700">
          {admin ? "toque no × pra tirar" : `${confirmados.length}/${vagas}`}
        </span>
      </div>
      <div className="border-t-2 border-ink">
        {confirmados.map((i, n) => linha(i, n + 1))}
        {!admin &&
          Array.from({ length: livres }, (_, n) => (
            <div
              key={`livre-${n}`}
              className="flex min-h-[46px] items-center gap-3 border-b border-dashed border-neutral-400 px-5"
            >
              <span className="w-6 font-extrabold text-neutral-500 tabular-nums">{confirmados.length + n + 1}</span>
              <span className="flex-1 text-[15px] text-neutral-600">vaga livre</span>
            </div>
          ))}
        {admin && confirmados.length === 0 && (
          <div className="px-5 py-4 text-[15px] text-neutral-700">Ninguém confirmou ainda.</div>
        )}
      </div>

      {espera.length > 0 && (
        <>
          <div className={`flex items-baseline justify-between px-5 pb-1.5 ${admin ? "pt-5" : "pt-6"}`}>
            <h4 className="text-[18px]">Lista de espera</h4>
            {!admin && <span className="text-[13px] text-neutral-700">entra quem tá na frente</span>}
          </div>
          <div className="border-t-2 border-ink">{espera.map((i, n) => linha(i, ordinal(n + 1)))}</div>
        </>
      )}
    </>
  );
}
