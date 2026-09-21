import React from 'react';
import { ToastContainer, Slide } from 'react-toastify';
import Icon, { IconName } from './ui/Icon';

const ICONS: Record<string, IconName> = {
    success: 'check-circle',
    error: 'alert-circle',
    warning: 'alert-circle',
    info: 'info',
    default: 'info',
};

// One themed container for the whole app. Visuals live in ui.css
// (.Toastify__* overrides) so toasts follow every theme.
function Toaster() {
    return (
        <ToastContainer
            position="bottom-right"
            limit={3}
            newestOnTop
            autoClose={4000}
            hideProgressBar
            closeButton={false}
            closeOnClick
            draggable={false}
            pauseOnFocusLoss={false}
            transition={Slide}
            theme="dark"
            icon={({ type }) => <Icon name={ICONS[type as string] ?? 'info'} size={18} />}
        />
    );
}

export default Toaster;
