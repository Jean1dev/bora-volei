import type { Jogo } from "./jogos";
import { formatDiaHora } from "./format";

export const linkJogo = (slug: string) => `${location.origin}/j/${slug}`;
export const linkAdmin = (slug: string, token: string) => `${location.origin}/j/${slug}/admin?t=${token}`;

export const whatsapp = (texto: string) => `https://wa.me/?text=${encodeURIComponent(texto)}`;

export function mensagemJogo(jogo: Pick<Jogo, "slug" | "titulo" | "data_hora" | "local">) {
  return `🏐 ${jogo.titulo} — ${formatDiaHora(jogo.data_hora)}\n${jogo.local}\n\nBora! Confirma aqui 👇\n${linkJogo(jogo.slug)}`;
}

export function mensagemTimes(jogo: Pick<Jogo, "titulo" | "data_hora">, timeA: string[], timeB: string[]) {
  return `🏐 ${jogo.titulo} — ${formatDiaHora(jogo.data_hora)}\n\n*Time A:* ${timeA.join(", ")}\n*Time B:* ${timeB.join(", ")}`;
}

export async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}
