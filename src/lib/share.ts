import type { Jogo } from "./jogos";
import { formatDiaHora } from "./format";

export const linkJogo = (slug: string) => `${location.origin}/j/${slug}`;
export const linkAdmin = (slug: string, token: string) => `${location.origin}/j/${slug}/admin?t=${token}`;
export const linkPagar = (slug: string) => `${location.origin}/j/${slug}/pagar`;

export const whatsapp = (texto: string) => `https://wa.me/?text=${encodeURIComponent(texto)}`;

export function mensagemJogo(jogo: Pick<Jogo, "slug" | "titulo" | "data_hora" | "local">) {
  return `🏐 ${jogo.titulo} — ${formatDiaHora(jogo.data_hora)}\n${jogo.local}\n\nBora! Confirma aqui 👇\n${linkJogo(jogo.slug)}`;
}

export function mensagemTimes(jogo: Pick<Jogo, "titulo" | "data_hora">, times: string[][]) {
  const corpo = times.map((time, i) => `*Time ${String.fromCharCode(65 + i)}:* ${time.join(", ")}`).join("\n");
  return `🏐 ${jogo.titulo} — ${formatDiaHora(jogo.data_hora)}\n\n${corpo}`;
}

export function mensagemPagamento(jogo: Pick<Jogo, "slug" | "titulo" | "data_hora">, porPessoa: string | null) {
  const valor = porPessoa ? `Cada pessoa paga *${porPessoa}*.` : "O valor por pessoa sai no link, quando o rateio fechar.";
  return (
    `🏐 Pagamento — ${jogo.titulo}\n` +
    `${formatDiaHora(jogo.data_hora)}\n\n` +
    `${valor}\n` +
    `PIX, crédito ou carteira digital:\n` +
    `${linkPagar(jogo.slug)}`
  );
}

export async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}
