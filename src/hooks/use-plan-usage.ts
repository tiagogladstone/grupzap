'use client';

import { useEffect, useState } from 'react';
import type { PlanType } from '@/lib/plans';

interface PlanUsageData {
  plan: PlanType;
  limits: {
    name: string;
    max_instances: number;
    max_groups: number;
    max_messages_per_month: number;
  };
  usage: {
    instances: number;
    groups: number;
    messages_this_month: number;
  };
}

interface UsePlanUsageReturn {
  data: PlanUsageData | null;
  loading: boolean;
  error: string | null;
}

export function usePlanUsage(): UsePlanUsageReturn {
  const [data, setData] = useState<PlanUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/billing/usage');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || 'Erro ao buscar uso do plano');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  return { data, loading, error };
}
