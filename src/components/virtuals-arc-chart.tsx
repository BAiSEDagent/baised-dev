"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { VirtualsMonthlyRow } from "@/lib/dune";

interface VirtualsArcChartProps {
  data: VirtualsMonthlyRow[];
}

function fmtMonth(iso: string): string {
  // iso looks like "2024-10-01T00:00:00" or "2024-10"
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const newAgents = payload.find((p: { dataKey: string }) => p.dataKey === "new_agents");
  const cumulative = payload.find((p: { dataKey: string }) => p.dataKey === "cumulative_agents");
  return (
    <div
      style={{
        background: "#0a0c12",
        border: "1px solid #1a2a3a",
        fontFamily: "monospace",
        fontSize: 11,
        padding: "8px 12px",
      }}
    >
      <p style={{ color: "#787878", marginBottom: 4 }}>{fmtMonth(label)}</p>
      {newAgents && (
        <p style={{ color: "#0052FF" }}>
          NEW: {Number(newAgents.value).toLocaleString()}
        </p>
      )}
      {cumulative && (
        <p style={{ color: "#FF007A" }}>
          TOTAL: {Number(cumulative.value).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export function VirtualsArcChart({ data }: VirtualsArcChartProps) {
  if (!data || data.length < 2) return null;

  const interval = Math.max(1, Math.floor(data.length / 10));

  // Find peak month for reference line
  const peakRow = data.reduce((max, r) =>
    Number(r.new_agents) > Number(max.new_agents) ? r : max
  , data[0]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#1a2a3a" strokeDasharray="2 4" />
        <XAxis
          dataKey="month"
          tickFormatter={fmtMonth}
          interval={interval}
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          yAxisId="left"
          x={peakRow.month}
          stroke="#FF007A"
          strokeDasharray="3 3"
          strokeOpacity={0.4}
          label={{
            value: "PEAK",
            position: "top",
            fill: "#FF007A",
            fontSize: 9,
            fontFamily: "monospace",
            opacity: 0.7,
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="new_agents"
          fill="#0052FF"
          fillOpacity={0.85}
          name="New Agents"
          radius={[1, 1, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cumulative_agents"
          stroke="#FF007A"
          strokeWidth={2}
          strokeDasharray="4 2"
          dot={false}
          activeDot={{ r: 3, fill: "#FF007A", stroke: "#ededed", strokeWidth: 1 }}
          name="Cumulative"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
