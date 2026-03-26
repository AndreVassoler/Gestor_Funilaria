export type OrdemServicoStatus = 'aberto' | 'fazendo' | 'pronto'

export interface OrdemServico {
  id: number
  cliente: string
  contato: string
  marca: string
  modelo: string
  ano: number
  placa: string
  descricao: string
  valor: number
  /** ISO; pode faltar em registros antigos */
  dataAbertura?: string
  /** ISO; preenchida ao concluir a OS (relatório fiscal) */
  dataConclusao?: string | null
  previsaoEntrega: string | null
  status: OrdemServicoStatus
}

export interface OrdemFotoItem {
  id: number
  tipo: 'antes' | 'depois'
  url: string
}

export interface DashboardResumo {
  abertas: number
  emAndamento: number
  prontas: number
  atrasadas: number
  /** Total de ordens (API recente); senão derive no cliente */
  totalOrdens?: number
  /** Soma dos valores das OS prontas */
  valorArrecadadoProntos?: number
  /** Soma dos valores em aberto + em andamento */
  valorEmAbertoEAndamento?: number
}
