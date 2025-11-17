"use client"

interface CircleScoreProps {
  value: number // 0-100
}

export function CircleScore({ value }: CircleScoreProps) {
  const size = 48
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min(Math.max(value, 0), 100)
  const offset = circumference - (percentage / 100) * circumference

  // Color based on score
  let strokeColor = "#94A3B8" // gray for < 40
  if (percentage >= 80) {
    strokeColor = "#22C55E" // green for >= 80
  } else if (percentage >= 40) {
    strokeColor = "#F97316" // orange for 40-79
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ width: size, height: size }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#EEF2F6"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[13px] font-semibold leading-none text-[#0F172A]">
            {Math.round(percentage)}%
          </span>
          <span className="text-[8px] text-[#64748B] leading-none mt-0.5 font-medium">Score</span>
        </div>
      </div>
    </div>
  )
}

