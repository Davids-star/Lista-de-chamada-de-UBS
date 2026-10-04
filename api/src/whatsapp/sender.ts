import { getSocket } from "./client";

export async function enviarMensagem(telefone: string, texto: string) {
  const jid = `${telefone}@s.whatsapp.net`;
  const socket = getSocket();

  // Sem sessão aberta o Baileys falha com erro críptico; avisamos o motivo real.
  if (!socket.user) {
    throw new Error("WhatsApp não conectado. Escaneie o QR code no terminal do worker.");
  }

  await socket.sendMessage(jid, { text: texto });
}
