import React from 'react';

/*
 * Spot illustrations for empty states. Monoline, drawn from the product's
 * own vocabulary (keycaps, a message bubble, axes) with one accent element
 * each: the caret. They use currentColor for the line and --accent for the
 * caret, so they follow every theme. Used only where an area would
 * otherwise be blank.
 */

function Ill({ size = 96, children }: { size?: number; children: React.ReactNode }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 96 96"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {children}
        </svg>
    );
}

const Caret = ({ x, y, h }: { x: number; y: number; h: number }) => (
    <rect className="ill-accent" x={x} y={y} width="3" height={h} rx="1" />
);

// A keycap: outer body plus a raised top face, leaving a lip along the bottom.
const Keycap = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
    <>
        <rect x={x} y={y} width={w} height={h} rx="6" />
        <rect x={x + 4} y={y + 3.5} width={w - 8} height={h - 13} rx="3" />
    </>
);

export function NoFriendsArt({ size }: { size?: number }) {
    return (
        <Ill size={size}>
            <path d="M10 76h76" strokeDasharray="1 5" />
            <Keycap x={12} y={38} w={32} h={32} />
            <Keycap x={52} y={38} w={32} h={32} />
            <Caret x={66.5} y={44} h={14} />
        </Ill>
    );
}

export function NoMessagesArt({ size }: { size?: number }) {
    return (
        <Ill size={size}>
            <path d="M16 18h64a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H46L30 74V60H16a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" />
            <path d="M22 39h28" />
            <Caret x={54} y={31} h={16} />
        </Ill>
    );
}

export function NoResultsArt({ size }: { size?: number }) {
    return (
        <Ill size={size}>
            <circle cx="42" cy="42" r="20" />
            <path d="M57 57l20 20" />
            <Caret x={40.5} y={33} h={18} />
        </Ill>
    );
}

export function NoGroupsArt({ size }: { size?: number }) {
    return (
        <Ill size={size}>
            <Keycap x={34} y={12} w={28} h={28} />
            <Keycap x={14} y={48} w={28} h={28} />
            <Keycap x={54} y={48} w={28} h={28} />
            <Caret x={46.5} y={18.5} h={9} />
        </Ill>
    );
}

export function NoTestsArt({ size }: { size?: number }) {
    return (
        <Ill size={size}>
            <path d="M16 14v66h66" />
            <path d="M24 64h38" strokeDasharray="2 5" />
            <Caret x={66} y={56} h={16} />
        </Ill>
    );
}
