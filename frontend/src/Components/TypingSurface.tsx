import React, { createRef, forwardRef, memo, useEffect, useLayoutEffect, useMemo, useRef, useState, RefObject } from 'react';
import type { TypedChar, Cursor } from '../Hooks/useTypingEngine';
import { frameOf, glyphAt, isRevealed, useDecodeProgress } from '../Hooks/useDecrypt';
import { useSettings } from '../Context/SettingsContext';

// The decode only has to cover what is on screen: about three lines.
const DECODE_SPAN = 240;

interface Decode {
    // Characters before this word, in the whole text.
    offset: number;
    progress: number;
}

interface WordProps {
    word: string;
    typed: TypedChar[];
    isCommitted: boolean;
    decode?: Decode;
}

// Memoized so a keystroke only re-renders the word(s) whose props actually
// changed (the active word, and the one just committed) instead of every
// word in the test re-diffing on every character typed.
const Word = memo(forwardRef<HTMLSpanElement, WordProps>(function Word({ word, typed, isCommitted, decode }, ref) {
    const frame = decode ? frameOf(decode.progress) : 0;
    return (
        <span className="word" ref={ref}>
            {word.split('').map((ch, cIdx) => {
                const entry = typed[cIdx];
                const cls = entry ? entry.status : (isCommitted ? "missed" : "");
                const p = decode ? decode.offset + cIdx : 0;
                const shown = decode && !entry && !isRevealed(p, DECODE_SPAN, decode.progress) ? glyphAt(p, frame) : ch;
                return <span key={cIdx} className={cls}>{shown}</span>;
            })}
            {typed.slice(word.length).map((entry, i) => (
                <span key={`extra-${i}`} className="incorrect extra">{entry.char}</span>
            ))}
        </span>
    );
}));

// Puts a caret element at character `charIdx` of a word, using plain layout
// offsets (offsetLeft/offsetTop), matching MonkeyType's caret positioning --
// cheap enough to run per-character.
function placeCaret(caret: HTMLElement, wordEl: HTMLElement, charIdx: number) {
    const charEl = wordEl.children[charIdx] as HTMLElement | undefined;
    let left: number, top: number, height: number;
    if (charEl) {
        left = wordEl.offsetLeft + charEl.offsetLeft;
        top = wordEl.offsetTop + charEl.offsetTop;
        height = charEl.offsetHeight;
    } else {
        const lastChild = wordEl.lastElementChild as HTMLElement | null;
        left = wordEl.offsetLeft + (lastChild ? lastChild.offsetLeft + lastChild.offsetWidth : 0);
        top = wordEl.offsetTop + (lastChild ? lastChild.offsetTop : 0);
        height = lastChild ? lastChild.offsetHeight : wordEl.offsetHeight;
    }

    caret.style.left = `${left}px`;
    caret.style.top = `${top}px`;
    caret.style.height = `${height}px`;
}

// Someone else's caret in the same text (a race opponent).
export interface Ghost {
    id: string;
    cursor: Cursor;
    label: string;
    // Spectators see two racers: one in the accent, one in the rival colour.
    tone?: 'accent' | 'rival';
}

interface GhostCaretProps {
    ghost: Ghost;
    wordRefs: RefObject<HTMLSpanElement>[];
}

function GhostCaret({ ghost, wordRefs }: GhostCaretProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { word, char } = ghost.cursor;
    useLayoutEffect(() => {
        const wordEl = wordRefs[word]?.current;
        if (wordEl && ref.current) placeCaret(ref.current, wordEl, char);
    }, [word, char, wordRefs]);
    return (
        <div className={`caret caret--ghost${ghost.tone === 'accent' ? ' is-accent' : ''}`} ref={ref} aria-hidden="true">
            <span className="caret__tag">{ghost.label}</span>
        </div>
    );
}

// Room above the first line for a ghost's name tag, which would otherwise be
// clipped by the box's overflow.
const TAG_ROOM = 16;

interface TypingSurfaceProps {
    words: string[];
    typedGrid: TypedChar[][];
    cursor: Cursor;
    testStart: boolean;
    generation: number;
    isFocused: boolean;
    focusInput: () => void;
    zen?: boolean;
    ghosts?: Ghost[];
}

