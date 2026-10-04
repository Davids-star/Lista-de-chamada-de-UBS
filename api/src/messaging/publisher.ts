import { FILA_NOTIFICACOES_WHATSAPP, getChannel } from "../config/rabbitmq";

export type NotificacaoWhatsApp =
  | { tipo: "fila"; telefone: string; nome: string; pessoasNaFrente: number }
  | { tipo: "vez"; telefone: string; nome: string }
  | { tipo: "chamada_novamente"; telefone: string; nome: string }
  | { tipo: "conferencia"; telefone: string; nome: string };

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
