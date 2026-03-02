"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { ContractDeploymentRow } from "@/lib/dune";
import { formatCompact } from "@/lib/dune";

interface ContractsChartProps {
  data: ContractDeploymentRow[];
}

export function ContractsChart({ data }: ContractsChartProps) {
  const interval = Math.max(1, Math.floor(data.length / 6));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
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
          tickFormatter={(v: number) => formatCompact(v)}
          tick={{ fill: "#787878", fontSize: 10, fontFamily: "monospace" }}
          width={50}
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
          formatter={(value: any) => [formatCompact(value as number), undefined]}
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
          type="monotone"
          dataKey="contracts_deployed"
          stroke="#0052FF"
          fill="#0052FF"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={false}
          name="Contracts Deployed"
        />
        <Area
          type="monotone"
          dataKey="unique_deployers"
          stroke="#FF007A"
          fill="#FF007A"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={false}
          name="Unique Deployers"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
