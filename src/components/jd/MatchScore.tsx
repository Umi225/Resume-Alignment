import { cn } from '@/lib/utils';

interface MatchScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function MatchScore({ score, size = 'md', showLabel = true }: MatchScoreProps) {
  const sizeMap = {
    sm: { width: 36, stroke: 3, font: 'text-[10px]' },
    md: { width: 48, stroke: 4, font: 'text-xs' },
    lg: { width: 64, stroke: 5, font: 'text-sm' },
  };

  const { width, stroke, font } = sizeMap[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // 使用克制的单色系统
  const colorClass =
    score >= 80
      ? 'text-emerald-600'
      : score >= 60
        ? 'text-zinc-700'
        : score >= 40
          ? 'text-zinc-500'
          : 'text-zinc-400';

  const strokeColor =
    score >= 80
      ? '#059669'
      : score >= 60
        ? '#404040'
        : score >= 40
          ? '#a3a3a3'
          : '#d4d4d4';

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex items-center justify-center" style={{ width, height: width }}>
        <svg width={width} height={width} className="-rotate-90">
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="#e5e5e5"
            strokeWidth={stroke}
          />
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <span className={cn('absolute font-semibold', font, colorClass)}>{score}</span>
      </div>
      {showLabel && <span className="text-xs text-zinc-500">匹配度</span>}
    </div>
  );
}