// The words, the caret and the three-line scrolling window. Shared by the
// solo test and a race; a race adds `ghosts`.
function TypingSurface({ words, typedGrid, cursor, testStart, generation, isFocused, focusInput, zen, ghosts }: TypingSurfaceProps) {
    const { settings } = useSettings();
    const wordsContainerRef = useRef<HTMLDivElement>(null);

    // Each new text decodes into place once. The first key ends it at once.
    const progress = useDecodeProgress(generation, settings.decrypt && !zen);
    const decoding = progress < 1 && !testStart;
    const offsets = useMemo(() => {
        const out: number[] = [];
        let running = 0;
        for (const w of words) {
            out.push(running);
            running += w.length + 1;
        }
        return out;
    }, [words]);
    const caretRef = useRef<HTMLDivElement>(null);

    // How far the words are scrolled up (px).
    const shiftYRef = useRef(0);

    const [boxHeight, setBoxHeight] = useState<number | null>(null);

    const wordRefs = useMemo(
        () => Array(words.length).fill(0).map(() => createRef<HTMLSpanElement>()),
        [words.length]
    );

    // Reset line-scroll state whenever a new test starts.
    useEffect(() => {
        shiftYRef.current = 0;
        if (wordsContainerRef.current) {
            wordsContainerRef.current.style.transform = 'translateY(0px)';
        }
    }, [generation]);

    // Measure the real pixel height of 3 lines of words and lock the box to
    // it, so exactly 3 lines are ever visible (MonkeyType's
    // updateWordsWrapperHeight, done by walking rendered word offsets
    // instead of guessing a viewport-relative height).
    useLayoutEffect(() => {
        const measure = () => {
            const wordEls = wordRefs.map((r) => r.current).filter((el): el is HTMLSpanElement => Boolean(el));
            if (wordEls.length === 0) return;

            // Collect the offsetTop of each distinct row, up to 3 rows.
            const lineTops: number[] = [];
            for (const el of wordEls) {
                const top = el.offsetTop;
                if (lineTops.length === 0 || top !== lineTops[lineTops.length - 1]) {
                    lineTops.push(top);
                    if (lineTops.length === 3) break;
                }
            }
            if (lineTops.length === 0) return;

            // Row pitch = real distance between consecutive rows (already
            // includes margin + flex gap, however the layout produces it).
            // Fall back to offsetHeight + vertical margin when only one row
            // is rendered (e.g. a short word-mode test).
            let rowPitch: number;
            if (lineTops.length >= 2) {
                rowPitch = lineTops[1] - lineTops[0];
            } else {
                const style = window.getComputedStyle(wordEls[0]);
                const vMargin = parseFloat(style.marginTop || "0") + parseFloat(style.marginBottom || "0");
                rowPitch = wordEls[0].offsetHeight + vMargin;
            }

            if (rowPitch > 0) setBoxHeight(rowPitch * 3);
        };

        measure();
        // Web fonts change the line height once they arrive.
        document.fonts?.ready.then(measure).catch(() => {});
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [wordRefs, generation, settings.fontSize, settings.testFont]);

    // Reposition the caret on every keystroke.
    useLayoutEffect(() => {
        const wordEl = wordRefs[cursor.word]?.current;
        const caret = caretRef.current;
        if (!wordEl || !caret) return;
        placeCaret(caret, wordEl, cursor.char);
    }, [cursor, wordRefs, boxHeight, settings.fontSize, settings.testFont, settings.caretStyle]);

    // Keep the active word on the 2nd of the 3 visible lines once the text
    // has moved past the first line (MonkeyType's lineJump). Worked out from
    // the word's own position rather than step by step, so a jump (seeking a
    // replay) lands on the right line too. Runs on word changes only.
    useLayoutEffect(() => {
        const wordEl = wordRefs[cursor.word]?.current;
        const firstEl = wordRefs[0]?.current;
        const container = wordsContainerRef.current;
        if (!wordEl || !firstEl || !container || !boxHeight) return;
        const pitch = boxHeight / 3;
        const shift = Math.max(0, wordEl.offsetTop - firstEl.offsetTop - pitch);
        if (shift !== shiftYRef.current) {
            shiftYRef.current = shift;
            container.style.transform = `translateY(-${shift}px)`;
        }
    }, [cursor.word, wordRefs, boxHeight]);

    const tagRoom = ghosts && ghosts.length > 0 ? TAG_ROOM : 0;
    const boxStyle = boxHeight ? { height: `${boxHeight + tagRoom}px`, paddingTop: tagRoom || undefined } : undefined;

    return (
        <div className="type-box" onClick={focusInput} style={boxStyle}>
            <div className={`words${zen ? ' zen-words' : ''}${isFocused ? '' : ' blurred'}${decoding ? ' is-decoding' : ''}`} ref={wordsContainerRef}>
                <div className={`caret${testStart ? '' : ' idle'}`} ref={caretRef} />
                {words.map((word, wIdx) => (
                    <Word
                        key={wIdx}
                        ref={wordRefs[wIdx]}
                        word={word}
                        typed={typedGrid[wIdx] || []}
                        isCommitted={wIdx < cursor.word}
                        decode={decoding && offsets[wIdx] < DECODE_SPAN ? { offset: offsets[wIdx], progress } : undefined}
                    />
                ))}
                {/* After the words, so each ghost's layout effect runs once
                    the word refs it measures against are attached. */}
                {ghosts?.map((g) => <GhostCaret key={g.id} ghost={g} wordRefs={wordRefs} />)}
            </div>
            {!isFocused && (
                <div className="focus-overlay">click here to focus</div>
            )}
        </div>
    );
}

export default TypingSurface;
