"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ERC8004ChartProps {
  data: Array<{ day: string; new_registrations: number }>;
}

export function ERC8004Chart({ data }: ERC8004ChartProps) {
  if (data.length < 2) return null;
  const interval = Math.max(1, Math.floor(data.length / 4));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="erc8004Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0052FF" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#0052FF" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          width={40}
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
        <Area
          type="monotone"
          dataKey="new_registrations"
          stroke="#0052FF"
          strokeWidth={2}
          fill="url(#erc8004Grad)"
          dot={false}
          activeDot={{ r: 3, fill: "#0052FF", stroke: "#ededed", strokeWidth: 1 }}
          name="New Registrations"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
