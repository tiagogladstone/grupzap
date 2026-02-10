import { describe, it, expect, vi } from 'vitest'
import {
  formatDate,
  timeAgo,
  slugify,
  truncate,
  formatCurrency,
} from '../utils'

describe('utils', () => {
  describe('formatDate', () => {
    it('formata Date object corretamente', () => {
      const date = new Date('2024-01-15T10:30:00')
      expect(formatDate(date)).toBe('15/01/2024')
    })

    it('formata string ISO corretamente', () => {
      expect(formatDate('2024-12-25T10:30:00')).toBe('25/12/2024')
    })

    it('formata diferentes datas corretamente', () => {
      expect(formatDate('2024-01-01T00:00:00')).toBe('01/01/2024')
      expect(formatDate('2024-06-15T12:00:00')).toBe('15/06/2024')
      expect(formatDate('2024-12-31T23:59:59')).toBe('31/12/2024')
    })
  })

  describe('timeAgo', () => {
    it('retorna "há menos de 1 minuto" para segundos', () => {
      const now = new Date()
      const recent = new Date(now.getTime() - 30 * 1000) // 30 segundos atrás
      expect(timeAgo(recent)).toBe('há menos de 1 minuto')
    })

    it('retorna minutos corretamente', () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      expect(timeAgo(fiveMinutesAgo)).toBe('há 5 minutos')

      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000)
      expect(timeAgo(oneMinuteAgo)).toBe('há 1 minuto')
    })

    it('retorna horas corretamente', () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      expect(timeAgo(twoHoursAgo)).toBe('há 2 horas')

      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000)
      expect(timeAgo(oneHourAgo)).toBe('há 1 hora')
    })

    it('retorna dias corretamente', () => {
      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      expect(timeAgo(threeDaysAgo)).toBe('há 3 dias')

      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      expect(timeAgo(oneDayAgo)).toBe('há 1 dia')
    })

    it('aceita string ISO', () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      expect(timeAgo(twoHoursAgo)).toBe('há 2 horas')
    })
  })

  describe('slugify', () => {
    it('converte para lowercase', () => {
      expect(slugify('HELLO WORLD')).toBe('hello-world')
      expect(slugify('MixedCase')).toBe('mixedcase')
    })

    it('substitui espaços por hifens', () => {
      expect(slugify('hello world')).toBe('hello-world')
      expect(slugify('multiple   spaces')).toBe('multiple-spaces')
    })

    it('remove acentos', () => {
      expect(slugify('São Paulo')).toBe('sao-paulo')
      expect(slugify('Ação Reação')).toBe('acao-reacao')
      expect(slugify('Café e Pão')).toBe('cafe-e-pao')
    })

    it('remove caracteres especiais', () => {
      expect(slugify('hello@world!')).toBe('helloworld')
      expect(slugify('test#123$')).toBe('test123')
      expect(slugify('a*b&c%d')).toBe('abcd')
    })

    it('remove hifens duplicados', () => {
      expect(slugify('hello---world')).toBe('hello-world')
      expect(slugify('test--case')).toBe('test-case')
    })

    it('combina todas as transformações', () => {
      expect(slugify('São Paulo - Brasil!')).toBe('sao-paulo-brasil')
      expect(slugify('Olá Mundo @2024')).toBe('ola-mundo-2024')
    })
  })

  describe('truncate', () => {
    it('não trunca texto menor que o limite', () => {
      expect(truncate('hello', 10)).toBe('hello')
      expect(truncate('test', 10)).toBe('test')
    })

    it('não trunca texto exatamente no limite', () => {
      expect(truncate('hello', 5)).toBe('hello')
    })

    it('trunca texto maior que o limite com "..."', () => {
      expect(truncate('hello world', 8)).toBe('hello...')
      expect(truncate('this is a long text', 10)).toBe('this is...')
    })

    it('considera os 3 caracteres do "..." no limite', () => {
      expect(truncate('abcdefghij', 6)).toBe('abc...')
    })

    it('funciona com textos muito longos', () => {
      const longText = 'a'.repeat(100)
      const truncated = truncate(longText, 20)
      expect(truncated.length).toBe(20)
      expect(truncated.endsWith('...')).toBe(true)
    })
  })

  describe('formatCurrency', () => {
    // Intl.NumberFormat pt-BR usa non-breaking space (\u00a0) entre R$ e valor
    const normalize = (s: string) => s.replace(/\u00a0/g, ' ')

    it('formata valores inteiros', () => {
      expect(normalize(formatCurrency(100))).toBe('R$ 100,00')
      expect(normalize(formatCurrency(1000))).toBe('R$ 1.000,00')
      expect(normalize(formatCurrency(10000))).toBe('R$ 10.000,00')
    })

    it('formata valores decimais', () => {
      expect(normalize(formatCurrency(99.99))).toBe('R$ 99,99')
      expect(normalize(formatCurrency(1234.56))).toBe('R$ 1.234,56')
    })

    it('formata zero', () => {
      expect(normalize(formatCurrency(0))).toBe('R$ 0,00')
    })

    it('formata valores negativos', () => {
      expect(normalize(formatCurrency(-50))).toBe('-R$ 50,00')
      expect(normalize(formatCurrency(-123.45))).toBe('-R$ 123,45')
    })

    it('formata valores grandes', () => {
      expect(normalize(formatCurrency(1000000))).toBe('R$ 1.000.000,00')
      expect(normalize(formatCurrency(123456789.12))).toBe('R$ 123.456.789,12')
    })
  })
})
