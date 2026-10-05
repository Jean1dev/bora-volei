import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { capitalizar, dataCurta, diaSemanaCurto, horaCurta } from "@/lib/format";
import { carregarJogo } from "./dados";

// A imagem mostra as vagas restantes, então precisa ser gerada na hora.
export const dynamic = "force-dynamic";

export const alt = "Bora Vôlei — jogo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontes = Promise.all([
  readFile(join(process.cwd(), "assets/Archivo-600.ttf")),
  readFile(join(process.cwd(), "assets/Archivo-800.ttf")),
]);

const ACCENT = "#ec3013";
const PAPER = "#f3f2f2";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const [semibold, extrabold] = await fontes;
  const dados = await carregarJogo((await params).slug);

  let corpo: React.ReactNode;
  if (!dados) {
    corpo = <div style={{ fontSize: 96, fontWeight: 800 }}>Jogo não encontrado</div>;
  } else {
    const { jogo } = dados;
    const quando = `${capitalizar(diaSemanaCurto(jogo.data_hora))} ${dataCurta(jogo.data_hora)} · ${horaCurta(jogo.data_hora)}`;
    const restantes = jogo.vagas_restantes;
    const status = restantes === 0 ? "LOTADO" : `FALTAM ${restantes} ${restantes === 1 ? "VAGA" : "VAGAS"}`;
    corpo = (
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{jogo.titulo}</div>
        <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, opacity: 0.92 }}>{jogo.local}</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 40,
            paddingTop: 28,
            borderTop: `4px solid ${PAPER}`,
          }}
        >
          <div style={{ fontSize: 44, fontWeight: 600 }}>{quando}</div>
          <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>{status}</div>
        </div>
      </div>
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: ACCENT,
          color: PAPER,
          padding: "56px 64px",
          fontFamily: "Archivo",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "0.1em" }}>BORA VÔLEI</div>
        {corpo}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: semibold, weight: 600, style: "normal" },
        { name: "Archivo", data: extrabold, weight: 800, style: "normal" },
      ],
    },
  );
}
