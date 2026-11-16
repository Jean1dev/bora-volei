export type DuracaoVolei = "1h" | "2h";

export type ProdutoVolei = {
  duracao: DuracaoVolei;
  name: string;
  priceId: string;
};

export const PRODUTOS_VOLEI: Record<DuracaoVolei, ProdutoVolei> = {
  "1h": {
    duracao: "1h",
    name: "Vôlei 1h",
    priceId: "price_1UcPoHG7OpCiJ6QLKNDgMWwJ",
  },
  "2h": {
    duracao: "2h",
    name: "Vôlei 2h",
    priceId: "price_1UcPoWG7OpCiJ6QLNukEKOA9",
  },
};

export function produtoPorDuracao(duracao: string): ProdutoVolei | null {
  if (duracao === "1h" || duracao === "2h") return PRODUTOS_VOLEI[duracao];
  return null;
}
