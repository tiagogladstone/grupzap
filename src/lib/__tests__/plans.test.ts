import { describe, it, expect } from 'vitest'
import {
  PLANS,
  getPlanLimits,
  isWithinLimit,
  getUsagePercentage,
  getUsageColor,
  type PlanType,
} from '../plans'

describe('plans', () => {
  describe('getPlanLimits', () => {
    it('retorna limites corretos para plano free', () => {
      const limits = getPlanLimits('free')
      expect(limits).toEqual({
        name: 'Free',
        max_instances: 1,
        max_groups: 10,
        max_messages_per_month: 50,
      })
    })

    it('retorna limites corretos para plano starter', () => {
      const limits = getPlanLimits('starter')
      expect(limits).toEqual({
        name: 'Starter',
        max_instances: 2,
        max_groups: 50,
        max_messages_per_month: 500,
      })
    })

    it('retorna limites corretos para plano pro', () => {
      const limits = getPlanLimits('pro')
      expect(limits).toEqual({
        name: 'Pro',
        max_instances: 5,
        max_groups: 200,
        max_messages_per_month: 2000,
      })
    })

    it('retorna limites corretos para plano enterprise', () => {
      const limits = getPlanLimits('enterprise')
      expect(limits).toEqual({
        name: 'Enterprise',
        max_instances: 20,
        max_groups: -1,
        max_messages_per_month: -1,
      })
    })
  })

  describe('isWithinLimit', () => {
    it('retorna true quando dentro do limite', () => {
      expect(isWithinLimit(5, 10)).toBe(true)
      expect(isWithinLimit(0, 10)).toBe(true)
      expect(isWithinLimit(9, 10)).toBe(true)
    })

    it('retorna false quando no limite', () => {
      expect(isWithinLimit(10, 10)).toBe(false)
    })

    it('retorna false quando acima do limite', () => {
      expect(isWithinLimit(11, 10)).toBe(false)
      expect(isWithinLimit(100, 10)).toBe(false)
    })

    it('retorna true para limite ilimitado (-1)', () => {
      expect(isWithinLimit(0, -1)).toBe(true)
      expect(isWithinLimit(100, -1)).toBe(true)
      expect(isWithinLimit(999999, -1)).toBe(true)
    })
  })

  describe('getUsagePercentage', () => {
    it('calcula porcentagem corretamente', () => {
      expect(getUsagePercentage(50, 100)).toBe(50)
      expect(getUsagePercentage(25, 100)).toBe(25)
      expect(getUsagePercentage(75, 100)).toBe(75)
    })

    it('arredonda valores decimais', () => {
      expect(getUsagePercentage(33, 100)).toBe(33)
      expect(getUsagePercentage(66, 100)).toBe(66)
    })

    it('retorna 100 quando no limite', () => {
      expect(getUsagePercentage(100, 100)).toBe(100)
    })

    it('retorna acima de 100 quando excede limite', () => {
      expect(getUsagePercentage(150, 100)).toBe(150)
    })

    it('retorna 0 para limite ilimitado (-1)', () => {
      expect(getUsagePercentage(0, -1)).toBe(0)
      expect(getUsagePercentage(100, -1)).toBe(0)
      expect(getUsagePercentage(999999, -1)).toBe(0)
    })
  })

  describe('getUsageColor', () => {
    it('retorna verde quando abaixo de 70%', () => {
      expect(getUsageColor(0)).toBe('green')
      expect(getUsageColor(50)).toBe('green')
      expect(getUsageColor(69)).toBe('green')
    })

    it('retorna amarelo quando entre 70% e 89%', () => {
      expect(getUsageColor(70)).toBe('yellow')
      expect(getUsageColor(80)).toBe('yellow')
      expect(getUsageColor(89)).toBe('yellow')
    })

    it('retorna vermelho quando 90% ou mais', () => {
      expect(getUsageColor(90)).toBe('red')
      expect(getUsageColor(95)).toBe('red')
      expect(getUsageColor(100)).toBe('red')
      expect(getUsageColor(150)).toBe('red')
    })
  })
})
