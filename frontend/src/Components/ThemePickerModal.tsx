import React, { useEffect, useRef } from 'react';
import Dialog from './ui/Dialog';
import Button from './ui/Button';
import { themeOptions } from '../Utils/themeOptions';
import { useTheme } from '../Context/ThemeContext';
import { cx } from '../Utils/cx';

interface ThemePickerModalProps {
    open: boolean;
    onClose: () => void;
}

function ThemePickerModal({ open, onClose }: ThemePickerModalProps) {
    const { theme, setTheme } = useTheme();
    const originalThemeRef = useRef(theme);

    useEffect(() => {
        if (open) originalThemeRef.current = theme;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Previewing applies live; closing without applying restores the original.
    const handleCancel = () => {
        setTheme(originalThemeRef.current);
        onClose();
    };

    const handleApply = () => {
        localStorage.setItem('theme', JSON.stringify(theme));
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleCancel} title="Choose a theme" width={720}>
            <div className="theme-grid">
                {themeOptions.map(({ label, value }) => {
                    const isSelected = value.label === theme.label;
                    return (
                        <button
                            type="button"
                            key={label}
                            className={cx('theme-card', isSelected && 'selected')}
                            style={isSelected ? { borderColor: value.cursorColor } : undefined}
                            aria-pressed={isSelected}
                            onClick={() => setTheme(value)}
                        >
                            <span className="theme-preview-strip" style={{ background: value.background }}>
                                <span style={{ color: value.correctWordColor }}>the</span>{' '}
                                <span style={{ color: value.wordColor }}>quick</span>{' '}
                                <span style={{ color: value.incorrectWordColor }}>fox</span>
                                <span className="theme-preview-caret" style={{ background: value.cursorColor }} />
                            </span>
                            <span className="theme-card-label">{label}</span>
                        </button>
                    );
                })}
            </div>
            <div className="ui-dialog__actions">
                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                <Button variant="primary" onClick={handleApply}>Apply</Button>
            </div>
        </Dialog>
    );
}

export default ThemePickerModal;
