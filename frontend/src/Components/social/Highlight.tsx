import React from 'react';

// Marks the matched part of a name in weight, not with a highlight box.
function Highlight({ text, query }: { text: string; query: string }) {
    const q = query.trim().replace(/^#/, '');
    if (!q) return <>{text}</>;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return <>{text}</>;
    return (
        <>
            {text.slice(0, i)}
            <strong>{text.slice(i, i + q.length)}</strong>
            {text.slice(i + q.length)}
        </>
    );
}

export default Highlight;
