import { io, Socket } from "socket.io-client";
import { getToken } from "./api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

// Lazily created, reused across the app -- connected only once there's a
// token to authenticate the handshake with.
export function getSocket(): Socket | null {
    const token = getToken();
    if (!token) return null;

    if (!socket) {
        socket = io(BASE_URL, { auth: { token }, autoConnect: false });
    }
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
