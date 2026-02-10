export const PLANS = {
  free: {
    name: 'Free',
    max_instances: 1,
    max_groups: 10,
    max_messages_per_month: 50,
  },
  starter: {
    name: 'Starter',
    max_instances: 2,
    max_groups: 50,
    max_messages_per_month: 500,
  },
  pro: {
    name: 'Pro',
    max_instances: 5,
    max_groups: 200,
    max_messages_per_month: 2000,
  },
  enterprise: {
    name: 'Enterprise',
    max_instances: 20,
    max_groups: -1,
    max_messages_per_month: -1,
  },
} as const;

export type PlanType = keyof typeof PLANS;

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan];
}

export function isWithinLimit(current: number, max: number): boolean {
  return max === -1 || current < max;
}

export function getUsagePercentage(current: number, max: number): number {
  if (max === -1) return 0;
  return Math.round((current / max) * 100);
}

export function getUsageColor(percentage: number): string {
  if (percentage < 70) return 'green';
  if (percentage < 90) return 'yellow';
  return 'red';
}
