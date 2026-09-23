import React from 'react';
import Dialog from './ui/Dialog';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'ctrl';

const GROUPS: { title: string; rows: [string[], string][] }[] = [
    {
        title: 'Typing test',
        rows: [
            [['esc'], 'Restart the test'],
            [['tab'], 'Focus restart (or restart, if set in Settings)'],
            [['enter'], 'Next test, on the results screen'],
            [['enter'], 'Finish a zen test'],
        ],
    },
    {
        title: 'Anywhere',
        rows: [
            [[mod, 'k'], 'Command palette: modes, themes, pages'],
            [['?'], 'This list'],
            [[mod, '/'], 'This list, even while typing'],
        ],
    },
    {
        title: 'Command palette',
        rows: [
            [['↑', '↓'], 'Move'],
            [['enter'], 'Run'],
            [['esc'], 'Back, then close'],
            [['backspace'], 'Leave a sub-list (theme, language)'],
        ],
    },
    {
        title: 'Replays',
        rows: [
            [['space'], 'Play or pause'],
            [['←', '→'], 'Skip 2 seconds'],
        ],
    },
];

function ShortcutsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Dialog open={open} onClose={onClose} title="Keyboard shortcuts" width={520}>
            <div className="sc">
                {GROUPS.map((g) => (
                    <section key={g.title} className="sc-group" aria-label={g.title}>
                        <h3 className="sc-title">{g.title}</h3>
                        <dl className="sc-list">
                            {g.rows.map(([keys, what], i) => (
                                <React.Fragment key={i}>
                                    <dt>
                                        {keys.map((k, j) => (
                                            <React.Fragment key={k}>
                                                {j > 0 && <span className="sc-plus">+</span>}
                                                <kbd>{k}</kbd>
                                            </React.Fragment>
                                        ))}
                                    </dt>
                                    <dd>{what}</dd>
                                </React.Fragment>
                            ))}
                        </dl>
                    </section>
                ))}
            </div>
        </Dialog>
    );
}

export default ShortcutsSheet;
