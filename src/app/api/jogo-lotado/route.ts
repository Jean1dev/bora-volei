import { NextResponse } from "next/server";
import { enviarJogoLotado } from "@/lib/email";

type Body = {
  slug?: string;
  titulo?: string;
  organizador?: string | null;
  local?: string;
  data_hora?: string;
  vagas?: number;
  ultimoInscrito?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { slug, titulo, local, data_hora, vagas, ultimoInscrito } = body;
  if (!slug || !titulo || !local || !data_hora || !vagas || !ultimoInscrito) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://bora-volei.vercel.app";

  try {
    await enviarJogoLotado({
      slug,
      titulo,
      organizador: body.organizador ?? null,
      local,
      data_hora,
      vagas,
      ultimoInscrito,
      link: `${site}/j/${slug}`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[jogo-lotado]", e);
    return NextResponse.json({ error: "Falha ao enviar e-mail" }, { status: 502 });
  }
}
