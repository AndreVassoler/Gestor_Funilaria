import type { OrdemServicoStatus } from '../types/ordem'

export function hojeInputDate() {
  return new Date().toISOString().slice(0, 10)
}

export const STATUS_LABEL: Record<OrdemServicoStatus, string> = {
  aberto: 'Aberto',
  fazendo: 'Em andamento',
  pronto: 'Pronto',
}

export const STATUS_NEXT: Record<OrdemServicoStatus, OrdemServicoStatus> = {
  aberto: 'fazendo',
  fazendo: 'pronto',
  pronto: 'aberto',
}

export const STATUS_RING: Record<OrdemServicoStatus, string> = {
  aberto: 'ring-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
  fazendo:
    'ring-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-100',
  pronto:
    'ring-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
}

export const inputClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none ring-slate-400/30 focus:ring-2 dark:border-slate-700 dark:bg-slate-950'
