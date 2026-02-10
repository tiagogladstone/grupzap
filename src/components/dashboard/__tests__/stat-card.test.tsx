import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '../stat-card'

describe('StatCard', () => {
  it('renderiza título e valor', () => {
    render(<StatCard title="Total de Instâncias" value={5} />)

    expect(screen.getByText('Total de Instâncias')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renderiza valor como string', () => {
    render(<StatCard title="Status" value="Ativo" />)

    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('renderiza descrição quando fornecida', () => {
    render(
      <StatCard
        title="Mensagens"
        value={100}
        description="últimos 30 dias"
      />
    )

    expect(screen.getByText('últimos 30 dias')).toBeInTheDocument()
  })

  it('renderiza ícone quando fornecido', () => {
    const TestIcon = () => <svg data-testid="test-icon" />

    render(
      <StatCard
        title="Grupos"
        value={25}
        icon={<TestIcon />}
      />
    )

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('exibe trend positivo com cor verde', () => {
    render(
      <StatCard
        title="Crescimento"
        value={150}
        trend={{ value: 12, isPositive: true }}
      />
    )

    const trendElement = screen.getByText('12%')
    expect(trendElement).toBeInTheDocument()
    expect(trendElement.className).toContain('text-emerald-500')
  })

  it('exibe trend negativo com cor vermelha', () => {
    render(
      <StatCard
        title="Queda"
        value={80}
        trend={{ value: 8, isPositive: false }}
      />
    )

    const trendElement = screen.getByText('8%')
    expect(trendElement).toBeInTheDocument()
    expect(trendElement.className).toContain('text-red-500')
  })

  it('não mostra trend quando não fornecido', () => {
    render(<StatCard title="Total" value={100} />)

    expect(screen.queryByText(/%$/)).not.toBeInTheDocument()
  })

  it('exibe trend e description juntos', () => {
    render(
      <StatCard
        title="Mensagens"
        value={500}
        description="este mês"
        trend={{ value: 15, isPositive: true }}
      />
    )

    expect(screen.getByText('15%')).toBeInTheDocument()
    expect(screen.getByText('este mês')).toBeInTheDocument()
  })

  it('renderiza com todos os props', () => {
    const TestIcon = () => <svg data-testid="full-icon" />

    render(
      <StatCard
        title="Instâncias Ativas"
        value={10}
        description="todas conectadas"
        icon={<TestIcon />}
        trend={{ value: 20, isPositive: true }}
      />
    )

    expect(screen.getByText('Instâncias Ativas')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('todas conectadas')).toBeInTheDocument()
    expect(screen.getByTestId('full-icon')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('renderiza estrutura de card corretamente', () => {
    const { container } = render(
      <StatCard title="Test" value={42} />
    )

    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('bg-[var(--card)]')
    expect(card.className).toContain('border')
    expect(card.className).toContain('rounded-xl')
  })
})
