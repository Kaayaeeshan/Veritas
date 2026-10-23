import React from "react";

function trustColor(score) {
  if (score >= 85) return "#14538C";
  if (score >= 70) return "#c9962e";
  return "#b6482f";
}

export default function TrustRing({ score, size = 44, showLabel = false }) {
  const stroke = size > 70 ? 10 : 5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = trustColor(score);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDF2F7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={size > 70 ? "font-bold text-2xl font-display" : "font-mono text-xs font-medium"}
          style={{ color: size > 70 ? "#16202B" : color }}
        >
          {score}
        </span>
        {showLabel && (
          <span className="font-mono text-[9px] uppercase tracking-wide text-muted">Trust score</span>
        )}
      </div>
    </div>
  );
}
