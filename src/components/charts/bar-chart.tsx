'use client'

import { useState } from 'react'

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: DataPoint[]
  height?: number
  defaultColor?: string
}

export function BarChart({ data, height = 300, defaultColor = '#25D366' }: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-400 text-sm">Sem dados para exibir</p>
      </div>
    )
  }

  const padding = { top: 20, right: 20, bottom: 60, left: 50 }
  const chartWidth = 800
  const chartHeight = height
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const barWidth = innerWidth / data.length * 0.7
  const barGap = innerWidth / data.length * 0.3

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-full"
        style={{ maxHeight: height }}
      >
        {data.map((point, i) => {
          const barHeight = (point.value / maxValue) * innerHeight
          const x = padding.left + i * (barWidth + barGap) + barGap / 2
          const y = padding.top + innerHeight - barHeight
          const color = point.color || defaultColor
          const isHovered = hoveredIndex === i

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                opacity={isHovered ? 1 : 0.8}
                className="transition-opacity cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                rx="4"
              />
              {isHovered && (
                <g>
                  <rect
                    x={x + barWidth / 2 - 30}
                    y={y - 30}
                    width="60"
                    height="24"
                    fill="white"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 12}
                    textAnchor="middle"
                    className="text-xs fill-gray-900 font-medium"
                  >
                    {point.value}
                  </text>
                </g>
              )}
              <text
                x={x + barWidth / 2}
                y={chartHeight - 35}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {point.label}
              </text>
            </g>
          )
        })}

        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={chartWidth - padding.right}
          y2={padding.top + innerHeight}
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        {[0, 25, 50, 75, 100].map((percent) => {
          const value = Math.round((maxValue * percent) / 100)
          const y = padding.top + innerHeight - (innerHeight * percent) / 100
          return (
            <g key={percent}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
