import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import IconButton from '../ui/IconButton';
import { getDraft, setDraft } from '../../Hooks/useDraft';
import { cx } from '../../Utils/cx';

export const MAX_MESSAGE_LENGTH = 2000;
const COUNTER_FROM = 1800;
const MAX_ROWS_PX = 120;

interface ComposerProps {
    draftKey: string;
    disabled?: boolean;
    disabledReason?: string;
    autoFocus?: boolean;
    onSend: (text: string) => void;
    onTyping?: () => void;
    onStopTyping?: () => void;
}

function Composer({ draftKey, disabled, disabledReason, autoFocus, onSend, onTyping, onStopTyping }: ComposerProps) {
    const [text, setText] = useState(() => getDraft(draftKey));
    const ref = useRef<HTMLTextAreaElement>(null);

    // A different conversation: swap in its draft.
    useEffect(() => {
        setText(getDraft(draftKey));
    }, [draftKey]);

    // Focus once per conversation, as soon as the box is usable (a DM is
    // disabled until its conversation resolves). Only on devices with a real
    // pointer: on touch it would throw the keyboard up over the messages.
    const focusedFor = useRef<string | null>(null);
    useEffect(() => {
        if (!autoFocus || disabled || focusedFor.current === draftKey) return;
        if (window.matchMedia?.('(pointer: fine)').matches) {
            ref.current?.focus();
            focusedFor.current = draftKey;
        }
    }, [autoFocus, disabled, draftKey]);

    // Auto-grow up to a few lines, then scroll inside.
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_PX)}px`;
    }, [text]);

    const change = (value: string) => {
        setText(value);
        setDraft(draftKey, value);
        if (value.trim()) onTyping?.();
        else onStopTyping?.();
    };

    const submit = () => {
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setText('');
        setDraft(draftKey, '');
        onStopTyping?.();
        ref.current?.focus();
    };

    const nearLimit = text.length >= COUNTER_FROM;
    const canSend = !disabled && text.trim().length > 0;

    return (
        <form
            className="cr-composer"
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            <div className={cx('cr-composer__field', disabled && 'is-disabled')}>
                <textarea
                    ref={ref}
                    rows={1}
                    value={text}
                    maxLength={MAX_MESSAGE_LENGTH}
                    disabled={disabled}
                    placeholder={disabled ? disabledReason : 'Message'}
                    aria-label="Message"
                    enterKeyHint="send"
                    onChange={(e) => change(e.target.value)}
                    onBlur={() => onStopTyping?.()}
                    onKeyDown={(e) => {
                        // Enter sends, Shift+Enter is a newline; never send
                        // while an IME is composing (Enter confirms a candidate).
                        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            submit();
                        }
                    }}
                />
                {nearLimit && (
                    <span className={cx('cr-composer__count', text.length >= MAX_MESSAGE_LENGTH && 'is-max')} aria-live="polite">
                        {text.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                )}
            </div>
            <IconButton type="submit" icon="send" label="Send message" className="cr-composer__send" disabled={!canSend} />
        </form>
    );
}

export default Composer;
