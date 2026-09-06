import "dotenv/config";
import { app } from "./app";
import { prisma } from "./config/prisma";

const port = Number(process.env.PORT) || 3000;

async function main() {
  try {
    await prisma.$connect();
    console.log("Banco de dados conectado");
  } catch (error) {
    console.error("Falha ao conectar no banco de dados", error);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`API Fila Fácil rodando na porta ${port}`);
  });
}

main();