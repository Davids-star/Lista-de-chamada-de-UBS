import { getSocket } from "./client";

export async function enviarMensagem(telefone: string, texto: string) {
  const jid = `${telefone}@s.whatsapp.net`;
  const socket = getSocket();

  await socket.sendMessage(jid, { text: texto });
}