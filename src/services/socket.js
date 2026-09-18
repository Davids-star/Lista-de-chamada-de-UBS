import { io } from "socket.io-client";
import { API_URL } from "./api";

// Uma única conexão compartilhada pelos componentes que precisarem dela.
export const socket = io(API_URL, { autoConnect: true });
