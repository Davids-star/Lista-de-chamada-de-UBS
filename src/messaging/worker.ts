import "dotenv/config";
import { io } from "socket.io-client";
import qrcode from "qrcode-terminal";
import { connectRabbitMQ, FILA_NOTIFICACOES_WHATSAPP } from "../config/rabbitmq";
import { iniciarWhatsApp } from "../whatsapp/client";
import { enviarMensagem } from "../whatsapp/sender";

interface NotificacaoWhatsApp {
  telefone: string;
  nome: string;
  pessoasNaFrente: number;
}

const apiUrl = process.env.API_URL ?? "http://localhost:3000";

let socket: ReturnType<typeof io> | null = null;

function relay(evento: string, data?: unknown) {
  try {
    socket?.emit(evento, data);
  } catch (error) {
    console.error("Falha ao retransmitir evento via Socket.io", error);
  }
}

async function main() {
  const channel = await connectRabbitMQ();

  socket = io(apiUrl);
  socket.on("connect", () =>
    console.log(`Worker conectado à API (${apiUrl}) via Socket.io`)
  );

  await iniciarWhatsApp({
    onQr: (qr) => {
      qrcode.generate(qr, { small: true });
      relay("qr_code_whatsapp", qr);
    },
    onConectado: () => {
      relay("whatsapp_conectado");
    },
  });

  await channel.consume(FILA_NOTIFICACOES_WHATSAPP, async (msg) => {
    if (!msg) return;

    try {
      const payload: NotificacaoWhatsApp = JSON.parse(msg.content.toString());
      const texto = `Olá ${payload.nome}, faltam ${payload.pessoasNaFrente} pessoas para a sua vez!`;
      await enviarMensagem(payload.telefone, texto);
      console.log(`WhatsApp enviado para ${payload.telefone}`);
      channel.ack(msg);
    } catch (error) {
      console.error("Falha ao processar mensagem", error);
      channel.nack(msg, false, true);
    }
  });

  console.log("Worker aguardando mensagens da fila notificacoes_whatsapp...");
}

main().catch((error) => {
  console.error("Erro ao iniciar Worker", error);
  process.exit(1);
});