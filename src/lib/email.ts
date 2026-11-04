import { formatDiaHora } from "./format";

const ADMIN_EMAIL = "jeanlucafp@gmail.com";
const COMMUNICATION_SERVICE_URL = "https://communication-service-4f4f57e0a956.herokuapp.com";
const TEMPLATE_SLUG = "bora-volei-jogo-lotado";

const HTML_TEMPLATE = `<html><body style="font-family:sans-serif;line-height:1.5;color:#111">
  <h1 style="margin:0 0 12px;font-size:22px">Jogo lotado</h1>
  <p style="margin:0 0 16px"><strong>{{.titulo}}</strong> fechou a lista.</p>
  <ul style="padding-left:18px;margin:0 0 16px">
    <li>Quando: {{.data}}</li>
    <li>Onde: {{.local}}</li>
    {{if .organizador}}<li>Organizador: {{.organizador}}</li>{{end}}
    <li>Vagas: {{.vagas}}</li>
    <li>Último inscrito: {{.ultimoInscrito}}</li>
  </ul>
  <p style="margin:0"><a href="{{.link}}">Abrir o jogo</a></p>
</body></html>`;

export type JogoLotadoDados = {
  slug: string;
  titulo: string;
  organizador: string | null;
  local: string;
  data_hora: string;
  vagas: number;
  ultimoInscrito: string;
  link: string;
};

async function garantirTemplate() {
  const get = await fetch(`${COMMUNICATION_SERVICE_URL}/v2/email/templates/${TEMPLATE_SLUG}`);
  if (get.ok) return;
  if (get.status !== 404) {
    throw new Error(`Falha ao buscar template: ${get.status}`);
  }

  const create = await fetch(`${COMMUNICATION_SERVICE_URL}/v2/email/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: TEMPLATE_SLUG,
      name: "Bora Vôlei — jogo lotado",
      htmlTemplate: HTML_TEMPLATE,
    }),
  });

  if (!create.ok && create.status !== 400) {
    const body = await create.text();
    throw new Error(`Falha ao criar template: ${create.status} ${body}`);
  }
}

export async function enviarJogoLotado(dados: JogoLotadoDados) {
  await garantirTemplate();

  const res = await fetch(`${COMMUNICATION_SERVICE_URL}/v2/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      templateSlug: TEMPLATE_SLUG,
      to: ADMIN_EMAIL,
      subject: `Lotado: ${dados.titulo}`,
      variables: {
        titulo: dados.titulo,
        organizador: dados.organizador ?? "",
        local: dados.local,
        data: formatDiaHora(dados.data_hora),
        vagas: String(dados.vagas),
        link: dados.link,
        ultimoInscrito: dados.ultimoInscrito,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao enviar e-mail: ${res.status} ${body}`);
  }
}
