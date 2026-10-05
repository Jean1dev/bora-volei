/**
 * Não existe status de inscrição: os primeiros `vagas` inscritos (a lista já
 * vem ordenada por criado_em, id) são os confirmados e o resto é a espera.
 */
export function dividirLista<T>(inscricoes: T[], vagas: number) {
  return { confirmados: inscricoes.slice(0, vagas), espera: inscricoes.slice(vagas) };
}

export function embaralhar<T>(lista: T[], random = Math.random) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Embaralha e divide em dois times com no máximo 1 jogador de diferença. */
export function sortearTimes<T>(jogadores: T[], random = Math.random): [T[], T[]] {
  const sh = embaralhar(jogadores, random);
  const metade = Math.ceil(sh.length / 2);
  return [sh.slice(0, metade), sh.slice(metade)];
}
