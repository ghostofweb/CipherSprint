import React from 'react';
import Dialog from './ui/Dialog';
import Button from './ui/Button';
import ThemeGrid from './ThemeGrid';
import { useTheme } from '../Context/ThemeContext';

interface ThemePickerModalProps {
    open: boolean;
    onClose: () => void;
}

// A click chooses (and saves) a theme; pointing at one only previews it.
function ThemePickerModal({ open, onClose }: ThemePickerModalProps) {
    const { previewTheme } = useTheme();
    const close = () => {
        previewTheme(null);
        onClose();
    };
    return (
        <Dialog open={open} onClose={close} title="Themes" width={760}>
            <ThemeGrid />
            <div className="ui-dialog__actions">
                <Button variant="primary" onClick={close}>Done</Button>
            </div>
        </Dialog>
    );
}

export default ThemePickerModal;
