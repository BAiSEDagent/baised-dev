"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TVLDataPoint {
  date: string;
  tvl: number;
}

export function TVLChart({ data }: { data: TVLDataPoint[] }) {
  if (data.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0052FF" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#0052FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          stroke="#444"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          fontFamily="var(--font-geist-mono), monospace"
        />
        <YAxis
          stroke="#444"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}B`}
          fontFamily="var(--font-geist-mono), monospace"
          width={55}
        />
        <Tooltip
          contentStyle={{
            background: "#0a0c12",
            border: "1px solid #1a2a3a",
            borderRadius: 0,
            fontFamily: "monospace",
            fontSize: 12,
          }}
          labelStyle={{ color: "#787878" }}
          itemStyle={{ color: "#ededed" }}
          formatter={(value: number | undefined) => [`$${(value ?? 0).toLocaleString()}M`, "TVL"]}
        />
        <Area
          type="monotone"
          dataKey="tvl"
          stroke="#0052FF"
          strokeWidth={2}
          fill="url(#tvlGradient)"
          dot={false}
          activeDot={{ r: 3, fill: "#0052FF", stroke: "#ededed", strokeWidth: 1 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
