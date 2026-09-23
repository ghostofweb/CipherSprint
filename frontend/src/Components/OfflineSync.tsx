import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../Context/AuthContext';
import { flushQueue, pendingCount } from '../Utils/offlineQueue';

// Sends results finished offline as soon as there is a connection and an
// account to send them to.
function OfflineSync() {
    const { user, refreshAggregates } = useAuth();

    useEffect(() => {
        if (!user) return undefined;
        const flush = async () => {
            if (!navigator.onLine || pendingCount() === 0) return;
            const sent = await flushQueue();
            if (sent > 0) {
                toast.success(`Synced ${sent} result${sent === 1 ? '' : 's'} finished offline.`);
                refreshAggregates().catch(() => {});
            }
        };
        void flush();
        window.addEventListener('online', flush);
        return () => window.removeEventListener('online', flush);
    }, [user, refreshAggregates]);

    return null;
}

export default OfflineSync;
