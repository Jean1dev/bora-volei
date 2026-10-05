"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GameForm } from "@/components/GameForm";
import { Header } from "@/components/Header";
import { IconCheck, IconLock, IconShare } from "@/components/icons";
import { Toast, useToast } from "@/components/Toast";
import { criarJogo, type DadosJogo } from "@/lib/jogos";
import { capitalizar, dataCurta, diaSemanaCurto, horaCurta } from "@/lib/format";
import { copiar, linkAdmin, linkJogo, mensagemJogo, whatsapp } from "@/lib/share";
import { salvarAdmin } from "@/lib/storage";

type Criado = DadosJogo & { slug: string; adminToken: string };

export function NovoJogo() {
  const router = useRouter();
  const { mensagem, avisar } = useToast();
  const [criado, setCriado] = useState<Criado | null>(null);

  async function salvar(dados: DadosJogo) {
    const r = await criarJogo(dados);
    salvarAdmin(r.slug, r.admin_token);
    setCriado({ ...dados, slug: r.slug, adminToken: r.admin_token });
    window.scrollTo(0, 0);
  }

  if (!criado) {
    return (
      <>
        <GameForm voltar="/" avisar={avisar} onSalvar={salvar} />
        <Toast mensagem={mensagem} />
      </>
    );
  }

  const publico = linkJogo(criado.slug);
  const admin = linkAdmin(criado.slug, criado.adminToken);
  const quando = `${capitalizar(diaSemanaCurto(criado.data_hora))} ${dataCurta(criado.data_hora)}, ${horaCurta(criado.data_hora)}`;

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="bg-accent px-5 pt-7 pb-6 text-paper">
          <IconCheck size={44} />
          <h1 className="mt-2.5 mb-1 text-[40px] tracking-[-0.03em]">Jogo criado!</h1>
          <div className="text-[16px] font-semibold">
            {criado.titulo} · {quando}
          </div>
        </div>
        <div className="flex flex-col gap-2.5 p-5">
          <div className="text-[15px]">Agora manda no grupo. Quem abrir o link confirma só com o nome.</div>
          <a
            href={whatsapp(mensagemJogo(criado))}
            target="_blank"
            rel="noopener"
            className="btn btn-primary min-h-[60px] justify-between px-5 text-[19px]"
          >
            <span>Compartilhar no WhatsApp</span>
            <IconShare />
          </a>
          <div className="flex min-h-[52px] border-2 border-ink">
            <div className="flex flex-1 items-center truncate px-3.5 text-[15px] font-semibold">
              {publico.replace(/^https?:\/\//, "")}
            </div>
            <button
              type="button"
              className="btn btn-secondary border-0 border-l-2 border-l-ink px-4 text-[15px]"
              onClick={async () => avisar((await copiar(publico)) ? "Link do jogo copiado" : "Não deu pra copiar")}
            >
              Copiar
            </button>
          </div>
        </div>
        <div className="mx-5 mt-1 mb-5 border-2 border-ink">
          <div className="flex items-center gap-2 bg-ink px-3.5 py-2.5 text-[14px] font-extrabold tracking-[0.06em] text-paper">
            <IconLock />
            SEU LINK DE ADMIN — SÓ PRA VOCÊ
          </div>
          <div className="flex flex-col gap-3 bg-accent-100 p-3.5">
            <div className="text-[17px] leading-[1.25] font-extrabold text-accent-800">
              Guarde este link, é com ele que você gerencia o jogo.
            </div>
            <div className="text-[14px] text-neutral-800">Não tem senha. Perdeu o link, perdeu o controle. Não manda no grupo.</div>
            <div className="border border-divider bg-paper px-3 py-2.5 text-[14px] font-semibold break-all">{admin}</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn btn-secondary min-h-12 bg-paper"
                onClick={async () => avisar((await copiar(admin)) ? "Link de admin copiado. Guarda bem!" : "Não deu pra copiar")}
              >
                Copiar link
              </button>
              <button
                type="button"
                className="btn btn-secondary min-h-12 bg-paper"
                onClick={() => router.push(`/j/${criado.slug}/admin?t=${criado.adminToken}`)}
              >
                Abrir painel
              </button>
            </div>
          </div>
        </div>
      </main>
      <Toast mensagem={mensagem} />
    </>
  );
}
