import type { OrdemServico } from '../types/ordem'
import { formatDateBR } from './ordemForm'

export type PresetPeriodoRelatorio =
  | 'todas'
  | 'mes_atual'
  | 'ultimos_3'
  | 'ultimos_6'
  | 'ultimos_12'
  | 'ano_corrente'
  | 'personalizado'

function parseDataAbertura(o: OrdemServico): Date | null {
  if (!o.dataAbertura) return null
  const d = new Date(o.dataAbertura)
  return Number.isNaN(d.getTime()) ? null : d
}

function inicioDoDia(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function fimDoDia(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** Data local a partir de YYYY-MM-DD (inputs type="date"). */
export function parseInputDateLocal(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 12, 0, 0)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export function intervaloPreset(
  preset: PresetPeriodoRelatorio,
  personalizadoDe?: string,
  personalizadoAte?: string,
): { inicio: Date; fim: Date } | null {
  const agora = new Date()
  if (preset === 'todas') return null

  if (preset === 'personalizado') {
    const di = personalizadoDe ? parseInputDateLocal(personalizadoDe) : null
    const df = personalizadoAte ? parseInputDateLocal(personalizadoAte) : null
    if (!di || !df) return null
    const a = inicioDoDia(di)
    const b = fimDoDia(df)
    if (a > b) return { inicio: inicioDoDia(df), fim: fimDoDia(di) }
    return { inicio: a, fim: b }
  }

  const fim = fimDoDia(agora)
  const inicio = new Date(agora)

  if (preset === 'mes_atual') {
    inicio.setDate(1)
    inicio.setHours(0, 0, 0, 0)
    return { inicio, fim }
  }
  if (preset === 'ultimos_3') {
    inicio.setMonth(inicio.getMonth() - 3)
    return { inicio: inicioDoDia(inicio), fim }
  }
  if (preset === 'ultimos_6') {
    inicio.setMonth(inicio.getMonth() - 6)
    return { inicio: inicioDoDia(inicio), fim }
  }
  if (preset === 'ultimos_12') {
    inicio.setMonth(inicio.getMonth() - 12)
    return { inicio: inicioDoDia(inicio), fim }
  }
  if (preset === 'ano_corrente') {
    const y = agora.getFullYear()
    return {
      inicio: new Date(y, 0, 1, 0, 0, 0, 0),
      fim: new Date(y, 11, 31, 23, 59, 59, 999),
    }
  }
  return null
}

export function filtrarOrdensPorAbertura(
  ordens: OrdemServico[],
  preset: PresetPeriodoRelatorio,
  personalizadoDe?: string,
  personalizadoAte?: string,
): OrdemServico[] {
  if (preset === 'todas') return ordens
  const iv = intervaloPreset(preset, personalizadoDe, personalizadoAte)
  if (!iv) {
    if (preset === 'personalizado') return []
    return ordens
  }
  const { inicio, fim } = iv
  return ordens.filter((o) => {
    const d = parseDataAbertura(o)
    if (!d) return false
    const t = d.getTime()
    return t >= inicio.getTime() && t <= fim.getTime()
  })
}

export function labelPeriodoAmigavel(
  preset: PresetPeriodoRelatorio,
  personalizadoDe?: string,
  personalizadoAte?: string,
): string {
  switch (preset) {
    case 'todas':
      return 'Todas as datas de abertura'
    case 'mes_atual':
      return 'Mês corrente (abertura)'
    case 'ultimos_3':
      return 'Últimos 3 meses (abertura)'
    case 'ultimos_6':
      return 'Últimos 6 meses (abertura)'
    case 'ultimos_12':
      return 'Últimos 12 meses (abertura)'
    case 'ano_corrente':
      return 'Ano calendário corrente (abertura)'
    case 'personalizado':
      return personalizadoDe && personalizadoAte
        ? `De ${formatDateBR(personalizadoDe)} a ${formatDateBR(personalizadoAte)} (abertura)`
        : 'Período personalizado (defina início e fim)'
    default:
      return ''
  }
}
