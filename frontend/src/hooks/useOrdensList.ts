import { useCallback, useEffect, useState } from 'react'
import type {
  DashboardResumo,
  OrdemServico,
  OrdemServicoStatus,
} from '../types/ordem'

export type OrdensListFilters = {
  cliente: string
  placa: string
  /** string vazio = todos os status (relatórios) */
  status: '' | OrdemServicoStatus
}

export function useOrdensList(apiBase: string, filters: OrdensListFilters) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resumo, setResumo] = useState<DashboardResumo | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const q = new URLSearchParams()
      if (filters.cliente.trim()) q.set('cliente', filters.cliente.trim())
      if (filters.placa.trim()) q.set('placa', filters.placa.trim())
      if (filters.status) q.set('status', filters.status)
      const qs = q.toString()
      const url = `${apiBase}/ordens-servico${qs ? `?${qs}` : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Falha ao carregar ordens')
      const data: OrdemServico[] = await res.json()
      setOrdens(data)
      const r2 = await fetch(
        `${apiBase}/ordens-servico/resumo${qs ? `?${qs}` : ''}`,
      )
      if (!r2.ok) throw new Error('Falha ao carregar resumo do dashboard')
      setResumo((await r2.json()) as DashboardResumo)
    } catch (e) {
      setResumo(null)
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [apiBase, filters.cliente, filters.placa, filters.status])

  useEffect(() => {
    void load()
  }, [load])

  return {
    ordens,
    setOrdens,
    loading,
    error,
    setError,
    resumo,
    load,
  }
}
