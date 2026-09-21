import { formatRelativeTime } from '../../Utils/format';

// "2h ago" / "just now" for use inside a sentence. formatRelativeTime's bare
// "2h" is for compact list metadata.
export function ago(iso: string): string {
    const r = formatRelativeTime(iso);
    if (r === 'now') return 'just now';
    return /^\d+[mhd]$/.test(r) ? `${r} ago` : `on ${r}`;
}
