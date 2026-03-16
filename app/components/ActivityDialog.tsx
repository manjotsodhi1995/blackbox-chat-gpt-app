"use client";

import { useState, useMemo, useEffect } from "react";

type DayActivity = {
  date: Date;
  tasks: number;
  prompts: number;
  mergedPRs: number;
};

function generateActivityData(): DayActivity[] {
  const data: DayActivity[] = [];
  const today = new Date();
  for (let i = 363; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const seed =
      date.getFullYear() * 10000 +
      (date.getMonth() + 1) * 100 +
      date.getDate();
    const rand = (n: number) => {
      const x = Math.sin(seed * (n + 1)) * 10000;
      return x - Math.floor(x);
    };

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const activityChance = isWeekend ? 0.3 : 0.7;

    if (rand(1) < activityChance) {
      data.push({
        date,
        tasks: Math.floor(rand(2) * 8),
        prompts: Math.floor(rand(3) * 15),
        mergedPRs: Math.floor(rand(4) * 4),
      });
    } else {
      data.push({ date, tasks: 0, prompts: 0, mergedPRs: 0 });
    }
  }
  return data;
}

function getContributionLevel(day: DayActivity): number {
  const total = day.tasks + day.prompts + day.mergedPRs;
  if (total === 0) return 0;
  if (total <= 3) return 1;
  if (total <= 8) return 2;
  if (total <= 15) return 3;
  return 4;
}

const LEVEL_COLORS = {
  light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_LABELS = ["Mon", "Wed", "Fri"];

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDark;
}

export default function ActivityDialog() {
  const activityData = useMemo(() => generateActivityData(), []);
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);
  const isDark = useIsDark();

  const colors = isDark ? LEVEL_COLORS.dark : LEVEL_COLORS.light;

  const allTimeTotals = useMemo(() => {
    return activityData.reduce(
      (acc, day) => ({
        tasks: acc.tasks + day.tasks,
        prompts: acc.prompts + day.prompts,
        mergedPRs: acc.mergedPRs + day.mergedPRs,
      }),
      { tasks: 0, prompts: 0, mergedPRs: 0 }
    );
  }, [activityData]);

  const weeks = useMemo(() => {
    const result: (DayActivity | null)[][] = [];
    let currentWeek: (DayActivity | null)[] = [];

    const firstDayOfWeek = activityData[0]?.date.getDay() ?? 0;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (const day of activityData) {
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }

    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    result.push(currentWeek);

    return result;
  }, [activityData]);

  const monthPositions = useMemo(() => {
    const positions: { label: string; col: number }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < weeks.length; w++) {
      const firstDayInWeek = weeks[w].find((d) => d !== null);
      if (firstDayInWeek) {
        const month = firstDayInWeek.date.getMonth();
        if (month !== lastMonth) {
          positions.push({ label: MONTH_LABELS[month], col: w });
          lastMonth = month;
        }
      }
    }
    return positions;
  }, [weeks]);

  const displayStats = hoveredDay
    ? {
        tasks: hoveredDay.tasks,
        prompts: hoveredDay.prompts,
        mergedPRs: hoveredDay.mergedPRs,
      }
    : allTimeTotals;

  const statsLabel = hoveredDay ? formatDate(hoveredDay.date) : "All Time";

  const textMuted = isDark ? "#8b949e" : "#57606a";
  const textPrimary = isDark ? "#c9d1d9" : "#24292f";
  const borderColor = isDark ? "#30363d" : "#d0d7de";
  const bgCard = isDark ? "#0d1117" : "#ffffff";
  const bgStatCard = isDark ? "#161b22" : "#f6f8fa";

  return (
    <div
      className="w-full max-w-[900px] rounded-xl p-5 shadow-sm"
      style={{
        border: `1px solid ${borderColor}`,
        backgroundColor: bgCard,
      }}
    >
      {/* Stats Summary */}
      <div className="mb-4 flex items-baseline gap-2">
        <span
          className="text-sm font-medium"
          style={{ color: textMuted }}
        >
          {statsLabel}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        {[
          { label: "Tasks", value: displayStats.tasks },
          { label: "Prompts", value: displayStats.prompts },
          { label: "Merged PRs", value: displayStats.mergedPRs },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg px-4 py-3 text-center transition-all duration-200"
            style={{
              border: `1px solid ${borderColor}`,
              backgroundColor: bgStatCard,
            }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: textPrimary }}
            >
              {stat.value.toLocaleString()}
            </div>
            <div
              className="mt-1 text-xs font-medium"
              style={{ color: textMuted }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Activity Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div
            className="flex text-xs mb-1"
            style={{ paddingLeft: 32, color: textMuted }}
          >
            {monthPositions.map((mp, i) => {
              const nextCol = monthPositions[i + 1]?.col ?? weeks.length;
              const span = nextCol - mp.col;
              return (
                <div
                  key={`${mp.label}-${mp.col}`}
                  style={{ width: span * 14 }}
                  className="text-left"
                >
                  {mp.label}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-0">
            {/* Day-of-week labels */}
            <div
              className="flex flex-col gap-[2px] mr-1 justify-start"
              style={{ width: 28 }}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
                <div
                  key={dayIdx}
                  className="h-[11px] text-right pr-1"
                  style={{
                    fontSize: 9,
                    lineHeight: "11px",
                    color: textMuted,
                  }}
                >
                  {dayIdx === 1
                    ? DAY_LABELS[0]
                    : dayIdx === 3
                      ? DAY_LABELS[1]
                      : dayIdx === 5
                        ? DAY_LABELS[2]
                        : ""}
                </div>
              ))}
            </div>

            {/* Heatmap cells */}
            <div className="flex gap-[2px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[2px]">
                  {week.map((day, dIdx) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${wIdx}-${dIdx}`}
                          className="h-[11px] w-[11px]"
                          style={{ borderRadius: 2 }}
                        />
                      );
                    }
                    const level = getContributionLevel(day);
                    const isHovered =
                      hoveredDay?.date.getTime() === day.date.getTime();
                    return (
                      <div
                        key={day.date.toISOString()}
                        className="h-[11px] w-[11px] cursor-pointer"
                        style={{
                          borderRadius: 2,
                          backgroundColor: colors[level],
                          transform: isHovered ? "scale(1.3)" : "scale(1)",
                          transition: "transform 100ms ease",
                          outline: isHovered
                            ? `2px solid ${isDark ? "#58a6ff" : "#0969da"}`
                            : "none",
                          outlineOffset: -1,
                        }}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        title={`${formatDate(day.date)}\n${day.tasks} tasks, ${day.prompts} prompts, ${day.mergedPRs} merged PRs`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div
            className="mt-2 flex items-center justify-end gap-1"
            style={{ fontSize: 10, color: textMuted }}
          >
            <span>Less</span>
            {colors.map((color, i) => (
              <div
                key={i}
                className="h-[11px] w-[11px]"
                style={{ borderRadius: 2, backgroundColor: color }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
