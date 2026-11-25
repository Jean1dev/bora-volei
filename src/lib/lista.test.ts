import { describe, expect, it, vi } from "vitest";
import { dividirLista, sortearTimes } from "./lista";
import { mensagemPagamento, mensagemTimes } from "./share";

describe("lista", () => {
  it("os primeiros N são confirmados, o resto espera", () => {
    expect(dividirLista(["a", "b", "c"], 2)).toEqual({ confirmados: ["a", "b"], espera: ["c"] });
    expect(dividirLista(["a"], 2)).toEqual({ confirmados: ["a"], espera: [] });
  });

  it("sorteio divide em dois times equilibrados sem perder ninguém", () => {
    const nomes = ["a", "b", "c", "d", "e", "f", "g"];
    const [a, b] = sortearTimes(nomes);
    expect(a.length).toBe(4);
    expect(b.length).toBe(3);
    expect([...a, ...b].sort()).toEqual(nomes);
  });

  it("com menos de 12 confirmados, continua em dois times", () => {
    const nomes = Array.from({ length: 11 }, (_, i) => `j${i}`);
    const times = sortearTimes(nomes);
    expect(times).toHaveLength(2);
    expect(times.map((t) => t.length).sort()).toEqual([5, 6]);
    expect(times.flat().sort()).toEqual([...nomes].sort());
  });

  it("com 12 ou mais, sorteia três times", () => {
    const doze = Array.from({ length: 12 }, (_, i) => `j${i}`);
    const times = sortearTimes(doze);
    expect(times).toHaveLength(3);
    expect(times.map((t) => t.length)).toEqual([4, 4, 4]);
    expect(times.flat().sort()).toEqual([...doze].sort());

    const treze = Array.from({ length: 13 }, (_, i) => `j${i}`);
    const maiores = sortearTimes(treze);
    expect(maiores).toHaveLength(3);
    expect(maiores.map((t) => t.length).sort()).toEqual([4, 4, 5]);
    expect(maiores.flat().sort()).toEqual([...treze].sort());
  });

  it("a mensagem do WhatsApp lista cada time", () => {
    const texto = mensagemTimes({ titulo: "Quinta", data_hora: "2026-10-08T22:00:00Z" }, [
      ["Ana", "Bia", "Caio", "Duda"],
      ["Eva", "Fábio", "Gabi", "Hugo"],
      ["Ivo", "Júlia", "Kai", "Lia"],
    ]);
    expect(texto).toContain("*Time A:* Ana, Bia, Caio, Duda");
    expect(texto).toContain("*Time B:* Eva, Fábio, Gabi, Hugo");
    expect(texto).toContain("*Time C:* Ivo, Júlia, Kai, Lia");
  });

  it("a mensagem de pagamento informa o valor por pessoa", () => {
    vi.stubGlobal("location", { origin: "https://bora.teste" });
    const jogo = { slug: "abcdef", titulo: "Quinta", data_hora: "2026-10-08T22:00:00Z" };
    const texto = mensagemPagamento(jogo, "R$ 7,50");
    expect(texto).toContain("Cada pessoa paga *R$ 7,50*.");
    expect(texto).toContain("https://bora.teste/j/abcdef/pagar");
    expect(mensagemPagamento(jogo, null)).toContain("quando o rateio fechar");
  });
});
