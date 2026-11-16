"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Toast, useToast } from "@/components/Toast";
import { capitalizar, dataCurta, diaSemanaCurto, formatDiaHora, horaCurta } from "@/lib/format";
import type { DuracaoVolei } from "@/lib/payments/produtos";
import type { Jogo } from "@/lib/jogos";
import { copiar } from "@/lib/share";

type Passo = "duracao" | "quantidade" | "pronto";

const erro = (e: unknown) => (e instanceof Error ? e.message : "Não deu certo, tenta de novo");

export function PagarView({ jogo }: { jogo: Jogo }) {
  const { mensagem, avisar } = useToast();
  const [passo, setPasso] = useState<Passo>("duracao");
  const [duracao, setDuracao] = useState<DuracaoVolei | null>(null);
  const [paraMais, setParaMais] = useState(false);
  const [quantity, setQuantity] = useState(2);
  const [ocupado, setOcupado] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  function escolherDuracao(d: DuracaoVolei) {
    setDuracao(d);
    setPasso("quantidade");
  }

  async function irPagar(qtd: number) {
    if (!duracao) return;
    setOcupado(true);
    try {
      const res = await fetch("/api/pagamento/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ duracao, quantity: qtd }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Não deu pra gerar o pagamento");
      }
      setCheckoutUrl(data.url);
      setPasso("pronto");
      const win = window.open(data.url, "_blank", "noopener,noreferrer");
      if (!win) avisar("Popup bloqueado — usa o botão abaixo");
    } catch (e) {
      avisar(erro(e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <Header voltar={`/j/${jogo.slug}`} />
      <main className="flex flex-1 flex-col">
        <div className="px-5 pt-5 pb-3.5">
          <div className="kicker mb-1.5">Pagamento</div>
          <h1 className="text-[32px] tracking-[-0.03em] break-words">{jogo.titulo}</h1>
          <div className="mt-1 text-[15px] text-neutral-800">
            {capitalizar(diaSemanaCurto(jogo.data_hora))} {dataCurta(jogo.data_hora)} · {horaCurta(jogo.data_hora)}
          </div>
          <div className="text-[15px] text-neutral-800">{jogo.local}</div>
        </div>

        {passo === "duracao" && (
          <div className="flex flex-1 flex-col px-5 pb-6">
            <p className="mb-4 text-[16px] text-neutral-800">Quanto tempo você jogou?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn btn-primary min-h-24 flex-col items-start justify-center gap-1 px-4 text-left text-[20px]"
                onClick={() => escolherDuracao("1h")}
              >
                <span className="text-[28px] leading-none font-extrabold">1h</span>
                <span className="text-[14px] font-semibold opacity-90">Vôlei 1 hora</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary min-h-24 flex-col items-start justify-center gap-1 px-4 text-left text-[20px]"
                onClick={() => escolherDuracao("2h")}
              >
                <span className="text-[28px] leading-none font-extrabold">2h</span>
                <span className="text-[14px] font-semibold">Vôlei 2 horas</span>
              </button>
            </div>
          </div>
        )}

        {passo === "quantidade" && duracao && (
          <div className="flex flex-1 flex-col px-5 pb-6">
            <button
              type="button"
              className="mb-3 self-start text-[14px] font-bold text-accent-700"
              onClick={() => {
                setPasso("duracao");
                setDuracao(null);
                setParaMais(false);
                setQuantity(2);
              }}
            >
              ← Trocar duração ({duracao})
            </button>
            <p className="mb-4 text-[16px] text-neutral-800">O pagamento é só pra você ou pra mais gente?</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={ocupado}
                className="btn btn-primary min-h-16 justify-between px-4 text-[17px]"
                onClick={() => {
                  setParaMais(false);
                  void irPagar(1);
                }}
              >
                <span>Só pra mim</span>
                <span className="text-[14px] font-semibold opacity-90">1 pessoa</span>
              </button>
              <button
                type="button"
                disabled={ocupado}
                className={`btn min-h-16 justify-between px-4 text-[17px] ${paraMais ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setParaMais(true)}
              >
                <span>Pra mais gente</span>
                <span className="text-[14px] font-semibold opacity-90">várias pessoas</span>
              </button>
            </div>

            {paraMais && (
              <div className="mt-4 border-2 border-ink p-4">
                <div className="mb-3 text-[15px] font-bold">Quantas pessoas?</div>
                <div className="mb-4 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    className="btn btn-secondary h-12 w-12 text-[22px]"
                    disabled={ocupado || quantity <= 2}
                    onClick={() => setQuantity((n) => Math.max(2, n - 1))}
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center text-[36px] leading-none font-extrabold">{quantity}</span>
                  <button
                    type="button"
                    className="btn btn-secondary h-12 w-12 text-[22px]"
                    disabled={ocupado || quantity >= 20}
                    onClick={() => setQuantity((n) => Math.min(20, n + 1))}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  disabled={ocupado}
                  className="btn btn-primary min-h-14 w-full text-[18px]"
                  onClick={() => void irPagar(quantity)}
                >
                  {ocupado ? "Gerando pagamento…" : `Pagar ${quantity} × ${duracao}`}
                </button>
              </div>
            )}

            {ocupado && !paraMais && (
              <div className="mt-4 text-center text-[15px] font-semibold text-neutral-700">Gerando pagamento…</div>
            )}
          </div>
        )}

        {passo === "pronto" && checkoutUrl && (
          <div className="flex flex-1 flex-col gap-3 px-5 pb-6">
            <p className="text-[16px] text-neutral-800">
              Checkout aberto. Se a aba não abriu, usa o botão abaixo — cartão de crédito ou carteiras digitais.
            </p>
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary min-h-14 text-[18px]">
              Abrir pagamento
            </a>
            <button
              type="button"
              className="btn btn-secondary min-h-12"
              onClick={async () => avisar((await copiar(checkoutUrl)) ? "Link copiado" : "Não deu pra copiar")}
            >
              Copiar link
            </button>
            <button
              type="button"
              className="btn btn-secondary min-h-12"
              onClick={() => {
                setPasso("duracao");
                setDuracao(null);
                setParaMais(false);
                setQuantity(2);
                setCheckoutUrl(null);
              }}
            >
              Fazer outro pagamento
            </button>
            <div className="text-[13px] text-neutral-600">{formatDiaHora(jogo.data_hora)} · {jogo.titulo}</div>
          </div>
        )}
      </main>
      <Toast mensagem={mensagem} />
    </>
  );
}
