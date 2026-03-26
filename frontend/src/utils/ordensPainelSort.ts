import type { OrdemServico, OrdemServicoStatus } from '../types/ordem'

/** Na visão “Todos”: em andamento primeiro, aberto no meio, pronto por último. */
const STATUS_RANK_TODOS: Record<OrdemServicoStatus, number> = {
  fazendo: 0,
  aberto: 1,
  pronto: 2,
}

function previsaoSortKey(o: OrdemServico): number {
  const p = o.previsaoEntrega
  if (p == null || String(p).trim() === '') return Number.MAX_SAFE_INTEGER
  const t = new Date(p).getTime()
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t
}

/**
 * Ordenação do painel quando o filtro é “Todos”, alinhada ao backend dentro de cada status:
 * previsão mais próxima primeiro; sem previsão por último; depois ID mais recente.
 */
export function sortOrdensPainelTodos(ordens: OrdemServico[]): OrdemServico[] {
  return [...ordens].sort((a, b) => {
    const ra = STATUS_RANK_TODOS[a.status]
    const rb = STATUS_RANK_TODOS[b.status]
    if (ra !== rb) return ra - rb
    const ka = previsaoSortKey(a)
    const kb = previsaoSortKey(b)
    if (ka !== kb) return ka - kb
    return b.id - a.id
  })
}
