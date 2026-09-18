import path from "path";
import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { pino } from "pino";

const AUTH_DIR =
  process.env.WHATSAPP_AUTH_DIR ?? path.join(process.cwd(), "whatsapp_auth");

export interface WhatsAppHandlers {
  onQr: (qr: string) => void;
  onConectado: () => void;
}

type Socket = ReturnType<typeof makeWASocket>;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) throw new Error("WhatsApp não inicializado");
  return socket;
}

export async function iniciarWhatsApp({ onQr, onConectado }: WhatsAppHandlers) {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  socket = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: "silent" }),
    browser: ["Fila Fácil", "Desktop", "1.0.0"],
    syncFullHistory: false,
  });

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      onQr(qr);
      return;
    }

    if (connection === "open") {
      console.log("WhatsApp conectado com sucesso");
      onConectado();
      return;
    }

    if (connection === "close") {
      const status = lastDisconnect?.error as { output?: { statusCode?: number } } | undefined;
      const foiLogout = status?.output?.statusCode === DisconnectReason.loggedOut;
      console.log(
        foiLogout
          ? "Sessão do WhatsApp encerrada (logout). Escaneie o QR novamente."
          : "WhatsApp desconectado. Reconectando..."
      );
      if (!foiLogout) {
        iniciarWhatsApp({ onQr, onConectado });
      }
    }
  });

  return socket;
}