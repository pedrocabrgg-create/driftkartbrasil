import { toZonedTime, fromZonedTime, format as tzFormat } from 'date-fns-tz'
import { format, parseISO, addMinutes, isBefore, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const TZ = 'America/Sao_Paulo'

/** Converte um Date UTC para o horário de São Paulo */
export function toBrTime(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date
  return toZonedTime(d, TZ)
}

/** Converte um Date local de SP para UTC (para salvar no banco) */
export function fromBrTime(date: Date): Date {
  return fromZonedTime(date, TZ)
}

/** Formata uma data em SP com o formato desejado */
export function formatBr(date: Date | string, fmt: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return tzFormat(d, fmt, { timeZone: TZ, locale: ptBR })
}

/** Formata data no padrão PT-BR: "dd/MM/yyyy" */
export function formatDateBr(date: Date | string): string {
  return formatBr(date, "dd/MM/yyyy")
}

/** Formata hora no padrão PT-BR: "HH:mm" */
export function formatTimeBr(date: Date | string): string {
  return formatBr(date, 'HH:mm')
}

/** Formata data e hora juntas: "dd/MM/yyyy 'às' HH:mm" */
export function formatDateTimeBr(date: Date | string): string {
  return formatBr(date, "dd/MM/yyyy 'às' HH:mm")
}

/** Formata moeda em centavos para BRL */
export function formatCentsToBrl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

/** Calcula fim de sessão: inicio + duração em minutos */
export function calcFimAt(inicioAt: Date, duracaoMin: number): Date {
  return addMinutes(inicioAt, duracaoMin)
}

export { format, parseISO, addMinutes, isBefore, isAfter }
