import React from 'react';
import { useOnline } from '../Hooks/useOnline';
import { usePendingSyncCount } from '../Utils/offlineQueue';

// Shown only while the device is offline, or while results finished offline
// are still waiting to reach the account.
function OfflineBanner() {
    const online = useOnline();
    const pending = usePendingSyncCount();
    if (online && pending === 0) return null;
    return (
        <span className="offline-chip" role="status">
            <span className="offline-chip__dot" aria-hidden="true" />
            {online ? `Syncing ${pending} result${pending === 1 ? '' : 's'}` : pending > 0 ? `Offline · ${pending} to sync` : 'Offline'}
        </span>
    );
}

export default OfflineBanner;
