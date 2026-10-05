// Tudo que o celular lembra fica no localStorage. Qualquer acesso pode falhar
// (aba anônima, storage bloqueado), então tudo passa por try/catch.

export type MinhaInscricao = { inscricaoId: string; cancelToken: string; nome: string };

const K_INSCRICOES = "bv_inscricoes";
const K_ADMIN = "bv_admin";

function ler<T>(chave: string): Record<string, T> {
  try {
    const v = JSON.parse(localStorage.getItem(chave) ?? "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

function gravar<T>(chave: string, valor: Record<string, T>) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {}
}

export function lerInscricao(slug: string): MinhaInscricao | null {
  return ler<MinhaInscricao>(K_INSCRICOES)[slug] ?? null;
}

export function salvarInscricao(slug: string, inscricao: MinhaInscricao) {
  gravar(K_INSCRICOES, { ...ler<MinhaInscricao>(K_INSCRICOES), [slug]: inscricao });
}

export function esquecerInscricao(slug: string) {
  const todas = ler<MinhaInscricao>(K_INSCRICOES);
  delete todas[slug];
  gravar(K_INSCRICOES, todas);
}

export function lerAdmin(slug: string): string | null {
  return ler<string>(K_ADMIN)[slug] ?? null;
}

export function salvarAdmin(slug: string, token: string) {
  gravar(K_ADMIN, { ...ler<string>(K_ADMIN), [slug]: token });
}

/** Slugs que este celular conhece, separados por papel. */
export function meusJogos() {
  return { admin: ler<string>(K_ADMIN), inscricoes: ler<MinhaInscricao>(K_INSCRICOES) };
}
