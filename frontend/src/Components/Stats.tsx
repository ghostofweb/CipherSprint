import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Graph from './Graph';
import KeyboardHeatmap from './KeyboardHeatmap';
import DecryptText from './DecryptText';
import IconButton from './ui/IconButton';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import ShareCard from './assets/ShareCard';
import { useTestMode } from '../Context/TestModeContext';
import { useAuth } from '../Context/AuthContext';
import { useTheme } from '../Context/ThemeContext';
import { usePractice } from '../Hooks/usePractice';
import { saveResult, saveLastReplay, localBest } from '../Utils/resultsHistory';
import { enqueueResult, isNetworkError } from '../Utils/offlineQueue';
import { api } from '../Utils/api';
import { downloadBlob } from '../Utils/download';
import { LANGUAGE_NAMES } from '../Utils/words';
import type { FinalStats } from '../Hooks/useTypingEngine';

interface StatsProps extends FinalStats {
    resetTest: () => void;
}

// Only standard tests rank; practice, custom and zen texts are not comparable.
const isRanked = (mode: string) => mode === 'time' || mode === 'words' || mode === 'quote';

interface PbState {
    isNew: boolean;
    previous: number | null;
}

function Stats(props: StatsProps) {
    const {
        mode, modeDetail, wpm, rawWpm, accuracy, consistency,
        correctChars, incorrectChars, missedChars, extraChars, correctWords,
        charMistakes, durationSeconds, timestamp, graphData, rawGraphData, errorGraphData,
        language, words, replay, resetTest,
    } = props;
    const { testType, testTime, wordCount, quoteLength, practiceKeys } = useTestMode();
    const { user, refreshAggregates } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const practise = usePractice();

    const safeWpm = isNaN(wpm) ? 0 : wpm;
    const safeRawWpm = isNaN(rawWpm) ? 0 : rawWpm;
    const safeAccuracy = isNaN(accuracy) ? 0 : accuracy;
    const safeConsistency = isNaN(consistency) ? 0 : consistency;

    const savedRef = useRef(false);
    const shareRef = useRef<HTMLDivElement>(null);
    const [capturing, setCapturing] = useState(false);
    const [pb, setPb] = useState<PbState | null>(null);

    // Saved once: to this browser (always), to the account when signed in,
    // or to the offline queue when the account can't be reached.
    useEffect(() => {
        if (savedRef.current || isNaN(safeAccuracy) || !safeWpm) return;
        savedRef.current = true;

        const payload = {
            mode, modeDetail, wpm, rawWpm, accuracy, consistency,
            correctChars, incorrectChars, missedChars, extraChars,
            correctWords, charMistakes, durationSeconds, timestamp,
            graphData, rawGraphData, errorGraphData,
        };
        const ranked = isRanked(mode) && !practiceKeys;
        const before = ranked && !user ? localBest(mode, modeDetail) : null;
        saveResult(payload);
        if (replay.length) saveLastReplay({ mode, modeDetail, wpm, accuracy, timestamp, words, replay });
        if (ranked && !user) setPb({ isNew: before === null ? false : safeWpm > before, previous: before });

        if (user) {
            const full = { ...payload, language, replay, words };
            api.saveResult(full)
                .then((res) => {
                    if (ranked) setPb(res.personalBest);
                    return refreshAggregates();
                })
                .catch((error: Error) => {
                    if (isNetworkError(error)) {
                        enqueueResult(full);
                        toast.info("You're offline. This result will sync when you're back.");
                    } else {
                        toast.error(`Couldn't sync this result: ${error.message}`);
                    }
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const testTypeLabels: Record<string, string> = {
        time: `time ${testTime}s`,
        words: `words ${wordCount}`,
        quote: `quote ${quoteLength}`,
        zen: "zen",
        custom: practiceKeys ? 'practice' : "custom",
    };
    const baseLabel = testTypeLabels[testType] ?? testType;
    const testTypeLabel = language !== 'english' && (testType === 'time' || testType === 'words') ? `${baseLabel} ${LANGUAGE_NAMES[language].toLowerCase()}` : baseLabel;
    const testDate = timestamp ? new Date(timestamp) : null;
    const testTimeLabel = testDate
        ? testDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '';
    const mistakeCount = Object.values(charMistakes).reduce((a, b) => a + b, 0);

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
            {pb?.isNew && pb.previous !== null && (
                <div className="pb-banner" role="status">
                    <span className="pb-banner__rule" aria-hidden="true" />
                    <strong>New personal best</strong>
                    <span className="tnum">+{safeWpm - pb.previous} over {pb.previous} wpm in {testTypeLabel}</span>
                </div>
            )}
            <div className="results-main">
                <div className="results-primary">
                    <div className="stat-block">
                        <div className="stat-label">wpm</div>
                        <DecryptText className="stat-value accent tnum" text={String(safeWpm)} />
                        {pb && !pb.isNew && pb.previous !== null && <div className="stat-sub">best {pb.previous}</div>}
                    </div>
                    <div className="stat-block">
                        <div className="stat-label">acc</div>
                        <DecryptText className="stat-value accent tnum" text={`${safeAccuracy}%`} />
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
                    <div className="stat-value tnum">{safeRawWpm}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">characters</div>
                    <div className="stat-value tnum" title="correct / incorrect / missed / extra">{correctChars}/{incorrectChars}/{missedChars}/{extraChars}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">consistency</div>
                    <div className="stat-value tnum">{safeConsistency}%</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">time</div>
                    <div className="stat-value tnum">{durationSeconds}s</div>
                    <div className="stat-sub">{testTimeLabel}</div>
                </div>
            </div>
            {mistakeCount > 0 && (
                <div className="results-keys">
                    <KeyboardHeatmap mistakes={charMistakes} compact caption={`${mistakeCount} mistake${mistakeCount === 1 ? '' : 's'} this test`} />
                    <Button size="sm" icon="target" onClick={() => practise(charMistakes)}>Practise these keys</Button>
                </div>
            )}
            <div className="results-toolbar">
                <IconButton icon="restart" iconSize={22} label="Next test" onClick={resetTest} />
                {replay.length > 0 && <IconButton icon="replay" iconSize={22} label="Watch replay" onClick={() => navigate('/replay/last')} />}
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
                personalBest={!!pb?.isNew && pb.previous !== null}
            />
        </div>
    );
}

export default Stats;
