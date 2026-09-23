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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

ChartJS.defaults.font.family = '"IBM Plex Mono", monospace';

interface GraphProps {
  graphData: [number, number][];
  rawGraphData?: [number, number][];
  errorGraphData?: [number, number][];
}

// Mirrors MonkeyType's result chart: a solid "wpm" line (cumulative overall
// wpm up to each second) and a dashed "raw" line (instantaneous per-second
// wpm) sharing the left axis, plus a solid "errors" line on a separate right
// axis (per-second incorrect/extra keystroke count).
const Graph = ({ graphData, rawGraphData, errorGraphData }: GraphProps) => {
  const { theme } = useTheme();

  const labels = graphData.map((i) => i[0]);

  return (
    <Line
      aria-label={`Words per minute each second of this test, ending at ${graphData[graphData.length - 1]?.[1] ?? 0} wpm.`}
      data={{
        labels,
        datasets: [
          {
            label: "wpm",
            data: graphData.map((i) => i[1]),
            borderColor: theme.subTextColor ?? theme.textColor,
            backgroundColor: "transparent",
            pointRadius: 0,
            borderWidth: 2,
            yAxisID: "y",
          },
          {
            label: "raw",
            data: (rawGraphData || []).map((i) => i[1]),
            borderColor: theme.cursorColor,
            backgroundColor: "transparent",
            borderDash: [4, 3],
            pointRadius: 0,
            borderWidth: 2,
            yAxisID: "y",
          },
          {
            label: "errors",
            data: (errorGraphData || []).map((i) => i[1]),
            borderColor: theme.incorrectWordColor,
            backgroundColor: "transparent",
            pointRadius: 0,
            borderWidth: 2,
            yAxisID: "y1",
            stepped: true,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { color: theme.subTextColor ?? theme.textColor, boxWidth: 20 },
          },
        },
        scales: {
          x: {
            ticks: { color: theme.subTextColor ?? theme.textColor },
            grid: { color: "rgba(128,128,128,0.15)" },
          },
          y: {
            position: "left",
            title: { display: true, text: "Words per Minute", color: theme.subTextColor ?? theme.textColor },
            ticks: { color: theme.subTextColor ?? theme.textColor },
            grid: { color: "rgba(128,128,128,0.15)" },
            beginAtZero: true,
          },
          y1: {
            position: "right",
            title: { display: true, text: "Errors", color: theme.subTextColor ?? theme.textColor },
            ticks: { color: theme.subTextColor ?? theme.textColor, stepSize: 1 },
            grid: { display: false },
            beginAtZero: true,
          },
        },
      }}
    />
  );
};

export default Graph;
