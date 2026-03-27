import type { AgendamentoStatus } from '../types/agendamento'

export const AGENDAMENTO_STATUS_LABEL: Record<AgendamentoStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  finalizado: 'Finalizado',
}

export const AGENDAMENTO_STATUS_RING: Record<AgendamentoStatus, string> = {
  agendado:
    'ring-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
  confirmado:
    'ring-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-100',
  cancelado: 'ring-slate-400/40 bg-slate-200/50 text-slate-700 dark:text-slate-300',
  finalizado:
    'ring-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
}
