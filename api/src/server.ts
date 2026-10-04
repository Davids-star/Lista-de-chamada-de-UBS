import "dotenv/config";
import { createServer } from "http";
import { app } from "./app";
import { prisma } from "./config/prisma";
import { connectRabbitMQ } from "./config/rabbitmq";
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

  try {
    await connectRabbitMQ();
  } catch (error) {
    console.error(
      "Falha ao conectar no RabbitMQ. Notificações WhatsApp ficarão indisponíveis.",
      error
    );
  }

  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(port, () => {
    console.log(`API Fila Fácil rodando na porta ${port}`);
  });
}

main();