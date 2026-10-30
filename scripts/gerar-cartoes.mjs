// Gera stats/atividade.svg e stats/linguagens.svg com os dados públicos do perfil.
// Roda todo dia no GitHub Actions (.github/workflows/stats.yml).
// Uso local: GITHUB_TOKEN=<token> node scripts/gerar-cartoes.mjs   (ou DADOS=arquivo.json para testar)

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { cartaoAtividade, cartaoLinguagens } from "./cartoes.mjs";

const USUARIO = process.env.GITHUB_USER || "KAUAN-KAWASAKI";
const MAX_LINGUAGENS = 6; // o resto entra em "Outras"

async function buscar() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("Defina GITHUB_TOKEN para consultar a API GraphQL do GitHub.");
    process.exit(1);
  }
  const consulta = `
    query ($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalPullRequestReviewContributions
        }
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
          nodes { languages(first: 20, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } } }
        }
      }
    }`;
  const resposta = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: consulta, variables: { login: USUARIO } }),
  });
  const corpo = await resposta.json();
  if (!resposta.ok || corpo.errors) {
    console.error("A API do GitHub recusou a consulta:", JSON.stringify(corpo.errors ?? corpo));
    process.exit(1);
  }
  const u = corpo.data.user;
  const c = u.contributionsCollection;
  const porLinguagem = new Map();
  for (const repo of u.repositories.nodes) {
    for (const { size, node } of repo.languages.edges) {
      const atual = porLinguagem.get(node.name) ?? { nome: node.name, cor: node.color ?? "#8b949e", bytes: 0 };
      atual.bytes += size;
      porLinguagem.set(node.name, atual);
    }
  }
  const ordenadas = [...porLinguagem.values()].sort((a, b) => b.bytes - a.bytes);
  const linguagens = ordenadas.slice(0, MAX_LINGUAGENS);
  const resto = ordenadas.slice(MAX_LINGUAGENS).reduce((t, l) => t + l.bytes, 0);
  if (resto) linguagens.push({ nome: "Outras", cor: "#8b949e", bytes: resto });
  return {
    tipos: { commits: c.totalCommitContributions, pullRequests: c.totalPullRequestContributions, issues: c.totalIssueContributions, revisoes: c.totalPullRequestReviewContributions },
    linguagens,
  };
}

const dados = process.env.DADOS ? JSON.parse(await readFile(process.env.DADOS, "utf8")) : await buscar();
await mkdir(new URL("../stats/", import.meta.url), { recursive: true });
await writeFile(new URL("../stats/atividade.svg", import.meta.url), cartaoAtividade(dados.tipos));
await writeFile(new URL("../stats/linguagens.svg", import.meta.url), cartaoLinguagens(dados.linguagens));
console.log("stats/atividade.svg e stats/linguagens.svg gerados.");
