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
import type { CrossChainDexData, CrossChainDexRow } from "@/lib/dune";
import { formatCompact } from "@/lib/dune";

interface CrossChainChartProps {
  data: CrossChainDexData;
}

// Merge rows from multiple chains into a single array keyed by day
function mergeByDay(data: CrossChainDexData): Record<string, unknown>[] {
  const dayMap = new Map<string, Record<string, unknown>>();

  const push = (rows: CrossChainDexRow[], key: string) => {
    for (const row of rows) {
      const entry = dayMap.get(row.day) ?? { day: row.day };
      entry[key] = row.volume_usd;
      dayMap.set(row.day, entry);
    }
  };

  push(data.base, "base");
  push(data.ethereum, "ethereum");
  push(data.arbitrum, "arbitrum");
  push(data.optimism, "optimism");

  return Array.from(dayMap.values()).sort((a, b) =>
    String(a.day).localeCompare(String(b.day))
  );
}

export function CrossChainChart({ data }: CrossChainChartProps) {
  const merged = mergeByDay(data);

  // Show a tick every ~2 weeks (14 data points)
  const interval = Math.max(1, Math.floor(merged.length / 6));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={merged}>
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
        />
        <YAxis
          tickFormatter={(v: number) => formatCompact(v, "$")}
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          width={60}
        />
        <Tooltip
          contentStyle={{
            background: "#0a0c12",
            border: "1px solid #1a2a3a",
            fontFamily: "monospace",
            fontSize: 11,
          }}
          labelStyle={{ color: "#787878" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [formatCompact(value as number, "$"), undefined]}
        />
        <Legend
          iconType="line"
          wrapperStyle={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "#787878",
          }}
        />
        <Line
          type="monotone"
          dataKey="base"
          stroke="#0052FF"
          strokeWidth={2}
          dot={false}
          name="Base"
        />
        <Line
          type="monotone"
          dataKey="ethereum"
          stroke="#787878"
          strokeWidth={2}
          strokeDasharray="3 3"
          dot={false}
          name="Ethereum"
        />
        <Line
          type="monotone"
          dataKey="arbitrum"
          stroke="#4285F4"
          strokeWidth={2}
          dot={false}
          name="Arbitrum"
        />
        <Line
          type="monotone"
          dataKey="optimism"
          stroke="#FF3B30"
          strokeWidth={2}
          dot={false}
          name="Optimism"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
