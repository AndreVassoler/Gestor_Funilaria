/** Início da semana (domingo), hora local. */
export function inicioSemanaDomingo(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay()
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

export function fimSemanaSabado(d: Date): Date {
  const s = inicioSemanaDomingo(d)
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  e.setHours(23, 59, 59, 999)
  return e
}

export function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

export function labelDiaCurto(d: Date): string {
  return `${dias[d.getDay()]} ${d.getDate()}`
}
