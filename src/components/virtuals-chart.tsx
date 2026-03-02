"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCompact } from "@/lib/dune";

interface VirtualsDexChartProps {
  data: Array<{
    day: string;
    volume_usd: number;
    unique_traders: number;
  }>;
}

export function VirtualsDexChart({ data }: VirtualsDexChartProps) {
  if (data.length < 2) return null;
  const interval = Math.max(1, Math.floor(data.length / 8));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
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
          tickFormatter={(v: number) => formatCompact(v, "$")}
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          width={45}
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: string | undefined) => [
            name === "Volume USD"
              ? formatCompact(value as number, "$")
              : (value as number).toLocaleString(),
            name ?? "",
          ]}
        />
        <Legend
          wrapperStyle={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "#787878",
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="volume_usd"
          fill="#0052FF"
          fillOpacity={0.8}
          name="Volume USD"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="unique_traders"
          stroke="#FF007A"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, fill: "#FF007A", stroke: "#ededed", strokeWidth: 1 }}
          name="Unique Traders"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
