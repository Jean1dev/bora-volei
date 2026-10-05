import { describe, expect, it } from "vitest";
import { deInputs, diaSemanaLongo, formatDiaHora, formatValor, horaCurta, paraInputs } from "./format";

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
});
