import "dotenv/config";
import { createServer } from "http";
import { app } from "./app";
import { prisma } from "./config/prisma";
import { initSocket } from "./websocket";

const port = Number(process.env.PORT) || 3000;

async function main() {
  try {
    await prisma.$connect();
    console.log("Banco de dados conectado");
  } catch (error) {
    console.error("Falha ao conectar no banco de dados", error);
    process.exit(1);
  }

  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`API Fila Fácil rodando na porta ${port}`);
  });
}

main();