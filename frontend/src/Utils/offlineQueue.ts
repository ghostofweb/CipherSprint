import { useEffect, useState } from 'react';
import { api } from './api';

// Results finished while offline (or while the server was unreachable) wait
// here and are sent once a connection is back, so nothing typed is lost.

const KEY = 'pendingResults';
const EVENT = 'cipher:pending-results';
const MAX_QUEUED = 200;

type Payload = Record<string, unknown>;

function read(): Payload[] {
    try {
        const v = JSON.parse(localStorage.getItem(KEY) as string);
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
}

function write(items: Payload[]) {
    try {
        localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_QUEUED)));
    } catch {
        // Storage full or blocked; the local history still has the result.
    }
    window.dispatchEvent(new Event(EVENT));
}

export const pendingCount = () => read().length;

export function enqueueResult(payload: Payload) {
    write([...read(), payload]);
}

// A fetch that never reached the server throws a TypeError; an HTTP error
// comes back as an Error with the server's message.
export const isNetworkError = (err: unknown) => err instanceof TypeError || !navigator.onLine;

let flushing: Promise<number> | null = null;

// Sends everything queued, oldest first. Stops at the first network failure
// (still offline); drops anything the server rejects outright.
export function flushQueue(): Promise<number> {
    if (flushing) return flushing;
    flushing = (async () => {
        let sent = 0;
        let queue = read();
        while (queue.length > 0) {
            try {
                await api.saveResult(queue[0]);
                sent += 1;
            } catch (err) {
                if (isNetworkError(err)) break;
            }
            queue = queue.slice(1);
            write(queue);
        }
        return sent;
    })().finally(() => {
        flushing = null;
    });
    return flushing;
}

export function usePendingSyncCount(): number {
    const [count, setCount] = useState(pendingCount);
    useEffect(() => {
        const update = () => setCount(pendingCount());
        window.addEventListener(EVENT, update);
        window.addEventListener('storage', update);
        return () => {
            window.removeEventListener(EVENT, update);
            window.removeEventListener('storage', update);
        };
    }, []);
    return count;
}
