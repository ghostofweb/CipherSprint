import { useCallback, useEffect, useState } from 'react';
import type { UserSearchResult } from '@ciphersprint/shared';
import { api } from '../Utils/api';
import { useDebouncedValue } from './useDebouncedValue';

export type PeopleSearchState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; users: UserSearchResult[] }
    | { status: 'error'; message: string };

// The server needs 2+ characters (a single letter matches too much).
export const MIN_SEARCH_LENGTH = 2;

// Debounced people search with stale-response protection: a slow request for
// "no" can never overwrite the results for "nov".
export function usePeopleSearch(rawQuery: string) {
    const query = rawQuery.trim().replace(/^#/, '');
    const debounced = useDebouncedValue(query, 250);
    const [state, setState] = useState<PeopleSearchState>({ status: 'idle' });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (debounced.length < MIN_SEARCH_LENGTH) {
            setState({ status: 'idle' });
            return undefined;
        }
        let cancelled = false;
        setState({ status: 'loading' });
        api.searchUsers(debounced)
            .then((res) => { if (!cancelled) setState({ status: 'ready', users: res.users }); })
            .catch((err: Error) => { if (!cancelled) setState({ status: 'error', message: err.message }); });
        return () => { cancelled = true; };
    }, [debounced, attempt]);

    // Between a keystroke and the debounced request there is a gap: show the
    // loading state instead of the previous query's results.
    const waiting = query.length >= MIN_SEARCH_LENGTH && query !== debounced;
    const effective: PeopleSearchState = waiting ? { status: 'loading' } : state;

    const retry = useCallback(() => setAttempt((n) => n + 1), []);
    return { query, state: effective, retry };
}
