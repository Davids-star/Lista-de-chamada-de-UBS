import { FILA_NOTIFICACOES_WHATSAPP, getChannel } from "../config/rabbitmq";

export interface NotificacaoWhatsApp {
  telefone: string;
  nome: string;
  pessoasNaFrente: number;
}

export function publicarNotificacaoWhatsApp(payload: NotificacaoWhatsApp) {
  try {
    const channel = getChannel();
    channel.sendToQueue(
      FILA_NOTIFICACOES_WHATSAPP,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );
  } catch (error) {
    console.error("Falha ao publicar notificação no RabbitMQ", error);
  }
}