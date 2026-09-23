// Personal bests for other languages file under "<detail>@<language>".
export const modeLabel = (mode: string, detail: string | number | null | undefined): string => {
    const [d, lang] = String(detail ?? '').split('@');
    const suffix = lang ? ` · ${lang}` : '';
    if (mode === 'time') return `time ${d}s${suffix}`;
    if (mode === 'words') return `words ${d}${suffix}`;
    if (mode === 'quote') return `quote ${d}`;
    if (mode === 'zen') return 'zen';
    if (mode === 'custom') return 'custom';
    return mode ?? '-';
};

// Orders category cards sensibly within a mode group (15s before 30s before
// 60s, short before medium before long) instead of leaving them in whatever
// order the DB happened to return them.
const QUOTE_ORDER: Record<string, number> = { short: 0, medium: 1, long: 2 };

export const modeDetailSortKey = (mode: string, detail: string | number): number => {
    if (mode === 'quote') return QUOTE_ORDER[detail as string] ?? 99;
    const n = Number(detail);
    return Number.isNaN(n) ? 99 : n;
};

// Short relative-time label for the social panel's last-message previews
// ("2m", "3h", "5d") -- not trying to be exhaustive (no "months"), just
// enough to convey recency at a glance.
export const formatRelativeTime = (iso: string | null | undefined): string => {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return 'now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(iso).toLocaleDateString();
};

export const formatDuration = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

// "14:05" in the viewer's locale.
export const formatClock = (iso: string): string =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Day-separator label in a chat: Today / Yesterday / Monday / 14 Sep (/ 14 Sep 2025).
export const formatDayLabel = (iso: string, now: Date = new Date()): string => {
    const d = new Date(iso);
    const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days > 1 && days < 7) return d.toLocaleDateString([], { weekday: 'long' });
    return d.toLocaleDateString([], {
        day: 'numeric',
        month: 'short',
        ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
    });
};

export const sameDay = (a: string, b: string): boolean => startOfDay(new Date(a)) === startOfDay(new Date(b));

// Splits text into plain and URL segments for safe, React-rendered links.
export const splitLinks = (text: string): { text: string; url?: string }[] => {
    const out: { text: string; url?: string }[] = [];
    const re = /https?:\/\/[^\s<>"]+[^\s<>"'.,;:!?)\]}]/g;
    let last = 0;
    for (let m = re.exec(text); m; m = re.exec(text)) {
        if (m.index > last) out.push({ text: text.slice(last, m.index) });
        out.push({ text: m[0], url: m[0] });
        last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
};
