import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { RaceOutcome } from '@ciphersprint/shared';
import { useTheme } from '../../Context/ThemeContext';
import { deriveUiTokens } from '../../Utils/themeTokens';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);
ChartJS.defaults.font.family = '"IBM Plex Mono", monospace';

interface RaceGraphProps {
    outcomes: RaceOutcome[];
    meId: string;
}

// Both racers' wpm second by second: you in the accent, the opponent in the
// rival colour. Someone who never finished has no line.
function RaceGraph({ outcomes, meId }: RaceGraphProps) {
    const { theme } = useTheme();
    const tokens = deriveUiTokens(theme);
    const muted = tokens['--muted'];
    const series = outcomes.filter((o) => o.graphData.length > 0);
    const length = Math.max(1, ...series.map((o) => o.graphData.length));
    const labels = Array.from({ length }, (_, i) => i + 1);

    return (
        <Line
            aria-label="Words per minute, second by second, for each racer"
            data={{
                labels,
                datasets: series.map((o) => ({
                    label: o.userId === meId ? `${o.username} (you)` : o.username,
                    data: o.graphData.map((point) => point[1]),
                    borderColor: o.userId === meId ? theme.cursorColor : tokens['--rival'],
                    backgroundColor: 'transparent',
                    pointRadius: 0,
                    borderWidth: 2,
                })),
            }}
            options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { labels: { color: muted, boxWidth: 20 } } },
                scales: {
                    x: { ticks: { color: muted }, grid: { color: 'rgba(128,128,128,0.15)' } },
                    y: {
                        title: { display: true, text: 'Words per minute', color: muted },
                        ticks: { color: muted },
                        grid: { color: 'rgba(128,128,128,0.15)' },
                        beginAtZero: true,
                    },
                },
            }}
        />
    );
}

export default RaceGraph;
