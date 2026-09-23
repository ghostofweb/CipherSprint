import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../Context/AuthContext';
import { useTestMode } from '../Context/TestModeContext';
import { getAggregates } from '../Utils/resultsHistory';
import { buildPracticeText, topMistakeKeys } from '../Utils/practice';

// Starts a weak-keys practice test on the typing page, from the account's
// mistake history (or this browser's, for guests).
export function usePractice() {
    const { aggregates } = useAuth();
    const { startPractice } = useTestMode();
    const navigate = useNavigate();

    return useCallback(
        (fromMistakes?: Record<string, number>) => {
            const mistakes = fromMistakes ?? aggregates?.charMistakes ?? getAggregates().charMistakes;
            const keys = topMistakeKeys(mistakes);
            if (keys.length === 0) {
                toast.info('No weak keys yet. Finish a few tests first.');
                return false;
            }
            startPractice(keys, buildPracticeText(keys));
            navigate('/');
            return true;
        },
        [aggregates, startPractice, navigate]
    );
}
