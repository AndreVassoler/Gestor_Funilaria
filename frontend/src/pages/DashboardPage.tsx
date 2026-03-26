import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EditOrdemModal } from '../components/EditOrdemModal'
import { OrdensFotosSection } from '../components/OrdensFotosSection'
import { API_BASE } from '../config/api'
import {
  inputClass,
  STATUS_LABEL,
  STATUS_NEXT,
  STATUS_RING,
} from '../constants/ordemUi'
import { useOrdensList } from '../hooks/useOrdensList'
import type { OrdemServico, OrdemServicoStatus } from '../types/ordem'
import { downloadPdfFromUrl } from '../utils/pdfDownload'
import * as F from '../utils/ordemForm'
import { sortOrdensPainelTodos } from '../utils/ordensPainelSort'

type PainelTab = 'todos' | OrdemServicoStatus

const TAB_LIST: { key: PainelTab; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'aberto', label: 'Aberto' },
  { key: 'fazendo', label: 'Em andamento' },
  { key: 'pronto', label: 'Pronto' },
]

function painelTabFromSearch(v: string | null): PainelTab {
  if (v === 'aberto' || v === 'fazendo' || v === 'pronto' || v === 'todos')
    return v
  return 'todos'
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const painelTab = painelTabFromSearch(searchParams.get('status'))

  const [filtCliente, setFiltCliente] = useState('')
  const [filtPlaca, setFiltPlaca] = useState('')
  const [editando, setEditando] = useState<OrdemServico | null>(null)

  const filters = useMemo(
    () => ({
      cliente: filtCliente,
      placa: filtPlaca,
      status: painelTab === 'todos' ? ('' as const) : painelTab,
    }),
    [filtCliente, filtPlaca, painelTab],
  )

  const { ordens, setOrdens, loading, error, setError, resumo, load } =
    useOrdensList(API_BASE, filters)

  const ordensExibidas = useMemo(() => {
    if (painelTab === 'todos') return sortOrdensPainelTodos(ordens)
    return ordens
  }, [ordens, painelTab])

  function setTab(tab: PainelTab) {
    setSearchParams({ status: tab }, { replace: true })
  }

  async function avancarStatus(o: OrdemServico) {
    const next = STATUS_NEXT[o.status]
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/ordens-servico/${o.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar status')
      const updated: OrdemServico = await res.json()
      setOrdens((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar')
    }
  }

  async function excluir(id: number) {
    if (!confirm('Excluir esta ordem de serviço?')) return
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/ordens-servico/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Falha ao excluir')
      setOrdens((prev) => prev.filter((x) => x.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  function limparFiltros() {
    setFiltCliente('')
    setFiltPlaca('')
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </div>
      )}

      {resumo && (
        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
              Abertas
            </p>
            <p className="text-3xl font-bold text-amber-950 dark:text-amber-100">
              {resumo.abertas}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50/90 p-4 dark:border-sky-900/40 dark:bg-sky-950/30">
            <p className="text-xs font-medium text-sky-800 dark:text-sky-200">
              Em andamento
            </p>
            <p className="text-3xl font-bold text-sky-950 dark:text-sky-100">
              {resumo.emAndamento}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
              Prontas
            </p>
            <p className="text-3xl font-bold text-emerald-950 dark:text-emerald-100">
              {resumo.prontas}
            </p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 dark:border-red-900/40 dark:bg-red-950/30">
            <p className="text-xs font-medium text-red-800 dark:text-red-200">
              Atrasadas
            </p>
            <p className="text-xs text-red-700/80 dark:text-red-300/90">
              Previsão &lt; hoje e não “pronto”
            </p>
            <p className="text-3xl font-bold text-red-950 dark:text-red-100">
              {resumo.atrasadas}
            </p>
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Ordens</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {painelTab === 'todos' ? (
                <>
                  Com a aba Todos: em andamento primeiro, aberto em seguida,
                  pronto por último; em cada grupo, previsão mais próxima
                  primeiro, sem previsão por último, depois ID mais recente.
                </>
              ) : (
                <>
                  Ordenação: previsão de entrega mais próxima primeiro; sem
                  previsão por último; depois ID mais recente.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Atualizar lista
          </button>
        </div>

        <div
          className="mb-6 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/50"
          role="tablist"
          aria-label="Status da ordem"
        >
          {TAB_LIST.map(({ key, label }) => {
            const active = painelTab === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={[
                  'flex-1 min-w-28 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:flex-none',
                  active
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Filtrar por cliente
            </span>
            <input
              className={inputClass}
              value={filtCliente}
              onChange={(e) => setFiltCliente(e.target.value)}
              placeholder="Nome (contém)"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Filtrar por placa
            </span>
            <input
              className={`${inputClass} font-mono uppercase`}
              value={filtPlaca}
              onChange={(e) =>
                setFiltPlaca(F.formatPlaca(e.target.value))
              }
              maxLength={8}
              title="Antigo ou Mercosul; o hífen é só visual — a busca ignora caracteres especiais."
              placeholder="ABC-1234 ou ABC-1D23"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={limparFiltros}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Limpar filtros de texto
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500">Carregando…</p>
        ) : ordensExibidas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 py-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/30">
            {filtCliente || filtPlaca
              ? painelTab === 'todos'
                ? 'Nenhuma ordem encontrada com os filtros atuais.'
                : 'Nenhuma ordem encontrada com os filtros atuais neste status.'
              : painelTab === 'todos'
                ? 'Nenhuma ordem ainda.'
                : `Nenhuma ordem com status “${STATUS_LABEL[painelTab]}”.`}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ordensExibidas.map((o) => (
              <li
                key={o.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      ID #{o.id}
                    </p>
                    <p className="text-lg font-semibold">{o.cliente}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {F.formatContato(o.contato)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_RING[o.status]}`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>
                <dl className="mb-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Abertura</dt>
                    <dd className="font-medium">
                      {F.formatDateBR(o.dataAbertura)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Previsão</dt>
                    <dd
                      className={`font-medium ${o.previsaoEntrega ? '' : 'text-slate-400'}`}
                    >
                      {F.formatDateBR(o.previsaoEntrega)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Marca</dt>
                    <dd className="text-right font-medium">{o.marca}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Modelo</dt>
                    <dd className="text-right font-medium">{o.modelo}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Ano</dt>
                    <dd className="font-medium">{o.ano}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Placa</dt>
                    <dd className="font-mono font-medium">
                      {F.formatPlacaStored(o.placa)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Valor</dt>
                    <dd className="font-semibold">{F.formatMoney(o.valor)}</dd>
                  </div>
                </dl>
                <p className="mb-4 flex-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  {o.descricao}
                </p>
                <div className="mb-4">
                  <OrdensFotosSection
                    ordemId={o.id}
                    apiBase={API_BASE}
                    onChange={() => void load()}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null)
                      void downloadPdfFromUrl(
                        `${API_BASE}/ordens-servico/${o.id}/pdf`,
                        `os-${o.id}-assinatura.pdf`,
                      ).catch((e) =>
                        setError(
                          e instanceof Error ? e.message : 'Erro no PDF',
                        ),
                      )
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    PDF assinatura
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null)
                      setEditando(o)
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void avancarStatus(o)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    Avançar: {STATUS_LABEL[STATUS_NEXT[o.status]]}
                  </button>
                  <button
                    type="button"
                    onClick={() => void excluir(o.id)}
                    className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editando && (
        <EditOrdemModal
          ordem={editando}
          apiBase={API_BASE}
          onClose={() => setEditando(null)}
          onSaved={() => {
            void load()
          }}
          onFotosChange={() => void load()}
          onError={(msg) => setError(msg || null)}
        />
      )}
    </main>
  )
}
