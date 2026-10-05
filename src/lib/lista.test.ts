import { describe, expect, it } from "vitest";
import { dividirLista, sortearTimes } from "./lista";

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
});
