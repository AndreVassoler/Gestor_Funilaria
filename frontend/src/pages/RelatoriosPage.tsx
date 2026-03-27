import { useMemo, useState } from 'react'
import { RelatoriosAnaliseDetalhada } from '../components/RelatoriosAnaliseDetalhada'
import { RelatoriosDashboard } from '../components/RelatoriosDashboard'
import { API_BASE } from '../config/api'
import { inputClass, STATUS_LABEL } from '../constants/ordemUi'
import { useOrdensList } from '../hooks/useOrdensList'
import type { OrdemServicoStatus } from '../types/ordem'
import {
  downloadAttachmentFromUrl,
  downloadPdfFromUrl,
} from '../utils/pdfDownload'

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
] as const

type ExportInFlight =
  | null
  | 'fiscal'
  | 'pdf-tela'
  | 'pdf-todos'
  | 'pdf-status'

export function RelatoriosPage() {
  const [filtCliente, setFiltCliente] = useState('')
  const [filtPlaca, setFiltPlaca] = useState('')
  const [filtStatus, setFiltStatus] = useState<'' | OrdemServicoStatus>('')

  const [exportPdfStatus, setExportPdfStatus] =
    useState<OrdemServicoStatus>('aberto')

  const [fiscalEscopo, setFiscalEscopo] = useState<'geral' | 'ano' | 'mes'>(
    'mes',
  )
  const [fiscalAno, setFiscalAno] = useState(() =>
    new Date().getFullYear(),
  )
  const [fiscalMes, setFiscalMes] = useState(
    () => new Date().getMonth() + 1,
  )
  const [fiscalFormato, setFiscalFormato] = useState<'pdf' | 'xlsx'>('pdf')
  const [exportInFlight, setExportInFlight] = useState<ExportInFlight>(null)
  const exportBusy = exportInFlight !== null

  const anosSelect = useMemo(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 16 }, (_, i) => y - i)
  }, [])

  const filters = useMemo(
    () => ({
      cliente: filtCliente,
      placa: filtPlaca,
      status: filtStatus,
    }),
    [filtCliente, filtPlaca, filtStatus],
  )

  const filtrosAtivos =
    filtCliente.trim() !== '' || filtPlaca.trim() !== '' || filtStatus !== ''

  const { ordens, error, setError, resumo, load, loading } = useOrdensList(
    API_BASE,
    filters,
  )

  function buildExportPdfQuery(mode: 'todos' | 'status' | 'tela'): string {
    const q = new URLSearchParams()
    if (mode === 'status') q.set('status', exportPdfStatus)
    if (mode === 'tela' && ordens.length)
      q.set('ids', ordens.map((o) => o.id).join(','))
    return q.toString()
  }

  async function handleDownloadPdf(
    mode: 'todos' | 'status' | 'tela',
    fallbackName: string,
  ) {
    const key: ExportInFlight =
      mode === 'tela' ? 'pdf-tela' : mode === 'todos' ? 'pdf-todos' : 'pdf-status'
    if (exportBusy) return
    setExportInFlight(key)
    setError(null)
    try {
      const qs = buildExportPdfQuery(mode)
      const url = `${API_BASE}/ordens-servico/export/pdf${qs ? `?${qs}` : ''}`
      await downloadPdfFromUrl(url, fallbackName)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao baixar PDF')
    } finally {
      setExportInFlight(null)
    }
  }

  async function handleDownloadFiscal() {
    if (exportBusy) return
    setExportInFlight('fiscal')
    setError(null)
    try {
      const q = new URLSearchParams()
      q.set('modo', 'fiscal')
      q.set('escopo', fiscalEscopo)
      q.set('formato', fiscalFormato)
      if (fiscalEscopo === 'ano' || fiscalEscopo === 'mes') {
        q.set('ano', String(fiscalAno))
      }
      if (fiscalEscopo === 'mes') {
        q.set('mes', String(fiscalMes))
      }
      const ext = fiscalFormato === 'xlsx' ? 'xlsx' : 'pdf'
      const url = `${API_BASE}/ordens-servico/export/pdf?${q.toString()}`
      const fallback =
        fiscalEscopo === 'geral'
          ? `relatorio-fiscal-geral.${ext}`
          : fiscalEscopo === 'ano'
            ? `relatorio-fiscal-${fiscalAno}.${ext}`
            : `relatorio-fiscal-${fiscalAno}-${String(fiscalMes).padStart(2, '0')}.${ext}`
      await downloadAttachmentFromUrl(url, fallback)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erro ao baixar relatório fiscal',
      )
    } finally {
      setExportInFlight(null)
    }
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

      <header className="mb-8 overflow-hidden rounded-2xl border border-indigo-300/40 bg-linear-to-br from-indigo-700 via-indigo-800 to-slate-900 px-6 py-7 shadow-lg shadow-indigo-900/20 dark:border-indigo-800/40 dark:from-indigo-950 dark:via-indigo-950 dark:to-slate-950">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Relatórios e exportação
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-indigo-100/90">
          Painel analítico com filtros, gráficos de série temporal, rankings e
          tabela completa. O relatório fiscal (PDF ou Excel) reúne receita de
          serviços concluídos por período para conferência com seu contador. Os
          PDFs operacionais listam cada OS com detalhes (úteis para oficina, não
          substituem obrigações fiscais).
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Filtros da análise
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              O dashboard, a análise detalhada e a contagem usada no PDF “OS
              carregadas” seguem cliente, placa e status abaixo. Deixe em branco
              para considerar todas as ordens.
            </p>
          </div>
          {filtrosAtivos && (
            <button
              type="button"
              onClick={() => {
                setFiltCliente('')
                setFiltPlaca('')
                setFiltStatus('')
              }}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Cliente
            </span>
            <input
              className={inputClass}
              value={filtCliente}
              onChange={(e) => setFiltCliente(e.target.value)}
              placeholder="Nome (contém)"
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Placa
            </span>
            <input
              className={inputClass}
              value={filtPlaca}
              onChange={(e) => setFiltPlaca(e.target.value)}
              placeholder="Parcial"
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Status
            </span>
            <select
              className={inputClass}
              value={filtStatus}
              onChange={(e) =>
                setFiltStatus(e.target.value as '' | OrdemServicoStatus)
              }
            >
              <option value="">Todos</option>
              <option value="aberto">{STATUS_LABEL.aberto}</option>
              <option value="fazendo">{STATUS_LABEL.fazendo}</option>
              <option value="pronto">{STATUS_LABEL.pronto}</option>
            </select>
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 lg:pb-2">
            {loading
              ? 'Carregando…'
              : `${ordens.length} ${ordens.length === 1 ? 'ordem' : 'ordens'} na listagem`}
          </p>
        </div>
      </section>

      <RelatoriosDashboard resumo={resumo} loading={loading} />

      <RelatoriosAnaliseDetalhada ordens={ordens} loading={loading} />

      <section className="mb-8 rounded-xl border border-indigo-200/80 bg-linear-to-br from-indigo-50/90 via-white to-slate-50 p-5 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/35 dark:via-slate-900 dark:to-slate-950/80">
        <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">
          Relatório fiscal e gerencial (PDF ou Excel)
        </p>
        <p className="mt-2 text-xs leading-relaxed text-indigo-900/85 dark:text-indigo-200/85">
          Arquivo com resumo financeiro (receita de OS em status Pronto no
          período, ticket médio, valor em carteira nas OS listadas) e tabela
          analítica. A competência da receita usa a data de conclusão da OS; se
          estiver em branco em cadastros antigos, usa-se a data de abertura —
          ajuste as datas nas OS prontas quando for conferir com NF e
          declaração (MEI, Simples, etc.).
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <label className="flex min-w-[160px] flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Formato
            </span>
            <select
              className={inputClass}
              value={fiscalFormato}
              onChange={(e) =>
                setFiscalFormato(e.target.value as 'pdf' | 'xlsx')
              }
            >
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel (.xlsx)</option>
            </select>
          </label>
          <label className="flex min-w-[200px] flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Escopo do período
            </span>
            <select
              className={inputClass}
              value={fiscalEscopo}
              onChange={(e) =>
                setFiscalEscopo(e.target.value as 'geral' | 'ano' | 'mes')
              }
            >
              <option value="geral">Geral (todas as ordens)</option>
              <option value="ano">Um ano (calendário)</option>
              <option value="mes">Um mês específico</option>
            </select>
          </label>
          {(fiscalEscopo === 'ano' || fiscalEscopo === 'mes') && (
            <label className="flex min-w-[140px] flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Ano
              </span>
              <select
                className={inputClass}
                value={fiscalAno}
                onChange={(e) => setFiscalAno(Number(e.target.value))}
              >
                {anosSelect.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          )}
          {fiscalEscopo === 'mes' && (
            <label className="flex min-w-[160px] flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Mês
              </span>
              <select
                className={inputClass}
                value={fiscalMes}
                onChange={(e) => setFiscalMes(Number(e.target.value))}
              >
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => void handleDownloadFiscal()}
            disabled={exportBusy}
            className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {exportInFlight === 'fiscal' ? 'Baixando…' : 'Baixar relatório fiscal'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/40">
        <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
          PDF operacional (lista detalhada por OS)
        </p>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Cada ordem em páginas separadas, com fotos quando houver. Use para
          arquivo da oficina; para impostos prefira o relatório fiscal acima.
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <button
            type="button"
            onClick={() =>
              void handleDownloadPdf('tela', 'ordens-na-lista.pdf')
            }
            disabled={!ordens.length || exportBusy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {exportInFlight === 'pdf-tela'
              ? 'Baixando…'
              : `PDF com as OS carregadas (${ordens.length})`}
          </button>
          <button
            type="button"
            onClick={() => void handleDownloadPdf('todos', 'todas-ordens.pdf')}
            disabled={exportBusy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {exportInFlight === 'pdf-todos' ? 'Baixando…' : 'Todas as OS'}
          </button>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              PDF por status
              <select
                className={inputClass}
                value={exportPdfStatus}
                onChange={(e) =>
                  setExportPdfStatus(e.target.value as OrdemServicoStatus)
                }
              >
                <option value="aberto">Aberto</option>
                <option value="fazendo">Em andamento</option>
                <option value="pronto">Pronto</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                void handleDownloadPdf(
                  'status',
                  `ordens-${exportPdfStatus}.pdf`,
                )
              }
              disabled={exportBusy}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {exportInFlight === 'pdf-status' ? 'Baixando…' : 'Baixar'}
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Atualizar dados
        </button>
      </div>
    </main>
  )
}
