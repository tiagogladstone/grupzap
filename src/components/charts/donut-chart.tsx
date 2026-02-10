'use client'

interface DataPoint {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DataPoint[]
  size?: number
}

export function DonutChart({ data, size = 200 }: DonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: size }}>
        <p className="text-gray-400 text-sm">Sem dados para exibir</p>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const centerX = size / 2
  const centerY = size / 2
  const radius = size / 2 - 10
  const innerRadius = radius * 0.6
  const strokeWidth = radius - innerRadius

  let cumulativePercent = 0
  const arcs = data.map(item => {
    const percent = (item.value / total) * 100
    const startAngle = (cumulativePercent / 100) * 2 * Math.PI - Math.PI / 2
    const endAngle = ((cumulativePercent + percent) / 100) * 2 * Math.PI - Math.PI / 2
    cumulativePercent += percent

    const startX = centerX + (radius - strokeWidth / 2) * Math.cos(startAngle)
    const startY = centerY + (radius - strokeWidth / 2) * Math.sin(startAngle)
    const endX = centerX + (radius - strokeWidth / 2) * Math.cos(endAngle)
    const endY = centerY + (radius - strokeWidth / 2) * Math.sin(endAngle)

    const largeArcFlag = percent > 50 ? 1 : 0

    return {
      path: `M ${startX},${startY} A ${radius - strokeWidth / 2},${radius - strokeWidth / 2} 0 ${largeArcFlag} 1 ${endX},${endY}`,
      color: item.color,
      label: item.label,
      value: item.value,
      percent: percent.toFixed(1),
    }
  })

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((arc, i) => (
            <path
              key={i}
              d={arc.path}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: arc.color }}
              />
              <span className="text-sm text-gray-700">{arc.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{arc.value}</span>
              <span className="text-xs text-gray-500">({arc.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
