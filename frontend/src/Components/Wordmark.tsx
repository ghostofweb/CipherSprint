import React from 'react';
import { cx } from '../Utils/cx';

interface WordmarkProps {
    // Blink the caret (the test is waiting for you), like the test's own caret.
    idle?: boolean;
    // Just "c▍" (phones, favicon-sized places).
    compact?: boolean;
    className?: string;
}

// The CipherSprint mark: live text with the caret between the two words, the
// same caret the test uses. No image, so it follows every theme and font.
function Wordmark({ idle = false, compact = false, className }: WordmarkProps) {
    return (
        <span className={cx('wordmark', compact && 'wordmark--compact', className)} aria-hidden="true">
            <span className="wordmark__a">{compact ? 'c' : 'cipher'}</span>
            <span className={cx('wordmark__caret', idle && 'is-idle')} />
            {!compact && <span className="wordmark__b">sprint</span>}
        </span>
    );
}

export default Wordmark;
