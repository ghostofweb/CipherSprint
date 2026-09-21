import React from 'react';

const DAY_MS = 86400000;

const dayKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const levelFor = (count: number): number => {
    if (!count) return 0;
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
};

interface ActivityCalendarProps {
    testActivity: Record<string, number>;
    weeks?: number;
}

// A GitHub-contributions-style heatmap of test activity, built from
// resultsHistory's getAggregates().testActivity ({ "YYYY-MM-DD": count }).
function ActivityCalendar({ testActivity, weeks = 20 }: ActivityCalendarProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Align the grid to end on the most recent Saturday so full weeks render
    // as clean columns (Sun-Sat), matching the familiar GitHub layout.
    const endOffset = 6 - today.getDay();
    const gridEnd = new Date(today.getTime() + endOffset * DAY_MS);
    const totalDays = weeks * 7;
    const gridStart = new Date(gridEnd.getTime() - (totalDays - 1) * DAY_MS);

    const columns: { key: string; date: Date; count: number; isFuture: boolean }[][] = [];
    for (let w = 0; w < weeks; w++) {
        const days: { key: string; date: Date; count: number; isFuture: boolean }[] = [];
        for (let d = 0; d < 7; d++) {
            const date = new Date(gridStart.getTime() + (w * 7 + d) * DAY_MS);
            const key = dayKey(date);
            const count = testActivity[key] || 0;
            days.push({ key, date, count, isFuture: date > today });
        }
        columns.push(days);
    }

    return (
        <div className="activity-calendar">
            {columns.map((week, i) => (
                <div className="activity-week" key={i}>
                    {week.map((day) => (
                        <div
                            key={day.key}
                            className={`activity-day level-${day.isFuture ? 0 : levelFor(day.count)}`}
                            title={day.isFuture ? undefined : `${day.key}: ${day.count} test${day.count === 1 ? "" : "s"}`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default ActivityCalendar;
