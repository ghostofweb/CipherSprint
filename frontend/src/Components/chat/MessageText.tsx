import React from 'react';
import { splitLinks } from '../../Utils/format';

// Renders message text with http(s) URLs as links. Segments are built as
// React nodes (never HTML strings), so message content cannot inject markup.
function MessageText({ text }: { text: string }) {
    return (
        <>
            {splitLinks(text).map((seg, i) =>
                seg.url ? (
                    <a key={i} href={seg.url} target="_blank" rel="noopener noreferrer nofollow">
                        {seg.text}
                    </a>
                ) : (
                    <React.Fragment key={i}>{seg.text}</React.Fragment>
                )
            )}
        </>
    );
}

export default React.memo(MessageText);
