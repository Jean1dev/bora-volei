import { describe, expect, it } from "vitest";
import { deInputs, diaSemanaLongo, formatDiaHora, formatValor, horaCurta, paraInputs, valorCobranca, valorPorPessoa } from "./format";

describe("format", () => {
  it("formata dia e hora em SP", () => {
    expect(formatDiaHora("2026-10-08T22:00:00Z")).toBe("qui, 08/10 · 19h");
    expect(horaCurta("2026-10-08T23:30:00Z")).toBe("20h30");
    expect(diaSemanaLongo("2026-10-08T22:00:00Z")).toBe("Quinta-feira");
  });

  it("23h em SP não vira o dia seguinte (02h UTC)", () => {
    expect(formatDiaHora("2026-10-09T02:00:00Z")).toBe("qui, 08/10 · 23h");
  });

  it("ida e volta dos inputs de data/hora", () => {
    const iso = deInputs("2026-10-08", "19:00");
    expect(new Date(iso).toISOString()).toBe("2026-10-08T22:00:00.000Z");
    expect(paraInputs(iso)).toEqual({ data: "2026-10-08", hora: "19:00" });
  });

  it("formata valor", () => {
    expect(formatValor(null)).toBe("Grátis");
    expect(formatValor(0)).toBe("Grátis");
    expect(formatValor(10)).toBe("R$ 10");
    expect(formatValor(12.5)).toBe("R$ 12,50");
  });

  it("rateia o aluguel pelos confirmados", () => {
    expect(valorPorPessoa(null, 8)).toBeNull();
    expect(valorPorPessoa(0, 8)).toBeNull();
    expect(valorPorPessoa(90, 0)).toBeNull();
    expect(valorPorPessoa(90, 1)).toBe(90);
    expect(valorPorPessoa(90, 8)).toBe(11.25);
    expect(valorPorPessoa(90, 12)).toBe(7.5);
    expect(valorPorPessoa(90, 7)).toBe(12.86);
  });

  it("soma o rateio de quem está pagando", () => {
    expect(valorCobranca(90, 12, 1)).toBe(7.5);
    expect(valorCobranca(90, 12, 3)).toBe(22.5);
    expect(valorCobranca(90, 7, 2)).toBe(25.72);
    expect(valorCobranca(90, 0, 1)).toBeNull();
    expect(valorCobranca(null, 8, 1)).toBeNull();
    expect(valorCobranca(90, 12, 0)).toBeNull();
  });
});
