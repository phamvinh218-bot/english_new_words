import type { ScoreTrendPoint } from "../lib/dashboardStats";

interface ScoreTrendChartProps {
  data: ScoreTrendPoint[];
}

const WIDTH = 300;
const HEIGHT = 150;
const PADDING = 24;

function xForIndex(index: number, count: number): number {
  if (count <= 1) return PADDING;
  return PADDING + (index / (count - 1)) * (WIDTH - PADDING * 2);
}

function yForPercentage(percentage: number): number {
  return PADDING + (1 - percentage / 100) * (HEIGHT - PADDING * 2);
}

export default function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const points = data.map((point, index) => ({
    x: xForIndex(index, data.length),
    y: yForPercentage(point.percentage),
    percentage: point.percentage,
  }));

  const linePath = points.map((p) => `${p.x},${p.y}`).join(" ");
  const lastPoint = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label="Daily Check-up score trend"
    >
      {[0, 50, 100].map((gridValue) => (
        <line
          key={gridValue}
          x1={PADDING}
          y1={yForPercentage(gridValue)}
          x2={WIDTH - PADDING}
          y2={yForPercentage(gridValue)}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
      ))}

      {points.length > 1 && (
        <polyline
          points={linePath}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={5} fill="#0ea5e9" stroke="#ffffff" strokeWidth={2} />
      ))}

      {lastPoint && (
        <text x={lastPoint.x} y={lastPoint.y - 10} textAnchor="end" className="fill-slate-600 text-[10px] font-bold">
          {lastPoint.percentage}%
        </text>
      )}
    </svg>
  );
}
