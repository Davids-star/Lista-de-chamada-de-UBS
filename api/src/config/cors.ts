import "dotenv/config";

// CORS_ORIGIN: origens permitidas separadas por vírgula. Aceita:
//  - "*" (libera tudo)
//  - URL exata: https://meusite.com
//  - curinga no subdomínio: https://*.vercel.app (cobre as URLs de deploy/preview da Vercel)
const origens = (process.env.CORS_ORIGIN ?? "*")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const liberaTudo = origens.length === 0 || origens.includes("*");

function paraRegex(padrao: string): RegExp {
  const escapado = padrao.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^.]+(?:\\.[^.]+)*");
  return new RegExp(`^${escapado}$`);
}

const padroes = origens.map(paraRegex);

export function origemPermitida(origem: string | undefined): boolean {
  if (liberaTudo || !origem) return true;
  return padroes.some((re) => re.test(origem));
}

/** Função de origem aceita por `cors` e `socket.io`. */
export const corsOrigin = (
  origem: string | undefined,
  callback: (erro: Error | null, permitido?: boolean) => void
) => callback(null, origemPermitida(origem));
