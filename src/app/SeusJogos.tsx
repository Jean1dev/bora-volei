"use client";

import { useEffect, useState } from "react";
import { GameRow } from "@/components/GameRow";
import { getJogosPorSlugs, type Jogo } from "@/lib/jogos";
import { meusJogos } from "@/lib/storage";

type Item = { jogo: Jogo; href: string; tag: string };

/** Jogos que este celular criou ou em que se inscreveu (via localStorage). */
export function SeusJogos() {
  const [itens, setItens] = useState<Item[]>([]);

  useEffect(() => {
    const { admin, inscricoes } = meusJogos();
    const slugs = [...new Set([...Object.keys(admin), ...Object.keys(inscricoes)])];
    getJogosPorSlugs(slugs)
      .then((jogos) =>
        setItens(
          jogos.map((jogo) => {
            const token = admin[jogo.slug];
            return token
              ? { jogo, href: `/j/${jogo.slug}/admin?t=${token}`, tag: "organizador" }
              : { jogo, href: `/j/${jogo.slug}`, tag: "inscrito" };
          }),
        ),
      )
      .catch(() => {});
  }, []);

  if (!itens.length) return null;
  return (
    <section>
      <div className="px-5 pb-1.5">
        <h4 className="text-[18px]">Seus jogos</h4>
      </div>
      <div className="border-t-2 border-ink">
        {itens.map((i) => (
          <GameRow key={i.jogo.id} jogo={i.jogo} href={i.href} tag={i.tag} />
        ))}
      </div>
    </section>
  );
}
