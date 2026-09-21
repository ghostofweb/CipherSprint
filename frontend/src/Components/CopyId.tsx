import React, { useEffect, useRef, useState } from 'react';
import Icon from './ui/Icon';

// A user's public ID, click to copy (people share it so they can be found).
function CopyId({ id }: { id: string }) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(id);
            setCopied(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard can be blocked (insecure context); the ID is still
            // visible and selectable, so failing quietly is fine.
        }
    };

    return (
        <button type="button" className="pf-id" onClick={copy} aria-label={copied ? 'ID copied' : `Copy ID ${id}`}>
            <span className="tnum">#{id}</span>
            <Icon name={copied ? 'check' : 'copy'} size={14} />
            <span className="visually-hidden" role="status">{copied ? 'Copied' : ''}</span>
        </button>
    );
}

export default CopyId;
