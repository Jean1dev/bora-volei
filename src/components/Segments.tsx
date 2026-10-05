/** Barra de progresso em segmentos: um por vaga, em grade de 12 colunas. */
export function Segments({ preenchidos, total, altura = 14 }: { preenchidos: number; total: number; altura?: number }) {
  return (
    <div className="grid grid-cols-12 gap-[3px]">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ height: altura }} className={i < preenchidos ? "bg-accent" : "bg-neutral-300"} />
      ))}
    </div>
  );
}
