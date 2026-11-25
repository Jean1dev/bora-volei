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

/** Com 12 ou mais, três times. Abaixo disso, dois. A diferença entre eles é no máximo 1. */
export function sortearTimes<T>(jogadores: T[], random = Math.random): T[][] {
  const sh = embaralhar(jogadores, random);
  const n = sh.length >= 12 ? 3 : 2;
  const base = Math.floor(sh.length / n);
  let extra = sh.length % n;
  const times: T[][] = [];
  let i = 0;
  for (let t = 0; t < n; t++) {
    const tamanho = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    times.push(sh.slice(i, i + tamanho));
    i += tamanho;
  }
  return times;
}
