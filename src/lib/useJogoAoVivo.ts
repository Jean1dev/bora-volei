"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getInscricoes, getJogo, ouvirMudancas, type Inscricao, type Jogo } from "./jogos";

/**
 * Estado do jogo e da lista, começando pelo que veio do servidor e
 * recarregando quando chega um aviso do Realtime ou a aba volta ao foco.
 */
export function useJogoAoVivo(jogoInicial: Jogo, inscricoesIniciais: Inscricao[]) {
  const [jogo, setJogo] = useState(jogoInicial);
  const [inscricoes, setInscricoes] = useState(inscricoesIniciais);
  const { id, slug } = jogoInicial;
  const ultima = useRef(0);

  const recarregar = useCallback(async () => {
    // Só aplica a resposta da leitura mais recente, caso cheguem fora de ordem.
    const esta = ++ultima.current;
    try {
      const [j, l] = await Promise.all([getJogo(slug), getInscricoes(id)]);
      if (esta !== ultima.current) return;
      if (j) setJogo(j);
      setInscricoes(l);
    } catch {
      // Sem rede: fica com o que já tem na tela.
    }
  }, [id, slug]);

  useEffect(() => {
    const parar = ouvirMudancas(id, recarregar);
    const aoVoltar = () => document.visibilityState === "visible" && recarregar();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      parar();
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [id, recarregar]);

  return { jogo, inscricoes, recarregar };
}
