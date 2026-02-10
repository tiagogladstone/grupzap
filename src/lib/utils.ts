/**
 * Formata uma data usando o formato brasileiro
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/**
 * Retorna uma string de tempo relativo (ex: "há 5 minutos")
 */
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'há menos de 1 minuto'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `há ${diffInMonths} ${diffInMonths === 1 ? 'mês' : 'meses'}`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `há ${diffInYears} ${diffInYears === 1 ? 'ano' : 'anos'}`
}

/**
 * Converte texto em slug (lowercase, sem acentos, com hifens)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hifens
    .replace(/--+/g, '-') // Remove hifens duplicados
    .trim()
}

/**
 * Trunca texto com "..." se exceder o tamanho máximo
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Formata número como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
