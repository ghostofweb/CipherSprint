import React from "react";
import { useTheme } from "../Context/ThemeContext";
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
ChartJS.defaults.font.family = '"Roboto Mono", monospace';

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
const HistoryGraph = ({ entries }: HistoryGraphProps) => {
  const { theme } = useTheme();

  const labels = entries.map((e) => new Date(e.timestamp).toLocaleDateString());

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "wpm",
            data: entries.map((e) => e.wpm),
            borderColor: theme.cursorColor,
            backgroundColor: "transparent",
            pointRadius: 2,
            borderWidth: 2,
            yAxisID: "y",
          },
          {
            label: "accuracy",
            data: entries.map((e) => e.accuracy),
            borderColor: theme.subTextColor,
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
          legend: { labels: { color: theme.subTextColor, boxWidth: 20 } },
        },
        scales: {
          x: {
            ticks: { color: theme.subTextColor, maxRotation: 0, autoSkip: true },
            grid: { color: "rgba(128,128,128,0.15)" },
          },
          y: {
            position: "left",
            title: { display: true, text: "wpm", color: theme.subTextColor },
            ticks: { color: theme.subTextColor },
            grid: { color: "rgba(128,128,128,0.15)" },
            beginAtZero: true,
          },
          y1: {
            position: "right",
            title: { display: true, text: "accuracy %", color: theme.subTextColor },
            ticks: { color: theme.subTextColor },
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
