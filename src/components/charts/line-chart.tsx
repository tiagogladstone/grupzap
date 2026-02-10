'use client'

import { useState } from 'react'

interface DataPoint {
  label: string
  value: number
}

interface LineChartProps {
  data: DataPoint[]
  color?: string
  height?: number
  showGrid?: boolean
}

export function LineChart({ data, color = '#25D366', height = 300, showGrid = true }: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-400 text-sm">Sem dados para exibir</p>
      </div>
    )
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = 800
  const chartHeight = height
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const minValue = Math.min(...data.map(d => d.value), 0)
  const valueRange = maxValue - minValue || 1

  const xStep = innerWidth / Math.max(data.length - 1, 1)
  const yScale = (value: number) => {
    return padding.top + innerHeight - ((value - minValue) / valueRange) * innerHeight
  }

  const points = data.map((point, i) => ({
    x: padding.left + i * xStep,
    y: yScale(point.value),
    value: point.value,
    label: point.label,
  }))

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ')

  const gridLines = 5
  const yTicks = Array.from({ length: gridLines }, (_, i) => {
    const value = minValue + (valueRange / (gridLines - 1)) * i
    return {
      y: yScale(value),
      value: Math.round(value),
    }
  })

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-full"
        style={{ maxHeight: height }}
      >
        {showGrid && yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={chartWidth - padding.right}
              y2={tick.y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {tick.value}
            </text>
          </g>
        ))}

        <polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === i ? 6 : 4}
              fill={color}
              className="transition-all cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            {hoveredIndex === i && (
              <g>
                <rect
                  x={point.x - 40}
                  y={point.y - 40}
                  width="80"
                  height="30"
                  fill="white"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x={point.x}
                  y={point.y - 28}
                  textAnchor="middle"
                  className="text-xs fill-gray-900 font-medium"
                >
                  {point.value}
                </text>
                <text
                  x={point.x}
                  y={point.y - 16}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {point.label}
                </text>
              </g>
            )}
          </g>
        ))}

        {data.length <= 10 && data.map((point, i) => (
          <text
            key={i}
            x={points[i].x}
            y={chartHeight - 10}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
