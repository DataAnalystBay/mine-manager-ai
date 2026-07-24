import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

function ProductionTrend({ data }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="report_date" stroke="#94a3b8" minTickGap={24} />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="ore_actual"
            name="Ore Actual"
            stroke="#22c55e"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="ore_plan"
            name="Ore Plan"
            stroke="#38bdf8"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ProductionTrend;