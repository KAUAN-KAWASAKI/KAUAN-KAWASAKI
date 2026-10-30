// Desenha os dois cartões do README (atividade e linguagens) em SVG, no tema escuro do GitHub.
// Cada cartão tem fundo próprio, então funciona igual no tema claro e no escuro.

const FONTE = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const VERDE = "#39d353";
const VERDE_MEIO = "#26a641";
const FUNDO = "#0d1117";
const BORDA = "#30363d";
const TEXTO = "#e6edf3";
const SUAVE = "#8b949e";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const moldura = (largura, altura, titulo, corpo) => `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" role="img" aria-label="${esc(titulo)}">
  <title>${esc(titulo)}</title>
  <rect x="0.5" y="0.5" width="${largura - 1}" height="${altura - 1}" rx="10" fill="${FUNDO}" stroke="${BORDA}"/>
  <text x="24" y="38" fill="${TEXTO}" font-family="${FONTE}" font-size="16" font-weight="600">${esc(titulo)}</text>
${corpo}
</svg>
`;

/** Percentuais por tipo, como no "Activity overview" do GitHub. */
export function percentuais(tipos) {
  const v = [tipos.commits, tipos.pullRequests, tipos.issues, tipos.revisoes];
  const soma = v.reduce((t, n) => t + n, 0);
  return v.map((n) => (soma ? Math.round((n / soma) * 100) : 0));
}

export function cartaoAtividade(tipos) {
  const [commits, prs, issues, revisoes] = percentuais(tipos);
  const cx = 240, cy = 150, r = 76;
  const p = (pct) => (pct / 100) * r;
  const pontos = [[cx, cy - p(revisoes)], [cx + p(issues), cy], [cx, cy + p(prs)], [cx - p(commits), cy]];
  const rotulo = (x, y, nome, pct, ancora) =>
    `<text x="${x}" y="${y}" text-anchor="${ancora}" font-family="${FONTE}" font-size="13" fill="${SUAVE}">` +
    (pct > 0 ? `<tspan x="${x}" fill="${TEXTO}" font-weight="600">${pct}%</tspan><tspan x="${x}" dy="16">${nome}</tspan>` : nome) +
    `</text>`;
  const corpo = `  <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${VERDE_MEIO}" stroke-width="2"/>
  <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}" stroke="${VERDE_MEIO}" stroke-width="2"/>
  <polygon points="${pontos.map((c) => c.join(",")).join(" ")}" fill="${VERDE_MEIO}" fill-opacity="0.55" stroke="${VERDE}" stroke-width="3" stroke-linejoin="round"/>
  ${pontos.map(([x, y], i) => ([revisoes, issues, prs, commits][i] > 0 ? `<circle cx="${x}" cy="${y}" r="3.5" fill="${FUNDO}" stroke="${VERDE}" stroke-width="2"/>` : "")).join("")}
  <circle cx="${cx}" cy="${cy}" r="3.5" fill="${FUNDO}" stroke="${VERDE}" stroke-width="2"/>
  ${rotulo(cx, cy - r - (revisoes > 0 ? 28 : 12), "Revisões", revisoes, "middle")}
  ${rotulo(cx + r + 10, cy + 4 - (issues > 0 ? 8 : 0), "Issues", issues, "start")}
  ${rotulo(cx, cy + r + 22, "Pull requests", prs, "middle")}
  ${rotulo(cx - r - 10, cy + 4 - (commits > 0 ? 8 : 0), "Commits", commits, "end")}`;
  return moldura(480, 300, "Atividade no último ano", corpo);
}

export function cartaoLinguagens(linguagens) {
  const total = linguagens.reduce((t, l) => t + l.bytes, 0) || 1;
  const L = 432; // largura útil da barra
  let x = 24;
  const fatias = linguagens
    .map((l, i) => {
      const w = Math.max((l.bytes / total) * L, 2);
      const f = `<rect x="${x.toFixed(1)}" y="56" width="${w.toFixed(1)}" height="10" fill="${esc(l.cor)}"${i === 0 ? ' rx="5"' : ""}/>`;
      x += w;
      return f;
    })
    .join("\n  ");
  const itens = linguagens
    .map((l, i) => {
      const col = i % 2, lin = Math.floor(i / 2);
      const px = 24 + col * 220, py = 100 + lin * 30;
      const pct = (l.bytes / total) * 100;
      return `<circle cx="${px + 5}" cy="${py - 4}" r="5" fill="${esc(l.cor)}"/>
  <text x="${px + 18}" y="${py}" font-family="${FONTE}" font-size="13" fill="${TEXTO}">${esc(l.nome)}</text>
  <text x="${px + 196}" y="${py}" text-anchor="end" font-family="${FONTE}" font-size="13" fill="${SUAVE}">${pct < 0.1 ? "<0,1" : pt.format(pct)}%</text>`;
    })
    .join("\n  ");
  const altura = 100 + Math.ceil(linguagens.length / 2) * 30 + 10;
  const corpo = `  <clipPath id="barra"><rect x="24" y="56" width="${L}" height="10" rx="5"/></clipPath>
  <g clip-path="url(#barra)">
  ${fatias}
  </g>
  ${itens}`;
  return moldura(480, Math.max(altura, 300), "Linguagens mais usadas", corpo);
}
