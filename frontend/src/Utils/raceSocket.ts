import type { Socket } from 'socket.io-client';
import type { RaceAck } from '@ciphersprint/shared';
import { getSocket } from './socket';

export const ACK_TIMEOUT_MS = 8000;

// One acked socket call as a promise. A missing socket or a server that never
// answers becomes an ordinary failure the UI can show, never a hang.
export function raceCall<T extends object = Record<string, never>>(
    event: string,
    payload: object,
    socket: Socket | null = getSocket()
): Promise<RaceAck<T>> {
    return new Promise((resolve) => {
        if (!socket) return resolve({ ok: false, error: "You're offline. Check your connection." });
        socket.timeout(ACK_TIMEOUT_MS).emit(event, payload, (err: Error | null, res: RaceAck<T>) => {
            resolve(err ? { ok: false, error: "The server didn't answer. Try again." } : res);
        });
    });
}
