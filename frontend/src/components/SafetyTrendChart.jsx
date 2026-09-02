import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

const GOOD_COLOR = "#16a34a";
const BELOW_TARGET_COLOR = "#dc2626";
const WARNING_COLOR = "#f59e0b";
const TARGET_COLOR = "#2563eb";
const GRID_COLOR = "#e2e8f0";
const TEXT_PRIMARY = "#0f172a";
const TEXT_SECONDARY = "#64748b";

function formatTranslation(t, key, values) {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    t(key)
  );
}

function toFiniteMetric(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatDate(value, aggregation) {
  if (!value) return "";
  const raw = String(value);
  return raw.length >= 10
    ? aggregation === "monthly" ? raw.slice(0, 7) : raw.slice(5, 10)
    : raw;
}

function SafetyTooltip({ active, payload, label, mode, target, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  const actual = Number(row.chartValue);
  const isScore = mode === "score";
  const isNearMiss = mode === "near_misses";
  const actualColor = isScore
    ? actual >= target ? GOOD_COLOR : BELOW_TARGET_COLOR
    : isNearMiss
      ? actual === 0 ? GOOD_COLOR : WARNING_COLOR
      : actual === 0 ? GOOD_COLOR : BELOW_TARGET_COLOR;
  const variance = isScore ? actual - target : actual;

  return (
    <Box sx={{ minWidth: 205, px: 1.75, py: 1.4, bgcolor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 2, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)" }}>
      <Typography sx={{ mb: 1, color: TEXT_PRIMARY, fontSize: 11, fontWeight: 800 }}>{label}</Typography>
      <Stack spacing={0.65}>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={{ color: TEXT_SECONDARY, fontSize: 11 }}>{t("safety.actual")}</Typography>
          <Typography sx={{ color: actualColor, fontSize: 11, fontWeight: 800 }}>
            {isScore ? `${actual.toFixed(1)}%` : actual}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={{ color: TEXT_SECONDARY, fontSize: 11 }}>{t("safety.target")}</Typography>
          <Typography sx={{ color: TARGET_COLOR, fontSize: 11, fontWeight: 800 }}>
            {isScore ? `${target}%` : "0"}
          </Typography>
        </Stack>
        {isScore && (
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ color: TEXT_SECONDARY, fontSize: 11 }}>{t("safety.variance")}</Typography>
            <Typography sx={{ color: variance >= 0 ? GOOD_COLOR : BELOW_TARGET_COLOR, fontSize: 11, fontWeight: 800 }}>
              {formatTranslation(t, "safety.pointsValue", { value: `${variance >= 0 ? "+" : ""}${variance.toFixed(1)}` })}
            </Typography>
          </Stack>
        )}
      </Stack>
      <Box sx={{ mt: 1.1, display: "inline-flex", alignItems: "center", gap: 0.6, px: 0.9, py: 0.35, borderRadius: "999px", bgcolor: `${actualColor}12`, color: actualColor, fontSize: 8, fontWeight: 900 }}>
        {actualColor === GOOD_COLOR ? <FiCheckCircle size={10} /> : <FiAlertTriangle size={10} />}
        {row.status}
      </Box>
    </Box>
  );
}

function TargetLineLabel({ viewBox, value }) {
  if (!viewBox || !Number.isFinite(Number(value))) return null;

  const { x, y, width } = viewBox;
  const label = `${Number(value).toLocaleString()}%`;
  const badgeWidth = Math.max(48, label.length * 7 + 14);
  const badgeHeight = 22;
  const badgeX = x + width - badgeWidth + 5;
  const badgeY = y - badgeHeight / 2;

  return (
    <g>
      <rect
        x={badgeX}
        y={badgeY}
        width={badgeWidth}
        height={badgeHeight}
        rx={5}
        fill={TARGET_COLOR}
      />
      <text
        x={badgeX + badgeWidth / 2}
        y={badgeY + 14.5}
        fill="#ffffff"
        fontFamily='Arial, "Helvetica Neue", sans-serif'
        fontSize="10"
        fontWeight="800"
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}

function LegendItem({ color, label, type = "box" }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        minHeight: 12,
        columnGap: "6px",
        flexShrink: 0,
      }}
    >
      {type === "line" ? (
        <Box
          sx={{
            width: 18,
            height: 10,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: 0,
              borderTop: `2px dashed ${color}`,
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            width: 10,
            height: 10,
            flexShrink: 0,
            borderRadius: "50%",
            bgcolor: color,
          }}
        />
      )}
      <Typography
        sx={{
          color: TEXT_SECONDARY,
          fontSize: 9,
          lineHeight: 1.2,
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

function SafetyTrendChart({
  data = [],
  safetyScoreTarget = 95,
  aggregation = "daily",
  periodDescription,
  headerActions,
  loading = false,
  t,
}) {
  const [mode, setMode] = useState("score");

  const metricConfig = useMemo(() => {
    switch (mode) {
      case "incidents":
        return { key: "incidents", title: t("safety.recordableIncidents"), target: 0, targetType: "lower" };
      case "near_misses":
        return { key: "near_misses", title: t("safety.nearMisses"), target: 0, targetType: "lower" };
      case "critical_risks":
        return { key: "critical_risks", title: t("safety.criticalRisks"), target: 0, targetType: "lower" };
      default:
        return { key: "safety_score", title: t("safety.safetyScore"), target: safetyScoreTarget, targetType: "higher" };
    }
  }, [mode, safetyScoreTarget, t]);

  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data]
      .sort((left, right) => {
        const leftTime = new Date(left?.report_date).getTime();
        const rightTime = new Date(right?.report_date).getTime();
        if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return 0;
        return leftTime - rightTime;
      })
      .map((item, index) => {
        const values = {
          score: toFiniteMetric(item?.safety_score),
          incidents: toFiniteMetric(item?.incidents),
          near_misses: toFiniteMetric(item?.near_misses),
          critical_risks: toFiniteMetric(item?.critical_risks),
        };
        const chartValue = values[mode];
        if (chartValue === null) return null;
        let status = t("safety.atOrAboveTarget");
        let barColor = GOOD_COLOR;
        if (mode === "score" && chartValue < safetyScoreTarget) {
          status = t("safety.belowTarget");
          barColor = BELOW_TARGET_COLOR;
        } else if (mode === "incidents" && chartValue > 0) {
          status = t("safety.incidentRecorded");
          barColor = BELOW_TARGET_COLOR;
        } else if (mode === "incidents") {
          status = t("safety.noIncidents");
        } else if (mode === "near_misses" && chartValue > 0) {
          status = t("safety.reviewAndLearn");
          barColor = WARNING_COLOR;
        } else if (mode === "near_misses") {
          status = t("safety.noNearMisses");
        } else if (mode === "critical_risks" && chartValue > 0) {
          status = t("safety.criticalRiskPresent");
          barColor = BELOW_TARGET_COLOR;
        } else if (mode === "critical_risks") {
          status = t("safety.noCriticalRisks");
        }
        return {
          ...item,
          _index: index,
          report_date: item?.report_date ?? item?.date ?? "",
          chartValue,
          barColor,
          status,
        };
      })
      .filter(Boolean);
  }, [data, mode, safetyScoreTarget, t]);

  const yAxisConfig = useMemo(() => {
    if (mode === "score") {
      return {
        domain: [75, 100],
        ticks: [75, 80, 85, 90, 95, 100],
        formatter: (value) => `${value}%`,
      };
    }
    const maximum = Math.max(...chartData.map((row) => Number(row.chartValue || 0)), 1);
    return {
      domain: [0, Math.max(maximum + 1, 3)],
      ticks: undefined,
      formatter: (value) => Number(value).toFixed(0),
    };
  }, [chartData, mode]);

  return (
    <Card elevation={0} sx={{ height: "100%", border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)" }}>
      <CardContent sx={{ p: { xs: 2, md: 2, lg: 1.75 }, "&:last-child": { pb: { xs: 2, md: 2, lg: 1.75 } } }}>
        <Box sx={{ mb: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: TEXT_PRIMARY, fontSize: { xs: 15, lg: 16 }, fontWeight: 900 }}>
              {t("safety.safetyPerformanceTrend")}
            </Typography>
            <Typography sx={{ mt: 0.25, color: TEXT_SECONDARY, fontSize: 10 }}>
              {metricConfig.title}: {periodDescription || t("safety.chartLastThirtyPeriods")}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 0, maxWidth: "100%", display: "flex", alignItems: "center", justifyContent: { xs: "flex-start", md: "flex-end" }, flexWrap: "wrap", gap: 1 }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, newMode) => newMode !== null && setMode(newMode)}
              size="small"
              sx={{
                maxWidth: "100%", overflowX: "auto",
                "& .MuiToggleButton-root": {
                  minWidth: 78, px: 1.4, py: 0.55,
                  textTransform: "none", fontSize: 10, fontWeight: 800,
                  whiteSpace: "nowrap",
                },
              }}
            >
              <ToggleButton value="score">{t("safety.safetyScore")}</ToggleButton>
              <ToggleButton value="incidents">{t("safety.incidents")}</ToggleButton>
              <ToggleButton value="near_misses">{t("safety.nearMisses")}</ToggleButton>
              <ToggleButton value="critical_risks">{t("safety.criticalRisks")}</ToggleButton>
            </ToggleButtonGroup>
            {headerActions}
          </Box>
        </Box>

        <Stack
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          sx={{
            mb: 0.75,
            columnGap: "20px",
            rowGap: "6px",
          }}
        >
          <LegendItem color={GOOD_COLOR} label={mode === "score" ? t("safety.atOrAboveTargetCompact") : t("safety.atTarget")} />
          <LegendItem
            color={mode === "near_misses" ? WARNING_COLOR : BELOW_TARGET_COLOR}
            label={mode === "near_misses" ? t("safety.reviewAndLearn") : mode === "score" ? t("safety.belowTargetCompact") : t("safety.aboveTarget")}
          />
          <LegendItem color={TARGET_COLOR} label={mode === "score" ? formatTranslation(t, "safety.targetValue", { value: safetyScoreTarget }) : `${t("safety.target")} 0`} type="line" />
        </Stack>

        <Box sx={{ width: "100%", height: { xs: 280, sm: 290, md: 285, lg: 255, xl: 245 } }}>
          {loading ? (
            <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
              <Stack spacing={1} alignItems="center">
                <CircularProgress size={26} />
                <Typography sx={{ color: "#64748b", fontSize: 9, fontWeight: 700 }}>{t("safety.loadingHistory")}</Typography>
              </Stack>
            </Box>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 18, left: 4, bottom: 2 }} barCategoryGap="22%">
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="report_date"
                  tickFormatter={(value) => formatDate(value, aggregation)}
                  tick={{ fontSize: 9, fill: TEXT_SECONDARY }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  minTickGap={18}
                />
                <YAxis
                  domain={yAxisConfig.domain}
                  ticks={yAxisConfig.ticks}
                  allowDecimals={mode === "score"}
                  tickFormatter={yAxisConfig.formatter}
                  tick={{ fontSize: 9, fill: TEXT_SECONDARY }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip content={<SafetyTooltip mode={mode} target={metricConfig.target} t={t} />} cursor={{ fill: "rgba(148,163,184,0.07)" }} />
                <ReferenceLine
                  y={metricConfig.target}
                  stroke={TARGET_COLOR}
                  strokeWidth={2}
                  strokeDasharray="7 6"
                  strokeLinecap="round"
                  ifOverflow="extendDomain"
                  label={mode === "score" ? <TargetLineLabel value={safetyScoreTarget} /> : undefined}
                />
                <Bar dataKey="chartValue" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive animationDuration={450}>
                  {chartData.map((row) => <Cell key={`safety-bar-${row._index}`} fill={row.barColor} />)}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
              <Typography sx={{ color: "#94a3b8", fontSize: 10 }}>{t("safety.noTrendData")}</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default SafetyTrendChart;
