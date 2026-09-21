import React, { useState, useEffect } from 'react';
import Dialog from './ui/Dialog';
import Button from './ui/Button';

interface CustomTextModalProps {
    open: boolean;
    onClose: () => void;
    value: string;
    onSave: (value: string) => void;
}

function CustomTextModal({ open, onClose, value, onSave }: CustomTextModalProps) {
    const [draft, setDraft] = useState(value);

    useEffect(() => {
        if (open) setDraft(value);
    }, [open, value]);

    const handleSave = () => {
        onSave(draft);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} title="Custom text" width={560}>
            <textarea
                className="ui-textarea"
                aria-label="Custom text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Paste or type the text you want to practice on."
                autoFocus
            />
            <div className="ui-dialog__actions">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={!draft.trim()}>Save</Button>
            </div>
        </Dialog>
    );
}

export default CustomTextModal;
