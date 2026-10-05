import { cache } from "react";
import { getInscricoes, getJogo } from "@/lib/jogos";

/** Carrega o jogo uma vez por requisição (página + metadata + imagem). */
export const carregarJogo = cache(async (slug: string) => {
  const jogo = await getJogo(slug);
  if (!jogo) return null;
  // Depois de 3h do início, não aceita mais inscrições (mesma regra da RPC inscrever).
  const jaAconteceu = new Date(jogo.data_hora).getTime() < Date.now() - 3 * 3600e3;
  return { jogo, inscricoes: await getInscricoes(jogo.id), jaAconteceu };
});
