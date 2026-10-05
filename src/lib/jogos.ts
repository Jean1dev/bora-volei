import { supabase } from "./supabase";

export type Jogo = {
  id: string;
  slug: string;
  titulo: string;
  organizador: string | null;
  data_hora: string;
  local: string;
  vagas: number;
  valor: number | null;
  publico: boolean;
  criado_em: string;
  inscritos: number;
  vagas_restantes: number;
};

export type Inscricao = { id: string; nome: string; criado_em: string };

export type DadosJogo = {
  titulo: string;
  organizador: string;
  data_hora: string;
  local: string;
  vagas: number;
  valor: string;
  publico?: boolean;
};

// ── leitura (views públicas) ─────────────────────────────────────────────────

export async function getJogo(slug: string): Promise<Jogo | null> {
  const { data, error } = await supabase.from("jogos_publicos").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Já ordenada: os primeiros `vagas` são os confirmados. */
export async function getInscricoes(jogoId: string): Promise<Inscricao[]> {
  const { data, error } = await supabase
    .from("inscricoes_publicas")
    .select("id, nome, criado_em")
    .eq("jogo_id", jogoId)
    .order("criado_em")
    .order("id");
  if (error) throw new Error(error.message);
  return data;
}

export async function getJogosComVaga(): Promise<Jogo[]> {
  const { data, error } = await supabase
    .from("jogos_publicos")
    .select("*")
    .eq("publico", true)
    .gt("data_hora", new Date().toISOString())
    .gt("vagas_restantes", 0)
    .order("data_hora")
    .limit(50);
  if (error) throw new Error(error.message);
  return data;
}

export async function getJogosPorSlugs(slugs: string[]): Promise<Jogo[]> {
  if (!slugs.length) return [];
  const { data, error } = await supabase
    .from("jogos_publicos")
    .select("*")
    .in("slug", slugs)
    .gt("data_hora", new Date(Date.now() - 6 * 3600e3).toISOString())
    .order("data_hora");
  if (error) throw new Error(error.message);
  return data;
}

/** Avisa quando a lista ou o jogo mudam (canal público, sem dados no payload). */
export function ouvirMudancas(jogoId: string, aoMudar: () => void) {
  const canal = supabase.channel(`jogo:${jogoId}`).on("broadcast", { event: "mudou" }, aoMudar).subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}

// ── escrita (RPCs) ───────────────────────────────────────────────────────────

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const criarJogo = (dados: DadosJogo) =>
  rpc<{ slug: string; admin_token: string }>("criar_jogo", { dados });

export const inscrever = (slug: string, nome: string) =>
  rpc<{ inscricao_id: string; cancel_token: string; posicao: number; confirmado: boolean }>("inscrever", {
    p_slug: slug,
    p_nome: nome,
  });

export const cancelarInscricao = (inscricaoId: string, cancelToken: string) =>
  rpc<boolean>("cancelar_inscricao", { p_inscricao_id: inscricaoId, p_cancel_token: cancelToken });

export const adminValidar = (slug: string, token: string) =>
  rpc<boolean>("admin_validar", { p_slug: slug, p_admin_token: token });

export const adminRemoverInscricao = (slug: string, token: string, inscricaoId: string) =>
  rpc<boolean>("admin_remover_inscricao", { p_slug: slug, p_admin_token: token, p_inscricao_id: inscricaoId });

export const adminAtualizarJogo = (slug: string, token: string, dados: Partial<DadosJogo>) =>
  rpc<boolean>("admin_atualizar_jogo", { p_slug: slug, p_admin_token: token, dados });

export const repetirJogo = (slug: string, token: string) =>
  rpc<string>("repetir_jogo", { p_slug: slug, p_admin_token: token });
