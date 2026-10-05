import "dotenv/config";

// CORS_ORIGIN: domínios do front separados por vírgula. Vazio ou "*" libera tudo.
const origens = (process.env.CORS_ORIGIN ?? "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const corsOrigin: string | string[] =
  origens.length === 0 || origens.includes("*") ? "*" : origens;
