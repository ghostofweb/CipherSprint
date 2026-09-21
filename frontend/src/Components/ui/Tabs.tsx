import React from 'react';
import Count from './Count';

export interface TabDef<T extends string> {
    id: T;
    label: string;
    count?: number;
    // Turns the count accent-colored (used for unread).
    accentCount?: boolean;
}

interface TabsProps<T extends string> {
    tabs: TabDef<T>[];
    value: T;
    onChange: (id: T) => void;
    label: string;
    className?: string;
}

function Tabs<T extends string>({ tabs, value, onChange, label, className }: TabsProps<T>) {
    // Roving arrow-key navigation, per the WAI-ARIA tabs pattern.
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const idx = tabs.findIndex((t) => t.id === value);
        const next = tabs[(idx + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        onChange(next.id);
        const node = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-tab="${next.id}"]`);
        node?.focus();
    };

    return (
        <div className={`ui-tabs${className ? ` ${className}` : ''}`} role="tablist" aria-label={label} onKeyDown={onKeyDown}>
            {tabs.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    role="tab"
                    data-tab={t.id}
                    className="ui-tab"
                    aria-selected={t.id === value}
                    tabIndex={t.id === value ? 0 : -1}
                    onClick={() => onChange(t.id)}
                >
                    {t.label}
                    {t.count ? <Count n={t.count} accent={t.accentCount} /> : null}
                </button>
            ))}
        </div>
    );
}

export default Tabs;
