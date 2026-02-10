interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: { value: number; isPositive: boolean }
}

export function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[var(--muted)]">{title}</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{value}</p>
        </div>

        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
            {icon}
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="flex items-center gap-2 mt-3">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                trend.isPositive ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {trend.isPositive ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                </svg>
              )}
              {trend.value}%
            </span>
          )}

          {description && (
            <span className="text-xs text-[var(--muted-foreground)]">{description}</span>
          )}
        </div>
      )}
    </div>
  )
}
