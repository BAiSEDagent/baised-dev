"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface WalletsChartProps {
  data: Array<{ day: string; active_wallets: number; ma_7d_wallets: number }>;
}

export function WalletsChart({ data }: WalletsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid stroke="#1a2a3a" strokeDasharray="2 4" />
        <XAxis
          dataKey="day"
          tickFormatter={(v) =>
            new Date(v).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
          interval={13}
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
        />
        <YAxis
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          width={45}
        />
        <Tooltip
          contentStyle={{
            background: "#0a0c12",
            border: "1px solid #1a2a3a",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        />
        <Legend
          iconType="line"
          wrapperStyle={{
            fontFamily: "monospace",
            fontSize: 11,
            color: "#787878",
          }}
        />
        <Line
          type="monotone"
          dataKey="active_wallets"
          stroke="#0052FF"
          strokeWidth={2}
          dot={false}
          name="Daily Active Wallets"
        />
        <Line
          type="monotone"
          dataKey="ma_7d_wallets"
          stroke="#FF007A"
          strokeWidth={2}
          strokeDasharray="4 2"
          dot={false}
          name="7-Day Moving Average"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
