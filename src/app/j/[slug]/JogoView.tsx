"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { IconArrow, IconCheck } from "@/components/icons";
import { ListaJogadores } from "@/components/ListaJogadores";
import { Segments } from "@/components/Segments";
import { Toast, useToast } from "@/components/Toast";
import { dataCurta, diaSemanaLongo, formatValor, horaCurta, ordinal } from "@/lib/format";
import { cancelarInscricao, inscrever, type Inscricao, type Jogo } from "@/lib/jogos";
import { dividirLista } from "@/lib/lista";
import { mensagemJogo, whatsapp } from "@/lib/share";
import { esquecerInscricao, lerAdmin, lerInscricao, salvarInscricao, type MinhaInscricao } from "@/lib/storage";
import { useJogoAoVivo } from "@/lib/useJogoAoVivo";

export function JogoView(props: { jogo: Jogo; inscricoes: Inscricao[]; jaAconteceu: boolean }) {
  const { jogo, inscricoes, recarregar } = useJogoAoVivo(props.jogo, props.inscricoes);
  const { mensagem, avisar } = useToast();
  const [minha, setMinha] = useState<MinhaInscricao | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);

  // localStorage só existe no navegador: lê depois de montar.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMinha(lerInscricao(jogo.slug));
    setAdminToken(lerAdmin(jogo.slug));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [jogo.slug]);

  const { confirmados, espera } = dividirLista(inscricoes, jogo.vagas);
  const count = confirmados.length;
  const lotado = count >= jogo.vagas;
  const faltam = Math.max(0, jogo.vagas - count);
  const valor = formatValor(jogo.valor);

  const minhaPos = minha ? inscricoes.findIndex((i) => i.id === minha.inscricaoId) : -1;
  const estouDentro = minhaPos >= 0 && minhaPos < jogo.vagas;
  const estouNaFila = minhaPos >= jogo.vagas;
  const { jaAconteceu } = props;

  // O organizador pode ter tirado a pessoa da lista: aí o celular esquece.
  const sumiu = minha !== null && minhaPos < 0;
  useEffect(() => {
    if (!sumiu) return;
    esquecerInscricao(jogo.slug);
    setMinha(null); // eslint-disable-line react-hooks/set-state-in-effect
  }, [sumiu, jogo.slug]);

  async function entrar() {
    const n = nome.trim();
    if (!n) {
      avisar("Põe seu nome primeiro");
      return;
    }
    setEnviando(true);
    try {
      const r = await inscrever(jogo.slug, n);
      const nova = { inscricaoId: r.inscricao_id, cancelToken: r.cancel_token, nome: n };
      salvarInscricao(jogo.slug, nova);
      await recarregar();
      setMinha(nova);
      setNome("");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não deu certo, tenta de novo");
    } finally {
      setEnviando(false);
    }
  }

  async function sair() {
    if (!minha) return;
    const eraConfirmado = estouDentro;
    setEnviando(true);
    try {
      await cancelarInscricao(minha.inscricaoId, minha.cancelToken);
      avisar(eraConfirmado ? "Beleza, sua vaga foi liberada" : "Você saiu da fila");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (!msg.includes("não encontrada")) {
        avisar(msg || "Não deu certo, tenta de novo");
        setEnviando(false);
        return;
      }
    }
    esquecerInscricao(jogo.slug);
    setMinha(null);
    await recarregar();
    setEnviando(false);
  }

  return (
    <>
      <Header>
        <div className="flex items-center gap-1">
          {adminToken && (
            <Link href={`/j/${jogo.slug}/admin?t=${adminToken}`} className="btn btn-ghost text-[14px]">
              Painel
            </Link>
          )}
          <Link href="/vagas" className="btn btn-ghost text-[14px]">
            Outros jogos
          </Link>
        </div>
      </Header>

      <main className="flex-1">
        <div className="px-5 pt-5 pb-4">
          {jogo.organizador && <div className="kicker mb-1.5">Organizado por {jogo.organizador}</div>}
          <h1 className="text-[36px] tracking-[-0.03em] break-words">{jogo.titulo}</h1>
        </div>

        <div className="grid grid-cols-2 border-y-2 border-divider">
          <div className="border-r-2 border-b border-divider px-5 py-3">
            <div className="text-[12px] text-neutral-700">{diaSemanaLongo(jogo.data_hora)}</div>
            <div className="text-[20px] font-extrabold">{dataCurta(jogo.data_hora)}</div>
          </div>
          <div className="border-b border-divider px-5 py-3">
            <div className="text-[12px] text-neutral-700">Hora</div>
            <div className="text-[20px] font-extrabold">{horaCurta(jogo.data_hora)}</div>
          </div>
          <div className="border-r-2 border-divider px-5 py-3">
            <div className="text-[12px] text-neutral-700">Local</div>
            <div className="text-[15px] leading-[1.3] font-semibold break-words">{jogo.local}</div>
          </div>
          <div className="px-5 py-3">
            <div className="text-[12px] text-neutral-700">Por pessoa</div>
            <div className="text-[20px] font-extrabold">{valor}</div>
          </div>
        </div>

        <div className="px-5 pt-5 pb-2">
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[64px] leading-[0.9] font-extrabold tracking-[-0.04em] text-accent">{count}</span>
              <span className="text-[16px] font-semibold">de {jogo.vagas} confirmados</span>
            </div>
            {lotado ? (
              <span className="bg-ink px-2 py-1 text-[13px] font-extrabold tracking-[0.08em] text-paper">LOTADO</span>
            ) : (
              <span className="text-[16px] font-extrabold text-accent-700">faltam {faltam}</span>
            )}
          </div>
          <div className="mt-3.5">
            <Segments preenchidos={count} total={jogo.vagas} />
          </div>
        </div>

        <ListaJogadores confirmados={confirmados} espera={espera} vagas={jogo.vagas} meuId={minha?.inscricaoId} />
        <div className="h-6" />
      </main>

      <footer className="sticky bottom-0 flex flex-col gap-2.5 border-t-2 border-ink bg-paper px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        {jaAconteceu && !estouDentro && !estouNaFila ? (
          <div className="py-2 text-[15px] text-neutral-700">Esse jogo já aconteceu.</div>
        ) : estouDentro && minha ? (
          <>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 flex-none place-items-center bg-accent text-paper">
                <IconCheck />
              </div>
              <div>
                <div className="text-[21px] leading-[1.15] font-extrabold">Você está confirmado ✓</div>
                <div className="text-[14px] text-neutral-700">
                  {minha.nome} · nº {minhaPos + 1} da lista{jogo.valor ? ` · leva ${valor}` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <a href={whatsapp(mensagemJogo(jogo))} target="_blank" rel="noopener" className="btn btn-secondary min-h-11">
                Chamar mais gente
              </a>
              <button type="button" disabled={enviando} onClick={sair} className="btn btn-ghost min-h-11 font-semibold text-neutral-700">
                Não vou mais
              </button>
            </div>
          </>
        ) : estouNaFila ? (
          <>
            <div className="flex items-center gap-3">
              <div className="grid h-11 min-w-11 flex-none place-items-center bg-ink px-1.5 text-[20px] font-extrabold text-paper">
                {ordinal(minhaPos - jogo.vagas + 1)}
              </div>
              <div>
                <div className="text-[21px] leading-[1.15] font-extrabold">Você está na fila</div>
                <div className="text-[14px] text-neutral-700">Se alguém desistir, você sobe pra lista.</div>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" disabled={enviando} onClick={sair} className="btn btn-ghost min-h-11 font-semibold text-neutral-700">
                Sair da fila
              </button>
            </div>
          </>
        ) : (
          <form
            className="flex flex-col gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              entrar();
            }}
          >
            <div className="field">
              <label htmlFor="nome">Seu nome</label>
              <input
                id="nome"
                className="input text-[18px]"
                placeholder="Como a galera te chama"
                autoComplete="given-name"
                maxLength={40}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={enviando}
              className={`btn btn-primary min-h-[60px] justify-between px-5 ${lotado ? "text-[18px]" : "text-[20px]"}`}
            >
              <span>{lotado ? "Entrar na lista de espera" : "Tô dentro"}</span>
              <IconArrow />
            </button>
            {lotado && (
              <div className="text-[14px] text-neutral-700">
                Jogo lotado. Você entra como <b className="text-ink">{ordinal(espera.length + 1)} da fila</b> — se alguém
                desistir, a vaga é sua.
              </div>
            )}
          </form>
        )}
      </footer>
      <Toast mensagem={mensagem} />
    </>
  );
}
