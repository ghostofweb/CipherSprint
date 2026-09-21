import React, { useId } from 'react';
import { Modal } from '@mui/material';
import IconButton from './IconButton';

interface DialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    width?: number;
    // Set false while an action is in flight (e.g. uploading) so Esc and
    // backdrop clicks cannot dismiss it mid-way.
    dismissible?: boolean;
    children: React.ReactNode;
}

// MUI's Modal supplies the focus trap, scroll lock and Esc handling; the
// chrome is ours.
function Dialog({ open, onClose, title, width = 400, dismissible = true, children }: DialogProps) {
    const titleId = useId();
    return (
        <Modal
            open={open}
            onClose={dismissible ? onClose : undefined}
            className="ui-dialog-root"
            slotProps={{ backdrop: { style: { background: 'rgba(0, 0, 0, 0.55)' } } }}
        >
            <div
                className="ui-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                style={{ width: `min(${width}px, 100%)` }}
                tabIndex={-1}
            >
                {title && (
                    <div className="ui-dialog__head">
                        <h2 className="ui-dialog__title" id={titleId}>{title}</h2>
                        <IconButton icon="close" label="Close" size="sm" onClick={onClose} disabled={!dismissible} />
                    </div>
                )}
                {children}
            </div>
        </Modal>
    );
}

export default Dialog;
