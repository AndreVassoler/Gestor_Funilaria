export function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function onlyDigits(s: string) {
  return s.replace(/\D/g, '')
}

export function formatContato(value: string) {
  let d = onlyDigits(value)
  if (d.startsWith('55') && d.length > 11) d = d.slice(2)
  d = d.slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function placaAlnum(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function buildPlacaStrict(cleaned: string): string {
  const normalized = cleaned.toUpperCase().replace(/[^A-Z0-9]/g, '')

  if (normalized.length >= 7) {
    const head = normalized.slice(0, 7)
    if (/^[A-Z]{3}\d{4}$/.test(head)) return head
    if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(head)) return head
  }

  const out: string[] = []
  for (let i = 0; i < normalized.length && out.length < 7; i++) {
    const c = normalized[i]
    const p = out.length

    if (p < 3) {
      if (/[A-Z]/.test(c)) out.push(c)
      continue
    }
    if (p === 3) {
      if (/[0-9]/.test(c)) out.push(c)
      continue
    }
    if (p === 4) {
      if (/[0-9]/.test(c)) out.push(c)
      else if (/[A-Z]/.test(c)) out.push(c)
      continue
    }
    if (p === 5 || p === 6) {
      if (/[0-9]/.test(c)) out.push(c)
    }
  }
  return out.join('')
}

export function formatPlaca(value: string) {
  const built = buildPlacaStrict(placaAlnum(value))
  if (built.length <= 3) return built
  return `${built.slice(0, 3)}-${built.slice(3)}`
}

export function formatPlacaStored(stored: string) {
  const raw = placaAlnum(stored)
  if (raw.length <= 3) return raw
  if (raw.length === 7 && /^[A-Z]{3}\d{4}$/.test(raw))
    return `${raw.slice(0, 3)}-${raw.slice(3)}`
  if (raw.length === 7 && /^[A-Z]{3}\d[A-Z]\d{2}$/.test(raw))
    return `${raw.slice(0, 3)}-${raw.slice(3)}`
  return raw.length > 3 ? `${raw.slice(0, 3)}-${raw.slice(3)}` : raw
}

export function formatAno(value: string) {
  return onlyDigits(value).slice(0, 4)
}

export function formatValorCentavosDigits(centavosDigits: string) {
  const d = centavosDigits.replace(/\D/g, '')
  if (!d) return ''
  const cents = parseInt(d, 10)
  if (Number.isNaN(cents)) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function parseValorCentavosToNumber(centavosDigits: string): number {
  const d = centavosDigits.replace(/\D/g, '')
  if (!d) return NaN
  return parseInt(d, 10) / 100
}

export function valorNumberToCentavosDigits(n: number): string {
  return String(Math.round(n * 100))
}

export function titleCaseWords(s: string) {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** YYYY-MM-DD para input type="date" (data local quando há horário na ISO). */
export function toInputDate(iso?: string | null) {
  if (!iso) return ''
  const s = String(iso).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const rest = s.slice(10)
  if (
    rest === '' ||
    /^T00:00:00(\.\d+)?Z$/i.test(rest) ||
    /^T00:00:00(\.\d+)?\+00:00$/i.test(rest)
  ) {
    return s.slice(0, 10)
  }
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Exibe data como dd/mm/aaaa. Datas só-dia vindas da API (meia-noite UTC)
 * usam o calendário YYYY-MM-DD da string, evitando dia errado no fuso BR.
 */
export function formatDateBR(iso?: string | null) {
  if (!iso) return '—'
  const s = String(iso).trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (!m) {
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return '—'
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  }
  const [, y, mo, d] = m
  const rest = s.slice(10)
  const isDateOnly = s.length === 10
  const isUtcMidnight =
    rest === '' ||
    /^T00:00:00(\.\d+)?Z$/i.test(rest) ||
    /^T00:00:00(\.\d+)?\+00:00$/i.test(rest)
  if (isDateOnly || isUtcMidnight) {
    return `${d}/${mo}/${y}`
  }
  const dt = new Date(s)
  if (Number.isNaN(dt.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dt)
}

export function validarPlacaOuErro(placaDisplay: string): string | null {
  const placaLimpa = buildPlacaStrict(placaAlnum(placaDisplay))
  const placaAntigo = /^[A-Z]{3}\d{4}$/.test(placaLimpa)
  const placaMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/.test(placaLimpa)
  if (placaLimpa.length !== 7 || (!placaAntigo && !placaMercosul)) {
    return 'Placa inválida: modelo antigo (ex.: ABC-1234) ou Mercosul (ex.: ABC-1D23).'
  }
  return null
}
