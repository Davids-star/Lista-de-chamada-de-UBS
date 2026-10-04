import amqp, { type Channel } from "amqplib";

export const FILA_NOTIFICACOES_WHATSAPP = "notificacoes_whatsapp";

const url = process.env.RABBITMQ_URL ?? "amqp://fila:fila@localhost:5672";

type Connection = Awaited<ReturnType<typeof amqp.connect>>;

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ() {
  const conn = await amqp.connect(url);
  const ch = await conn.createChannel();
  await ch.assertQueue(FILA_NOTIFICACOES_WHATSAPP, { durable: true });

  connection = conn;
  channel = ch;
  console.log("RabbitMQ conectado: fila notificacoes_whatsapp pronta");
  return ch;
}

export function getChannel(): Channel {
  if (!channel) throw new Error("RabbitMQ não inicializado");
  return channel;
}