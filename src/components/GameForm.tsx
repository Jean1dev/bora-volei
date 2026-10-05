"use client";

import { useState } from "react";
import type { DadosJogo, Jogo } from "@/lib/jogos";
import { deInputs, paraInputs } from "@/lib/format";
import { Header } from "./Header";
import { IconArrow, IconCheck } from "./icons";

type Props = {
  /** quando presente, o formulário está editando esse jogo */
  jogo?: Jogo;
  /** menor número de vagas permitido (no editar: quantos já confirmaram) */
  minVagas?: number;
  voltar: string | (() => void);
  avisar: (msg: string) => void;
  onSalvar: (dados: DadosJogo) => Promise<void>;
};

/** "R$ 12,50" → "12.50"; vazio → "" */
function normalizarValor(texto: string) {
  const limpo = texto.replace(/[^\d,.]/g, "").replace(",", ".");
  return limpo === "" ? "" : String(Number(limpo));
}

export function GameForm({ jogo, minVagas = 2, voltar, avisar, onSalvar }: Props) {
  const inicio = jogo ? paraInputs(jogo.data_hora) : { data: "", hora: "" };
  const [titulo, setTitulo] = useState(jogo?.titulo ?? "");
  const [data, setData] = useState(inicio.data);
  const [hora, setHora] = useState(inicio.hora);
  const [local, setLocal] = useState(jogo?.local ?? "");
  const [vagas, setVagas] = useState(jogo?.vagas ?? 12);
  const [valor, setValor] = useState(jogo?.valor ? String(jogo.valor).replace(".", ",") : "");
  const [organizador, setOrganizador] = useState(jogo?.organizador ?? "");
  const [salvando, setSalvando] = useState(false);

  const minimo = Math.max(2, minVagas);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !data || !hora || !local.trim()) {
      avisar("Preenche nome, data, hora e local");
      return;
    }
    const valorNormalizado = normalizarValor(valor);
    if (valorNormalizado === "NaN") {
      avisar("Valor inválido");
      return;
    }
    setSalvando(true);
    try {
      await onSalvar({
        titulo: titulo.trim(),
        organizador: organizador.trim(),
        data_hora: deInputs(data, hora),
        local: local.trim(),
        vagas,
        valor: valorNormalizado,
      });
    } catch (err) {
      avisar(err instanceof Error ? err.message : "Não deu certo, tenta de novo");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-1 flex-col">
      <Header voltar={voltar} />
      <main className="flex flex-1 flex-col gap-[18px] p-5">
        <h1 className="text-[34px] tracking-[-0.03em]">{jogo ? "Editar jogo" : "Marcar um jogo"}</h1>
        <div className="field">
          <label htmlFor="titulo">Nome do jogo</label>
          <input id="titulo" className="input" placeholder="Vôlei de quinta" maxLength={60} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div className="grid grid-cols-[1.3fr_1fr] gap-3">
          <div className="field">
            <label htmlFor="data">Data</label>
            <input id="data" type="date" className="input" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="hora">Hora</label>
            <input id="hora" type="time" className="input" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="local">Local</label>
          <input id="local" className="input" placeholder="Ginásio do Bairro" maxLength={80} value={local} onChange={(e) => setLocal(e.target.value)} />
        </div>
        <div className="field">
          <label id="vagas-label">Vagas</label>
          <div className="grid h-14 grid-cols-[56px_1fr_56px] border-2 border-ink" role="group" aria-labelledby="vagas-label">
            <button type="button" aria-label="Menos" className="btn h-full border-r-2 border-r-ink text-[24px]" disabled={vagas <= minimo} onClick={() => setVagas(Math.max(minimo, vagas - 1))}>
              −
            </button>
            <div className="grid place-items-center text-[24px] font-extrabold" aria-live="polite">
              {vagas}
            </div>
            <button type="button" aria-label="Mais" className="btn h-full border-l-2 border-l-ink text-[24px]" disabled={vagas >= 30} onClick={() => setVagas(Math.min(30, vagas + 1))}>
              +
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="valor">
            Valor por pessoa <span className="font-normal text-neutral-700">(opcional)</span>
          </label>
          <input id="valor" className="input" placeholder="R$ 10" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="organizador">
            Seu nome <span className="font-normal text-neutral-700">(opcional)</span>
          </label>
          <input id="organizador" className="input" placeholder="Aparece como “Organizado por”" maxLength={40} value={organizador} onChange={(e) => setOrganizador(e.target.value)} />
        </div>
      </main>
      <footer className="sticky bottom-0 border-t-2 border-ink bg-paper px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <button type="submit" disabled={salvando} className="btn btn-primary min-h-[60px] w-full justify-between px-5 text-[20px]">
          <span>{jogo ? "Salvar alterações" : "Criar jogo"}</span>
          {jogo ? <IconCheck size={24} strokeWidth={2.5} /> : <IconArrow />}
        </button>
      </footer>
    </form>
  );
}
