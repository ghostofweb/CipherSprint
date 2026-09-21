import React, { useEffect, useRef, useState } from 'react';
import Graph from './Graph';
import { toast } from 'react-toastify';
import { useTestMode } from '../Context/TestModeContext';
import { useAuth } from '../Context/AuthContext';
import { useTheme } from '../Context/ThemeContext';
import { saveResult } from '../Utils/resultsHistory';
import { api } from '../Utils/api';
import { downloadBlob } from '../Utils/download';
import IconButton from './ui/IconButton';
import Spinner from './ui/Spinner';
import ShareCard from './assets/ShareCard';
import type { FinalStats } from '../Hooks/useTypingEngine';

interface StatsProps extends FinalStats {
    resetTest: () => void;
}

function Stats(props: StatsProps) {
    const {
        mode,
        modeDetail,
        wpm,
        rawWpm,
        accuracy,
        consistency,
        correctChars,
        incorrectChars,
        missedChars,
        extraChars,
        correctWords,
        charMistakes,
        durationSeconds,
        timestamp,
        graphData,
        rawGraphData,
        errorGraphData,
        resetTest,
    } = props;
    const { testType, testTime, wordCount, quoteLength } = useTestMode();
    const { user, refreshAggregates } = useAuth();
    const { theme } = useTheme();

    const safeWpm = isNaN(wpm) ? 0 : wpm;
    const safeRawWpm = isNaN(rawWpm) ? 0 : rawWpm;
    const safeAccuracy = isNaN(accuracy) ? 0 : accuracy;
    const safeConsistency = isNaN(consistency) ? 0 : consistency;

    const savedRef = useRef(false);
    const shareRef = useRef<HTMLDivElement>(null);
    const [capturing, setCapturing] = useState(false);

    // Always save to the local results history (works regardless of login
    // state), and additionally sync to the backend when logged in so it
    // follows the account across devices.
    useEffect(() => {
        if (savedRef.current || isNaN(safeAccuracy) || !safeWpm) return;
        savedRef.current = true;

        const payload = {
            mode, modeDetail, wpm, rawWpm, accuracy, consistency,
            correctChars, incorrectChars, missedChars, extraChars,
            correctWords, charMistakes, durationSeconds, timestamp,
            graphData, rawGraphData, errorGraphData,
        };
        saveResult(payload);

        if (user) {
            api.saveResult(payload)
                .then(() => refreshAggregates())
                .catch((error: Error) => {
                    toast.error(`Couldn't sync this result: ${error.message}`);
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const testTypeLabels: Record<string, string> = {
        time: `time ${testTime}s`,
        words: `words ${wordCount}`,
        quote: `quote ${quoteLength}`,
        zen: "zen",
        custom: "custom",
    };
    const testTypeLabel = testTypeLabels[testType] ?? testType;
    const testDate = timestamp ? new Date(timestamp) : null;
    const testTimeLabel = testDate
        ? testDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '';

    const handleScreenshot = async () => {
        const el = shareRef.current;
        if (!el || capturing) return;
        setCapturing(true);
        try {
            // Loaded on first use: html2canvas is ~200 kB nobody needs until now.
            const { default: html2canvas } = await import('html2canvas');
            const canvas = await html2canvas(el, {
                backgroundColor: theme.background,
                scale: 2,
                logging: false,
            });
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('empty image');
            downloadBlob(blob, `ciphersprint-${testTypeLabel.replace(/\s+/g, '-')}-${safeWpm}wpm.png`);
        } catch {
            toast.error("Couldn't create the image. Try again.");
        } finally {
            setCapturing(false);
        }
    };

    return (
        <div className="results">
            <div className="results-main">
                <div className="results-primary">
                    <div className="stat-block">
                        <div className="stat-label">wpm</div>
                        <div className="stat-value accent">{safeWpm}</div>
                    </div>
                    <div className="stat-block">
                        <div className="stat-label">acc</div>
                        <div className="stat-value accent">{safeAccuracy}%</div>
                    </div>
                </div>
                <div className="results-graph">
                    <Graph graphData={graphData} rawGraphData={rawGraphData} errorGraphData={errorGraphData} />
                </div>
            </div>
            <div className="results-secondary">
                <div className="stat-block small">
                    <div className="stat-label">test type</div>
                    <div className="stat-value">{testTypeLabel}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">raw</div>
                    <div className="stat-value">{safeRawWpm}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">characters</div>
                    <div className="stat-value">{correctChars}/{incorrectChars}/{missedChars}/{extraChars}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">consistency</div>
                    <div className="stat-value">{safeConsistency}%</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">time</div>
                    <div className="stat-value">{durationSeconds}s</div>
                    <div className="stat-sub">{testTimeLabel}</div>
                </div>
            </div>
            <div className="results-toolbar">
                <IconButton icon="restart" iconSize={22} label="Restart test" onClick={resetTest} />
                {capturing ? (
                    <span className="ui-iconbtn" role="status" aria-label="Creating image"><Spinner size={18} /></span>
                ) : (
                    <IconButton icon="camera" iconSize={22} label="Save result as image" onClick={handleScreenshot} />
                )}
            </div>
            <ShareCard
                ref={shareRef}
                theme={theme}
                username={user?.username ?? null}
                wpm={safeWpm}
                accuracy={safeAccuracy}
                rawWpm={safeRawWpm}
                consistency={safeConsistency}
                modeLabel={testTypeLabel}
                durationSeconds={durationSeconds}
                dateLabel={testDate ? testDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                graphData={graphData}
            />
        </div>
    );
}

export default Stats;
