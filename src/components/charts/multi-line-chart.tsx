'use client'

import { useState } from 'react'

interface DataPoint {
  label: string
  values: number[]
}

interface LineConfig {
  color: string
  label: string
}

interface MultiLineChartProps {
  data: DataPoint[]
  lines: LineConfig[]
  height?: number
  showGrid?: boolean
}

export function MultiLineChart({ data, lines, height = 300, showGrid = true }: MultiLineChartProps) {
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

  const allValues = data.flatMap(d => d.values)
  const maxValue = Math.max(...allValues, 1)
  const minValue = Math.min(...allValues, 0)
  const valueRange = maxValue - minValue || 1

  const xStep = innerWidth / Math.max(data.length - 1, 1)
  const yScale = (value: number) => {
    return padding.top + innerHeight - ((value - minValue) / valueRange) * innerHeight
  }

  const gridLines = 5
  const yTicks = Array.from({ length: gridLines }, (_, i) => {
    const value = minValue + (valueRange / (gridLines - 1)) * i
    return {
      y: yScale(value),
      value: Math.round(value),
    }
  })

  const linesData = lines.map((line, lineIndex) => {
    const points = data.map((point, i) => ({
      x: padding.left + i * xStep,
      y: yScale(point.values[lineIndex] || 0),
      value: point.values[lineIndex] || 0,
      label: point.label,
    }))
    return {
      ...line,
      points,
      polylinePoints: points.map(p => `${p.x},${p.y}`).join(' '),
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

        {linesData.map((lineData, lineIndex) => (
          <g key={lineIndex}>
            <polyline
              points={lineData.polylinePoints}
              fill="none"
              stroke={lineData.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {lineData.points.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === i ? 6 : 4}
                fill={lineData.color}
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </g>
        ))}

        {hoveredIndex !== null && (
          <g>
            {linesData.map((lineData, lineIndex) => {
              const point = lineData.points[hoveredIndex]
              const yOffset = lineIndex * 18
              return (
                <text
                  key={lineIndex}
                  x={point.x + 10}
                  y={point.y - 10 - yOffset}
                  className="text-xs fill-gray-900 font-medium"
                >
                  {lineData.label}: {point.value}
                </text>
              )
            })}
          </g>
        )}

        {data.length <= 10 && data.map((point, i) => {
          const x = padding.left + i * xStep
          return (
            <text
              key={i}
              x={x}
              y={chartHeight - 10}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {point.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
