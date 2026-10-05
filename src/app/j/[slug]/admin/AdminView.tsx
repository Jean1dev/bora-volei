"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GameForm } from "@/components/GameForm";
import { Header } from "@/components/Header";
import { IconArrow, IconPencil, IconRepeat, IconShare, IconShuffle } from "@/components/icons";
import { ListaJogadores } from "@/components/ListaJogadores";
import { Segments } from "@/components/Segments";
import { Toast, useToast } from "@/components/Toast";
import { capitalizar, dataCurta, diaSemanaCurto, formatValor, horaCurta } from "@/lib/format";
import {
  adminAtualizarJogo,
  adminRemoverInscricao,
  repetirJogo,
  type DadosJogo,
  type Inscricao,
  type Jogo,
} from "@/lib/jogos";
import { dividirLista, sortearTimes } from "@/lib/lista";
import { mensagemTimes, whatsapp } from "@/lib/share";
import { salvarAdmin } from "@/lib/storage";
import { useJogoAoVivo } from "@/lib/useJogoAoVivo";

type Tela = "painel" | "editar" | "sorteio";

const erro = (e: unknown) => (e instanceof Error ? e.message : "Não deu certo, tenta de novo");

export function AdminView(props: { jogo: Jogo; inscricoes: Inscricao[]; token: string }) {
  const { token } = props;
  const router = useRouter();
  const { jogo, inscricoes, recarregar } = useJogoAoVivo(props.jogo, props.inscricoes);
  const { mensagem, avisar } = useToast();
  const [tela, setTela] = useState<Tela>("painel");
  // Valor otimista do switch enquanto a RPC não volta.
  const [publicoOtimista, setPublicoOtimista] = useState<boolean | null>(null);
  const [times, setTimes] = useState<[string[], string[]]>([[], []]);
  const [sorteioN, setSorteioN] = useState(0);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    salvarAdmin(jogo.slug, token);
    // Veio do "Repetir semana que vem": avisa e limpa o parâmetro da URL.
    const url = new URL(location.href);
    if (url.searchParams.has("repetido")) {
      avisar(`Jogo de ${diaSemanaCurto(jogo.data_hora)} ${dataCurta(jogo.data_hora)} criado — manda o link no grupo`);
      url.searchParams.delete("repetido");
      history.replaceState(null, "", url);
    }
  }, [jogo.slug, jogo.data_hora, token, avisar]);

  const { confirmados, espera } = dividirLista(inscricoes, jogo.vagas);
  const count = confirmados.length;
  const lotado = count >= jogo.vagas;
  const publico = publicoOtimista ?? jogo.publico;

  async function remover(i: Inscricao) {
    const eraConfirmado = confirmados.some((c) => c.id === i.id);
    const sobe = eraConfirmado ? espera[0] : undefined;
    try {
      await adminRemoverInscricao(jogo.slug, token, i.id);
      if (!eraConfirmado) avisar(`${i.nome} saiu da fila`);
      else avisar(`${i.nome} saiu da lista` + (sobe ? ` · ${sobe.nome} entrou` : ""));
    } catch (e) {
      avisar(erro(e));
    }
    await recarregar();
  }

  async function alternarPublico() {
    const novo = !publico;
    setPublicoOtimista(novo);
    try {
      await adminAtualizarJogo(jogo.slug, token, { publico: novo });
      await recarregar();
      avisar(novo ? "Jogo aparece pra todo mundo" : "Agora só quem tem o link");
    } catch (e) {
      avisar(erro(e));
    }
    setPublicoOtimista(null);
  }

  async function repetir() {
    setOcupado(true);
    try {
      const novo = await repetirJogo(jogo.slug, token);
      salvarAdmin(novo, token);
      router.push(`/j/${novo}/admin?t=${token}&repetido=1`);
    } catch (e) {
      avisar(erro(e));
      setOcupado(false);
    }
  }

  function sortear() {
    if (count < 2) {
      avisar("Precisa de pelo menos 2 confirmados");
      return;
    }
    setTimes(sortearTimes(confirmados.map((c) => c.nome)));
    setSorteioN((n) => n + 1);
    setTela("sorteio");
    window.scrollTo(0, 0);
  }

  async function salvarEdicao(dados: DadosJogo) {
    await adminAtualizarJogo(jogo.slug, token, dados);
    await recarregar();
    setTela("painel");
    avisar("Jogo atualizado");
  }

  if (tela === "editar") {
    return (
      <>
        <GameForm jogo={jogo} minVagas={count} voltar={() => setTela("painel")} avisar={avisar} onSalvar={salvarEdicao} />
        <Toast mensagem={mensagem} />
      </>
    );
  }

  if (tela === "sorteio") {
    const [timeA, timeB] = times;
    return (
      <>
        <Header voltar={() => setTela("painel")} />
        <main className="flex flex-1 flex-col">
          <div className="p-5">
            <div className="kicker mb-1.5">
              Sorteio nº {sorteioN} · {timeA.length + timeB.length} jogadores
            </div>
            <h1 className="text-[36px] tracking-[-0.03em]">Times sorteados</h1>
          </div>
          <div className="grid grid-cols-2 border-y-2 border-ink">
            {[
              { nome: "Time A", jogadores: timeA, cor: "bg-accent", borda: "border-r-2 border-ink" },
              { nome: "Time B", jogadores: timeB, cor: "bg-ink", borda: "" },
            ].map((t) => (
              <div key={t.nome} className={t.borda}>
                <div className={`${t.cor} px-4 py-3 text-[22px] font-extrabold text-paper`}>{t.nome}</div>
                {t.jogadores.map((p, i) => (
                  <div key={i} className="flex min-h-12 items-center border-b border-divider px-4 text-[17px] font-semibold break-words">
                    {p}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="px-5 py-3.5 text-[14px] text-neutral-700">Sorteio aleatório. Não gostou? Sorteia de novo.</div>
        </main>
        <footer className="sticky bottom-0 grid grid-cols-[1fr_1.2fr] gap-2 border-t-2 border-ink bg-paper px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
          <button type="button" className="btn btn-secondary min-h-[60px] justify-start gap-2 px-3 text-left text-[16px] leading-[1.15]" onClick={sortear}>
            <IconShuffle size={18} />
            Sortear de novo
          </button>
          <a
            href={whatsapp(mensagemTimes(jogo, timeA, timeB))}
            target="_blank"
            rel="noopener"
            className="btn btn-primary min-h-[60px] justify-between px-4 text-[17px]"
          >
            <span>Compartilhar</span>
            <IconShare size={20} />
          </a>
        </footer>
        <Toast mensagem={mensagem} />
      </>
    );
  }

  return (
    <>
      <Header>
        <span className="bg-ink px-2 py-1 text-[12px] font-extrabold tracking-[0.08em] text-paper">PAINEL</span>
      </Header>
      <main className="flex-1">
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3.5">
          <div className="min-w-0">
            <h1 className="text-[32px] tracking-[-0.03em] break-words">{jogo.titulo}</h1>
            <div className="mt-1 text-[15px] text-neutral-800">
              {capitalizar(diaSemanaCurto(jogo.data_hora))} {dataCurta(jogo.data_hora)} · {horaCurta(jogo.data_hora)} ·{" "}
              {formatValor(jogo.valor)}
            </div>
            <div className="text-[15px] text-neutral-800">{jogo.local}</div>
          </div>
          <button
            type="button"
            aria-label="Editar jogo"
            className="btn btn-secondary btn-icon h-11 w-11 flex-none"
            onClick={() => setTela("editar")}
          >
            <IconPencil />
          </button>
        </div>

        <div className="px-5 pb-[18px]">
          <div className="flex items-baseline gap-2">
            <span className="text-[48px] leading-[0.9] font-extrabold text-accent">{count}</span>
            <span className="text-[15px] font-semibold">de {jogo.vagas}</span>
            <span className="ml-auto text-[15px] font-extrabold text-accent-700">
              {lotado ? "lotado" : `faltam ${jogo.vagas - count}`}
            </span>
          </div>
          <div className="mt-2.5">
            <Segments preenchidos={count} total={jogo.vagas} altura={10} />
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={publico}
          onClick={alternarPublico}
          className="flex w-full cursor-pointer items-center gap-3.5 border-y-2 border-divider px-5 py-3.5 text-left hover:bg-surface"
        >
          <div className="flex-1">
            <div className="text-[16px] leading-[1.25] font-bold">Abrir vagas para quem não é do grupo</div>
            <div className="text-[13px] text-neutral-700">
              {publico ? "Ligado: aparece em “Jogos com vaga”" : "Desligado: só quem tem o link entra"}
            </div>
          </div>
          <div className={`flex h-8 w-14 flex-none p-1 ${publico ? "justify-end bg-accent" : "justify-start bg-neutral-400"}`}>
            <div className="h-6 w-6 bg-paper" />
          </div>
        </button>

        <div className="grid grid-cols-2 gap-2 px-5 py-4">
          <button
            type="button"
            className="btn btn-primary min-h-16 flex-col items-start justify-center gap-1 px-3.5 text-[16px]"
            onClick={sortear}
          >
            <IconShuffle />
            Sortear times
          </button>
          <button
            type="button"
            disabled={ocupado}
            className="btn btn-secondary min-h-16 flex-col items-start justify-center gap-1 px-3.5 text-left text-[15px] leading-[1.15]"
            onClick={repetir}
          >
            <IconRepeat />
            Repetir semana que vem
          </button>
        </div>

        <ListaJogadores confirmados={confirmados} espera={espera} vagas={jogo.vagas} onRemover={remover} />

        <div className="flex flex-col gap-2 px-5 pt-4 pb-6">
          <button type="button" className="btn btn-secondary min-h-12 justify-between" onClick={() => setTela("editar")}>
            <span>Editar jogo</span>
            <IconPencil size={18} />
          </button>
          <Link href={`/j/${jogo.slug}`} className="btn btn-secondary min-h-12 justify-between">
            <span>Ver como jogador</span>
            <IconArrow size={18} />
          </Link>
        </div>
      </main>
      <Toast mensagem={mensagem} />
    </>
  );
}
