import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import type { Paciente } from "@prisma/client";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`Cliente conectado via Socket.io: ${socket.id}`);

    socket.on("qr_code_whatsapp", (qr: string) => {
      socket.broadcast.emit("qr_code_whatsapp", qr);
    });

    socket.on("whatsapp_conectado", () => {
      socket.broadcast.emit("whatsapp_conectado");
    });
  });

  return io;
}

export function emitirFilaAtualizada(paciente: Paciente) {
  io?.emit("fila_atualizada", paciente);
}

export function emitirStatusAlterado(paciente: Paciente) {
  io?.emit("status_alterado", paciente);
}