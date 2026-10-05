// Datas sempre no fuso de São Paulo e em pt-BR, independente de onde o código roda.
const TZ = "America/Sao_Paulo";

const fmtPartes = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partes(iso: string) {
  const p: Record<string, string> = {};
  for (const { type, value } of fmtPartes.formatToParts(new Date(iso))) p[type] = value;
  return p as { weekday: string; day: string; month: string; year: string; hour: string; minute: string };
}

export const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Quinta-feira" */
export function diaSemanaLongo(iso: string) {
  return capitalizar(partes(iso).weekday);
}

/** "qui" */
export function diaSemanaCurto(iso: string) {
  return partes(iso).weekday.slice(0, 3);
}

/** "08/10" */
export function dataCurta(iso: string) {
  const p = partes(iso);
  return `${p.day}/${p.month}`;
}

/** "19h" ou "19h30" */
export function horaCurta(iso: string) {
  const p = partes(iso);
  const h = String(Number(p.hour));
  return p.minute === "00" ? `${h}h` : `${h}h${p.minute}`;
}

/** "qui, 08/10 · 19h" */
export function formatDiaHora(iso: string) {
  return `${diaSemanaCurto(iso)}, ${dataCurta(iso)} · ${horaCurta(iso)}`;
}

/** "R$ 10", "R$ 12,50" ou "Grátis" */
export function formatValor(valor: number | null) {
  if (!valor) return "Grátis";
  const inteiro = Number.isInteger(valor);
  return (
    "R$ " +
    valor.toLocaleString("pt-BR", {
      minimumFractionDigits: inteiro ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

/** "1º", "2º"… */
export const ordinal = (n: number) => `${n}º`;

/** Converte a data do banco para os valores dos inputs date/time (em SP). */
export function paraInputs(iso: string) {
  const p = partes(iso);
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

/**
 * Monta o timestamp a partir dos inputs date/time, interpretados em SP.
 * O Brasil não tem horário de verão desde 2019, então o offset é sempre -03:00.
 */
export function deInputs(data: string, hora: string) {
  return `${data}T${hora}:00-03:00`;
}
