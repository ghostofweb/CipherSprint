import React from "react";
import { useTheme } from "../Context/ThemeContext";
import { deriveUiTokens } from "../Utils/themeTokens";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
ChartJS.defaults.font.family = '"IBM Plex Mono", monospace';

interface HistoryEntryLike {
  timestamp: number;
  wpm: number;
  accuracy: number;
}

interface HistoryGraphProps {
  entries: HistoryEntryLike[];
}

// Trend across many past tests (x-axis = test date), not seconds within a
// single test like Graph.jsx -- a separate component since the data shape
// and axes are genuinely different (one point per test, not per second).
const AVG_WINDOW = 10;

// Trend across past tests: each test as a quiet point, the 10-test moving
// average as the line that matters, accuracy dashed on its own axis.
const HistoryGraph = ({ entries }: HistoryGraphProps) => {
  const { theme } = useTheme();
  const muted = deriveUiTokens(theme)['--muted'];

  const labels = entries.map((e) => new Date(e.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }));
  const average = entries.map((_, i) => {
    const slice = entries.slice(Math.max(0, i - AVG_WINDOW + 1), i + 1);
    return Math.round(slice.reduce((n, e) => n + e.wpm, 0) / slice.length);
  });
  const latest = average[average.length - 1] ?? 0;

  return (
    <Line
      aria-label={`Words per minute over your last ${entries.length} tests; ${AVG_WINDOW}-test average now ${latest} wpm.`}
      data={{
        labels,
        datasets: [
          {
            label: `${AVG_WINDOW}-test average`,
            data: average,
            borderColor: theme.cursorColor,
            backgroundColor: "transparent",
            pointRadius: 0,
            borderWidth: 2.5,
            tension: 0.3,
            yAxisID: "y",
          },
          {
            label: "wpm",
            data: entries.map((e) => e.wpm),
            borderColor: "transparent",
            backgroundColor: theme.textColor,
            pointBackgroundColor: theme.textColor,
            pointRadius: 2.5,
            showLine: false,
            yAxisID: "y",
          },
          {
            label: "accuracy",
            data: entries.map((e) => e.accuracy),
            borderColor: muted,
            backgroundColor: "transparent",
            borderDash: [4, 3],
            pointRadius: 0,
            borderWidth: 1.5,
            yAxisID: "y1",
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: muted, boxWidth: 20 } },
        },
        scales: {
          x: {
            ticks: { color: muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            grid: { display: false },
          },
          y: {
            position: "left",
            title: { display: true, text: "wpm", color: muted },
            ticks: { color: muted },
            grid: { color: "rgba(128,128,128,0.12)" },
            beginAtZero: true,
          },
          y1: {
            position: "right",
            title: { display: true, text: "accuracy %", color: muted },
            ticks: { color: muted },
            grid: { display: false },
            min: 0,
            max: 100,
          },
        },
      }}
    />
  );
};

export default HistoryGraph;
