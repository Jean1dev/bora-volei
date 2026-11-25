"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Toast, useToast } from "@/components/Toast";
import { capitalizar, dataCurta, diaSemanaCurto, formatDiaHora, formatValor, horaCurta, valorCobranca, valorPorPessoa } from "@/lib/format";
import { formatCpf, PIX_CPF } from "@/lib/payments/pix";
import type { Jogo } from "@/lib/jogos";
import { copiar } from "@/lib/share";

type Passo = "quantidade" | "pronto";

const erro = (e: unknown) => (e instanceof Error ? e.message : "Não deu certo, tenta de novo");

export function PagarView({ jogo, pago = false }: { jogo: Jogo; pago?: boolean }) {
  const { mensagem, avisar } = useToast();
  const aluguel = Number(jogo.valor) || null;
  const confirmados = Math.min(jogo.inscritos, jogo.vagas);
  const porPessoa = valorPorPessoa(aluguel, confirmados);
  const pixFormatado = formatCpf(PIX_CPF);
  const [passo, setPasso] = useState<Passo>("quantidade");
  const [paraMais, setParaMais] = useState(false);
  const [quantity, setQuantity] = useState(2);
  const [ocupado, setOcupado] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const total = valorCobranca(aluguel, confirmados, quantity);

  async function irPagar(qtd: number) {
    setOcupado(true);
    try {
      const res = await fetch("/api/pagamento/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: jogo.slug, quantity: qtd }),
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
          {pago && <div className="mt-3 text-[15px] font-bold text-accent-700">Pagamento enviado.</div>}
        </div>

        <div className="border-y-2 border-ink px-5 py-4">
          <div className="text-[12px] text-neutral-700">{porPessoa != null ? "Por pessoa" : "Aluguel"}</div>
          <div className="text-[32px] leading-none font-extrabold tracking-[-0.03em]">{formatValor(porPessoa ?? aluguel)}</div>
          {porPessoa != null && (
            <div className="mt-1 text-[13px] text-neutral-700">
              quadra {formatValor(aluguel)} · {confirmados} confirmados
            </div>
          )}
          <div className="mt-4 text-[12px] text-neutral-700">PIX · CPF</div>
          <div className="text-[22px] font-extrabold tracking-[0.04em]">{pixFormatado}</div>
          <button
            type="button"
            className="btn btn-primary mt-3 min-h-12 w-full text-[16px]"
            onClick={async () => avisar((await copiar(PIX_CPF)) ? "PIX copiado" : "Não deu pra copiar")}
          >
            Copiar PIX
          </button>
        </div>

        {passo === "quantidade" && porPessoa != null && (
          <div className="flex flex-1 flex-col px-5 pt-5 pb-6">
            <p className="mb-4 text-[16px] text-neutral-800">Cartão ou carteira digital. O pagamento é só pra você ou pra mais gente?</p>
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
                <span className="text-[14px] font-semibold opacity-90">{formatValor(porPessoa)}</span>
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

            {paraMais && total != null && (
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
                  {ocupado ? "Gerando pagamento…" : `Pagar ${formatValor(total)}`}
                </button>
              </div>
            )}

            {ocupado && !paraMais && (
              <div className="mt-4 text-center text-[15px] font-semibold text-neutral-700">Gerando pagamento…</div>
            )}
          </div>
        )}

        {passo === "quantidade" && porPessoa == null && (
          <div className="px-5 pt-5 pb-6 text-[16px] text-neutral-800">
            Cartão e carteira digital abrem quando o rateio fechar. O PIX acima já vale.
          </div>
        )}

        {passo === "pronto" && checkoutUrl && (
          <div className="flex flex-1 flex-col gap-3 px-5 pt-5 pb-6">
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
                setPasso("quantidade");
                setParaMais(false);
                setQuantity(2);
                setCheckoutUrl(null);
              }}
            >
              Fazer outro pagamento
            </button>
            <div className="text-[13px] text-neutral-600">
              {formatDiaHora(jogo.data_hora)} · {jogo.titulo}
            </div>
          </div>
        )}
      </main>
      <Toast mensagem={mensagem} />
    </>
  );
}
