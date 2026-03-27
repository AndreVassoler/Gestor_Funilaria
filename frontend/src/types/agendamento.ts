export type AgendamentoStatus =
  | 'agendado'
  | 'confirmado'
  | 'cancelado'
  | 'finalizado'

export interface Agendamento {
  id: number
  cliente: string
  contato: string
  placa: string
  marca: string
  modelo: string
  ano: number | null
  dia: string
  observacoes: string
  status: AgendamentoStatus
  ordemId: number | null
  googleEventId?: string | null
}

/** Estado enviado para /nova ao abrir OS a partir da agenda */
export type PrefillAgendamentoParaOrdem = {
  agendamentoId: number
  cliente: string
  contato: string
  placa: string
  marca: string
  modelo: string
  ano: number | null
  observacoes: string
}
