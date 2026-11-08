"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatWorkoutDate } from "@/lib/format";
import {
  METRIC_UNITS,
  type ProgressMetric,
  type ProgressPoint,
} from "@/lib/progress";

// Short axis labels in UTC: dates are calendar days (decisions.md 10).
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

// Only the two Recharts tooltip fields we use, to avoid its generic prop types.
function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ProgressPoint }>;
  unit: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border border-line bg-elevated px-3 py-2 text-sm shadow-lift">
      <p className="font-mono font-semibold text-fg tabular-nums">
        {point.value} {unit}
      </p>
      <p className="text-xs text-muted">{formatWorkoutDate(point.date)}</p>
    </div>
  );
}

/** One-series line chart of the best set per day. Colors come from tokens. */
export function ProgressChart({
  points,
  metric,
}: {
  points: ProgressPoint[];
  metric: ProgressMetric;
}) {
  const unit = METRIC_UNITS[metric];
  return (
    <div className="h-64 w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
        >
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "var(--line)" }}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            domain={[0, "auto"]}
          />
          <Tooltip
            content={({ active, payload }) => (
              <ChartTooltip active={active} payload={payload} unit={unit} />
            )}
            cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={{
              r: 4,
              fill: "var(--accent)",
              stroke: "var(--elevated)",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: "var(--accent)",
              stroke: "var(--elevated)",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
