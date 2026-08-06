import "./PredictionSparkline.css";

function PredictionSparkline({
  current = 0,
  nextShift = 0,
  shift2 = 0,
  shift3 = 0,
  trend = "Stable",
}) {
  const values = [
    Number(current),
    Number(nextShift),
    Number(shift2),
    Number(shift3),
  ];

  const validValues = values.filter(
    (value) => Number.isFinite(value),
  );

  if (validValues.length < 2) {
    return (
      <div className="prediction-sparkline prediction-sparkline--empty">
        No forecast available
      </div>
    );
  }

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);

  const range = max - min || 1;

  const width = 220;
  const height = 60;
  const padding = 8;

  const points = values
    .map((value, index) => {
      if (!Number.isFinite(value)) {
        return null;
      }

      const x =
        padding +
        (index * (width - padding * 2)) /
          (values.length - 1);

      const y =
        height -
        padding -
        ((value - min) / range) *
          (height - padding * 2);

      return { x, y };
    })
    .filter(Boolean);

  const polyline = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const trendClass =
    String(trend).toLowerCase() === "declining"
      ? "declining"
      : String(trend).toLowerCase() ===
        "improving"
      ? "improving"
      : "stable";

  return (
    <div
      className={`prediction-sparkline prediction-sparkline--${trendClass}`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <polyline
          points={polyline}
          className="prediction-sparkline__line"
        />

        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3.5"
            className="prediction-sparkline__point"
          />
        ))}
      </svg>

      <div className="prediction-sparkline__labels">
        <span>Current</span>
        <span>N+1</span>
        <span>N+2</span>
        <span>N+3</span>
      </div>
    </div>
  );
}

export default PredictionSparkline;