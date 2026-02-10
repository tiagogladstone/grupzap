'use client';

interface UpgradeBannerProps {
  resource: string;
  current: number;
  max: number;
}

export function UpgradeBanner({ resource, current, max }: UpgradeBannerProps) {
  const percentage = Math.round((current / max) * 100);

  if (percentage < 80) {
    return null;
  }

  return (
    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
            Atenção: Limite quase atingido
          </h3>
          <p className="text-sm text-yellow-600 dark:text-yellow-300">
            Você está usando {percentage}% {resource === 'instances' ? 'das suas instâncias' : resource === 'groups' ? 'dos seus grupos' : 'das suas mensagens'}.
            Faça upgrade para continuar sem interrupções.
          </p>
        </div>
        <div>
          <a
            href="/settings/billing"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Fazer Upgrade
          </a>
        </div>
      </div>
    </div>
  );
}
