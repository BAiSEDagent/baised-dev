"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AgenticPulseChartProps {
  data: Array<{
    day: string;
    daily_txs: number;
    ma_7d_txs: number;
    cumulative_txs: number;
  }>;
}

export function AgenticPulseChart({ data }: AgenticPulseChartProps) {
  if (data.length < 2) return null;
  const interval = Math.max(1, Math.floor(data.length / 8));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="cumulGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0052FF" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#0052FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1a2a3a" strokeDasharray="2 4" />
        <XAxis
          dataKey="day"
          tickFormatter={(v: string) =>
            new Date(v).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
          interval={interval}
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={(v: number) =>
            v >= 1e6
              ? `${(v / 1e6).toFixed(1)}M`
              : v >= 1000
              ? `${(v / 1000).toFixed(0)}k`
              : String(v)
          }
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v: number) =>
            v >= 1e6
              ? `${(v / 1e6).toFixed(1)}M`
              : v >= 1000
              ? `${(v / 1000).toFixed(0)}k`
              : String(v)
          }
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          contentStyle={{
            background: "#0a0c12",
            border: "1px solid #1a2a3a",
            borderRadius: 0,
            fontFamily: "monospace",
            fontSize: 11,
          }}
          labelStyle={{ color: "#787878" }}
          itemStyle={{ color: "#ededed" }}
        />
        <Legend
          iconType="line"
          wrapperStyle={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "#787878",
          }}
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="cumulative_txs"
          stroke="#0052FF"
          strokeWidth={1}
          strokeOpacity={0.3}
          fill="url(#cumulGrad)"
          dot={false}
          name="Cumulative Txs"
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="daily_txs"
          stroke="#0052FF"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, fill: "#0052FF", stroke: "#ededed", strokeWidth: 1 }}
          name="Daily Txs"
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="ma_7d_txs"
          stroke="#FF007A"
          strokeWidth={2}
          strokeDasharray="4 2"
          dot={false}
          name="7D MA"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
