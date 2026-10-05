// Testa as regras de segurança e a fila contra um Supabase (local por padrão),
// usando só a chave anônima, como o navegador faria.
// Uso: node --env-file=.env.local scripts/testar-banco.mjs
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const daqui = (dias) => new Date(Date.now() + dias * 864e5).toISOString();
const rpc = async (fn, args) => {
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
};
const falha = async (promessa, trecho) => {
  await assert.rejects(promessa, (e) => e.message.includes(trecho), `esperava erro "${trecho}"`);
};
let ok = 0;
const teste = async (nome, fn) => {
  await fn();
  ok++;
  console.log("✓", nome);
};

const dados = { titulo: "Teste", local: "Quadra", data_hora: daqui(2), vagas: 2, valor: "10", publico: true };
const { slug, admin_token } = await rpc("criar_jogo", { dados });

await teste("criar_jogo devolve slug de 6 caracteres e token", () => {
  assert.match(slug, /^[a-z2-9]{6}$/);
  assert.ok(admin_token.length >= 32);
});

await teste("tabelas não são legíveis pelo anon", async () => {
  for (const t of ["jogos", "inscricoes"]) {
    const { data, error } = await sb.from(t).select("*");
    assert.ok(error || data.length === 0, `${t} legível`);
  }
});

await teste("anon não escreve direto nas tabelas nem nas views", async () => {
  for (const t of ["jogos", "inscricoes", "jogos_publicos", "inscricoes_publicas"]) {
    const { error } = await sb.from(t).insert({ titulo: "x" });
    assert.ok(error, `insert em ${t} passou`);
    const del = await sb.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000").select();
    assert.ok(del.error || del.data.length === 0, `delete em ${t} passou`);
  }
});

await teste("views não expõem tokens", async () => {
  const j = await sb.from("jogos_publicos").select("*").eq("slug", slug).single();
  assert.equal(j.data.admin_token, undefined);
  assert.equal(j.data.vagas_restantes, 2);
  const { error } = await sb.from("inscricoes_publicas").select("cancel_token");
  assert.ok(error);
});

await teste("funções internas não são chamáveis", async () => {
  await falha(rpc("_gerar_slug", {}), "");
});

await teste("validações de criar_jogo", async () => {
  await falha(rpc("criar_jogo", { dados: { ...dados, titulo: "" } }), "nome do jogo");
  await falha(rpc("criar_jogo", { dados: { ...dados, vagas: 31 } }), "vagas");
  await falha(rpc("criar_jogo", { dados: { ...dados, data_hora: daqui(-1) } }), "já passou");
  await falha(rpc("criar_jogo", { dados: { ...dados, data_hora: "ontem" } }), "inválidos");
});

let a, b, c;
await teste("inscrever: confirmados e lista de espera", async () => {
  await falha(rpc("inscrever", { p_slug: slug, p_nome: "   " }), "nome");
  await falha(rpc("inscrever", { p_slug: slug, p_nome: "x".repeat(41) }), "nome");
  a = await rpc("inscrever", { p_slug: slug, p_nome: "  Ana " });
  b = await rpc("inscrever", { p_slug: slug, p_nome: "Bia" });
  c = await rpc("inscrever", { p_slug: slug, p_nome: "Caio" });
  assert.deepEqual([a.posicao, a.confirmado], [1, true]);
  assert.deepEqual([c.posicao, c.confirmado], [3, false]);
  const { data } = await sb.from("inscricoes_publicas").select("nome").order("criado_em");
  assert.ok(data.some((i) => i.nome === "Ana"));
});

await teste("cancelar exige o token certo e a fila anda", async () => {
  await falha(rpc("cancelar_inscricao", { p_inscricao_id: a.inscricao_id, p_cancel_token: c.cancel_token }), "não encontrada");
  await rpc("cancelar_inscricao", { p_inscricao_id: a.inscricao_id, p_cancel_token: a.cancel_token });
  const j = await sb.from("jogos_publicos").select("id").eq("slug", slug).single();
  const { data } = await sb.from("inscricoes_publicas").select("nome").eq("jogo_id", j.data.id).order("criado_em").order("id");
  assert.deepEqual(data.map((i) => i.nome), ["Bia", "Caio"]); // Caio agora está entre os 2 confirmados
});

await teste("admin: token errado é rejeitado", async () => {
  assert.equal(await rpc("admin_validar", { p_slug: slug, p_admin_token: "errado" }), false);
  assert.equal(await rpc("admin_validar", { p_slug: slug, p_admin_token: admin_token }), true);
  await falha(rpc("admin_remover_inscricao", { p_slug: slug, p_admin_token: "errado", p_inscricao_id: b.inscricao_id }), "admin inválido");
  await falha(rpc("admin_atualizar_jogo", { p_slug: slug, p_admin_token: "errado", dados: { publico: false } }), "admin inválido");
  await falha(rpc("repetir_jogo", { p_slug: slug, p_admin_token: "errado" }), "admin inválido");
});

await teste("admin: atualizar só o que veio e validar", async () => {
  await rpc("admin_atualizar_jogo", { p_slug: slug, p_admin_token: admin_token, dados: { publico: false, vagas: 3 } });
  const j = await sb.from("jogos_publicos").select("*").eq("slug", slug).single();
  assert.deepEqual([j.data.publico, j.data.vagas, j.data.titulo], [false, 3, "Teste"]);
  await falha(rpc("admin_atualizar_jogo", { p_slug: slug, p_admin_token: admin_token, dados: { vagas: 1 } }), "vagas");
  await falha(rpc("admin_atualizar_jogo", { p_slug: slug, p_admin_token: admin_token, dados: { publico: null } }), "inválidos");
});

await teste("admin: remover inscrição", async () => {
  await rpc("admin_remover_inscricao", { p_slug: slug, p_admin_token: admin_token, p_inscricao_id: b.inscricao_id });
  await falha(rpc("admin_remover_inscricao", { p_slug: slug, p_admin_token: admin_token, p_inscricao_id: b.inscricao_id }), "não encontrada");
});

await teste("repetir_jogo cria +7 dias, sem inscritos, mesmo token", async () => {
  const novo = await rpc("repetir_jogo", { p_slug: slug, p_admin_token: admin_token });
  const [orig, rep] = await Promise.all(
    [slug, novo].map((s) => sb.from("jogos_publicos").select("*").eq("slug", s).single()),
  );
  assert.equal(new Date(rep.data.data_hora) - new Date(orig.data.data_hora), 7 * 864e5);
  assert.equal(rep.data.inscritos, 0);
  assert.equal(await rpc("admin_validar", { p_slug: novo, p_admin_token: admin_token }), true);
});

console.log(`\n${ok} testes passaram`);
