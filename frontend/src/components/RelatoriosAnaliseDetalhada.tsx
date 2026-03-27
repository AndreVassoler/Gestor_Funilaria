import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { STATUS_LABEL } from '../constants/ordemUi'
import type { OrdemServico } from '../types/ordem'
import {
  computeComparativoMesAMes,
  computeRelatorioAnalytics,
  gerarFrasesInsight,
  ordemAtrasadaNaLista,
} from '../utils/relatorioAnalytics'
import { downloadTextFile, ordensToCsvSemicolon } from '../utils/relatorioCsv'
import * as F from '../utils/ordemForm'
import {
  filtrarOrdensPorAbertura,
  labelPeriodoAmigavel,
  type PresetPeriodoRelatorio,
} from '../utils/relatorioPeriodo'

type Props = {
  ordens: OrdemServico[]
  loading: boolean
}

const PRESET_OPTIONS: { value: PresetPeriodoRelatorio; label: string }[] = [
  { value: 'todas', label: 'Todas (sem recorte por abertura)' },
  { value: 'mes_atual', label: 'Mês atual' },
  { value: 'ultimos_3', label: 'Últimos 3 meses' },
  { value: 'ultimos_6', label: 'Últimos 6 meses' },
  { value: 'ultimos_12', label: 'Últimos 12 meses' },
  { value: 'ano_corrente', label: 'Ano corrente' },
  { value: 'personalizado', label: 'Personalizado (datas)' },
]

export function RelatoriosAnaliseDetalhada({ ordens, loading }: Props) {
  const [presetPeriodo, setPresetPeriodo] =
    useState<PresetPeriodoRelatorio>('todas')
  const [persDe, setPersDe] = useState('')
  const [persAte, setPersAte] = useState('')
  const [tabRank, setTabRank] = useState<'marca' | 'cliente' | 'veiculo'>(
    'marca',
  )

  const ordensAnalise = useMemo(
    () =>
      filtrarOrdensPorAbertura(ordens, presetPeriodo, persDe, persAte),
    [ordens, presetPeriodo, persDe, persAte],
  )

  const a = useMemo(
    () => computeRelatorioAnalytics(ordensAnalise),
    [ordensAnalise],
  )

  const insights = useMemo(() => gerarFrasesInsight(a), [a])

  /** Calendário: ignora o preset de período da análise; só filtros da página (cliente/placa/status). */
  const mom = useMemo(() => computeComparativoMesAMes(ordens), [ordens])

  const ordensTabela = useMemo(
    () => [...ordensAnalise].sort((x, y) => y.id - x.id),
    [ordensAnalise],
  )

  const periodoLegenda = labelPeriodoAmigavel(
    presetPeriodo,
    persDe,
    persAte,
  )

  const personalizadoIncompleto =
    presetPeriodo === 'personalizado' && (!persDe || !persAte)

  function handleExportCsv() {
    if (!ordensTabela.length) return
    const csv = ordensToCsvSemicolon(ordensTabela)
    const stamp = new Date().toISOString().slice(0, 10)
    downloadTextFile(csv, `relatorio-os-${stamp}.csv`, 'text/csv;charset=utf-8')
  }

  if (loading && !ordens.length) {
    return (
      <section
        className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        aria-busy="true"
      >
        <div className="h-6 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mb-10 space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Análise detalhada da amostra
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Camada extra: recorte por período de abertura, comparativos de duplo
          eixo, distribuição por faixa de valor, empilhamento de status ao longo
          do tempo, insights automáticos e exportação CSV. Os filtros de
          cliente/placa/status da página continuam valendo antes deste recorte.
        </p>
      </div>

      <div className="rounded-xl border border-violet-200/80 bg-linear-to-br from-violet-50/90 via-white to-indigo-50/60 p-5 shadow-sm dark:border-violet-900/40 dark:from-violet-950/30 dark:via-slate-900 dark:to-indigo-950/25">
        <p className="text-sm font-semibold text-violet-950 dark:text-violet-100">
          Período da análise (data de abertura)
        </p>
        <p className="mt-1 text-xs text-violet-900/80 dark:text-violet-200/85">
          Afeta apenas os blocos abaixo (não altera o resumo superior nem a API).
          OS sem data de abertura ficam de fora quando qualquer recorte está
          ativo.
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <label className="flex min-w-[220px] flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Preset
            </span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none ring-violet-400/30 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
              value={presetPeriodo}
              onChange={(e) =>
                setPresetPeriodo(e.target.value as PresetPeriodoRelatorio)
              }
            >
              {PRESET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {presetPeriodo === 'personalizado' && (
            <>
              <label className="flex min-w-[140px] flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  De
                </span>
                <input
                  type="date"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                  value={persDe}
                  onChange={(e) => setPersDe(e.target.value)}
                />
              </label>
              <label className="flex min-w-[140px] flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Até
                </span>
                <input
                  type="date"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                  value={persAte}
                  onChange={(e) => setPersAte(e.target.value)}
                />
              </label>
            </>
          )}
          <p className="text-xs text-slate-600 dark:text-slate-400 lg:max-w-md lg:pb-2">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              Ativo:{' '}
            </span>
            {periodoLegenda}
            {personalizadoIncompleto && (
              <span className="ml-1 text-amber-700 dark:text-amber-300">
                — informe início e fim para aplicar.
              </span>
            )}
          </p>
        </div>
      </div>

      {ordens.length > 0 && (
        <article className="rounded-2xl border border-sky-200/80 bg-linear-to-br from-sky-50/90 via-white to-indigo-50/50 p-5 shadow-sm dark:border-sky-900/40 dark:from-sky-950/30 dark:via-slate-900 dark:to-indigo-950/20">
          <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">
            Comparativo mês civil (atual × mês anterior)
          </p>
          <p className="mt-1 text-xs text-sky-900/85 dark:text-sky-200/85">
            Usa o mesmo conjunto de OS dos filtros da página (cliente, placa,
            status). Não aplica o recorte por período da análise — é sempre o
            mês corrente do calendário frente ao mês passado. Sem metas: só
            números e variação percentual para você acompanhar o ritmo.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-sky-200/60 bg-white/90 p-4 dark:border-sky-800/40 dark:bg-slate-950/50">
              <p className="text-xs font-medium uppercase tracking-wide text-sky-800 dark:text-sky-200">
                Novas OS (data de abertura)
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                {mom.labelMesAtual}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-sky-900 dark:text-sky-100">
                {mom.aberturasAtual}
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Mês anterior ({mom.labelMesAnterior}):{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {mom.aberturasAnterior}
                </span>
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                Variação:{' '}
                {mom.pctVariacaoAberturas != null ? (
                  <span
                    className={
                      mom.pctVariacaoAberturas >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-700 dark:text-red-400'
                    }
                  >
                    {mom.pctVariacaoAberturas >= 0 ? '+' : ''}
                    {mom.pctVariacaoAberturas}%
                  </span>
                ) : mom.aberturasAnterior === 0 && mom.aberturasAtual > 0 ? (
                  <span className="text-indigo-700 dark:text-indigo-300">
                    sem base no mês anterior
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">—</span>
                )}
              </p>
            </div>
            <div className="rounded-xl border border-indigo-200/60 bg-white/90 p-4 dark:border-indigo-800/40 dark:bg-slate-950/50">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-800 dark:text-indigo-200">
                Receita concluída (data de conclusão, só OS prontas)
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                {mom.labelMesAtual}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-950 dark:text-indigo-100">
                {F.formatMoney(mom.receitaConcluidaAtual)}
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Mês anterior ({mom.labelMesAnterior}):{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {F.formatMoney(mom.receitaConcluidaAnterior)}
                </span>
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                Variação:{' '}
                {mom.pctVariacaoReceita != null ? (
                  <span
                    className={
                      mom.pctVariacaoReceita >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-700 dark:text-red-400'
                    }
                  >
                    {mom.pctVariacaoReceita >= 0 ? '+' : ''}
                    {mom.pctVariacaoReceita}%
                  </span>
                ) : mom.receitaConcluidaAnterior === 0 &&
                  mom.receitaConcluidaAtual > 0 ? (
                  <span className="text-indigo-700 dark:text-indigo-300">
                    sem base no mês anterior
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">—</span>
                )}
              </p>
            </div>
          </div>
        </article>
      )}

      {ordens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
          Nenhuma ordem na listagem. Ajuste os filtros da página ou cadastre OS
          no painel.
        </p>
      ) : personalizadoIncompleto ? (
        <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-6 text-center text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Selecione as duas datas do período personalizado para carregar a
          análise.
        </p>
      ) : ordensAnalise.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
          Nenhuma OS com data de abertura dentro do período escolhido. Amplie o
          intervalo ou use “Todas”.
        </p>
      ) : (
        <>
          {insights.length > 0 && (
            <article className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/25">
              <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                Leitura automática (insights)
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-emerald-900/90 dark:text-emerald-100/90">
                {insights.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </article>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Valor total
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {F.formatMoney(a.valorTotal)}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {a.qtd} {a.qtd === 1 ? 'ordem' : 'ordens'} no recorte
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Ticket médio
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {a.ticketMedio != null ? F.formatMoney(a.ticketMedio) : '—'}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Mediana:{' '}
                {a.medianaValor != null ? F.formatMoney(a.medianaValor) : '—'}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Taxa concluída
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {a.taxaConclusaoPct != null ? `${a.taxaConclusaoPct}%` : '—'}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Mín / máx:{' '}
                {a.valorMin != null ? F.formatMoney(a.valorMin) : '—'} ·{' '}
                {a.valorMax != null ? F.formatMoney(a.valorMax) : '—'}
              </p>
            </article>
            <article className="rounded-2xl border border-indigo-200/80 bg-indigo-50/80 p-4 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/40">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-800 dark:text-indigo-200">
                Lead time
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-indigo-950 dark:text-indigo-100">
                μ {a.leadTimeMedioDias != null ? `${a.leadTimeMedioDias} d` : '—'}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-indigo-900 dark:text-indigo-200">
                med{' '}
                {a.leadTimeMedianaDias != null
                  ? `${a.leadTimeMedianaDias} d`
                  : '—'}
              </p>
              <p className="mt-2 text-xs text-indigo-900/80 dark:text-indigo-200/85">
                {a.leadTimeAmostra} OS com abertura e conclusão
              </p>
            </article>
            <article className="rounded-2xl border border-teal-200/80 bg-teal-50/80 p-4 shadow-sm dark:border-teal-900/40 dark:bg-teal-950/30">
              <p className="text-xs font-medium uppercase tracking-wide text-teal-900 dark:text-teal-200">
                Prazo (concluídas)
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-teal-950 dark:text-teal-100">
                {a.prontosComPrevisao > 0
                  ? `${Math.round((a.prontosEntreguesNoPrazo / a.prontosComPrevisao) * 1000) / 10}%`
                  : '—'}
              </p>
              <p className="mt-2 text-xs text-teal-900/85 dark:text-teal-200/85">
                {a.prontosEntreguesNoPrazo} de {a.prontosComPrevisao} no prazo ou
                antes (com previsão)
              </p>
            </article>
            <article className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/35">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-900 dark:text-amber-200">
                Alertas
              </p>
              <p className="mt-1 text-lg font-semibold text-amber-950 dark:text-amber-100">
                {a.semPrevisaoEntrega} sem prev.
              </p>
              <p className="mt-1 text-lg font-semibold text-red-800 dark:text-red-200">
                {a.atrasadasNaAmostra} atraso
              </p>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:col-span-1">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Status na amostra
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {(['aberto', 'fazendo', 'pronto'] as const).map((st) => {
                  const n = a.porStatus[st]
                  const pct = a.qtd > 0 ? Math.round((n / a.qtd) * 1000) / 10 : 0
                  return (
                    <li
                      key={st}
                      className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800"
                    >
                      <span className="text-slate-600 dark:text-slate-400">
                        {STATUS_LABEL[st]}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {n}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          ({pct}%)
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Rankings
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ['marca', 'Marca'],
                    ['cliente', 'Cliente'],
                    ['veiculo', 'Veículo'],
                  ] as const
                ).map(([key, lab]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTabRank(key)}
                    className={
                      tabRank === key
                        ? 'rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white dark:bg-indigo-600'
                        : 'rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'
                    }
                  >
                    Por {lab.toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <th className="pb-2 pr-3 font-medium">
                        {tabRank === 'marca'
                          ? 'Marca'
                          : tabRank === 'cliente'
                            ? 'Cliente'
                            : 'Marca / modelo'}
                      </th>
                      <th className="pb-2 pr-3 font-medium">OS</th>
                      <th className="pb-2 font-medium text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      tabRank === 'marca'
                        ? a.topMarcas
                        : tabRank === 'cliente'
                          ? a.topClientes
                          : a.topVeiculos
                    ).map((row) => (
                      <tr
                        key={row.nome}
                        className="border-b border-slate-100 dark:border-slate-800"
                      >
                        <td className="max-w-[220px] truncate py-2 pr-3 text-slate-800 dark:text-slate-200">
                          {row.nome}
                        </td>
                        <td className="py-2 pr-3 tabular-nums text-slate-600 dark:text-slate-400">
                          {row.ordens}
                        </td>
                        <td className="py-2 text-right font-medium tabular-nums text-slate-900 dark:text-slate-100">
                          {F.formatMoney(row.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Comparativo mensal: novas OS × receita concluída
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Barras = quantidade de aberturas no mês; linha = soma dos valores
              de OS prontas com conclusão naquele mês (últimos 12 meses).
            </p>
            <div className="mt-4 h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={a.chartComparativoMes}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-slate-200 dark:stroke-slate-700"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    className="fill-slate-500"
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fontSize: 10 }}
                    className="fill-slate-500"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    className="fill-slate-500"
                    tickFormatter={(v) =>
                      v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                    }
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const n = String(name)
                      if (n === 'receitaConcluida' || n === 'Receita') {
                        return [
                          F.formatMoney(Number(value ?? 0)),
                          'Receita concluída',
                        ]
                      }
                      const q = Number(value ?? 0)
                      return [q === 1 ? '1 ordem' : `${q} ordens`, 'Aberturas']
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="qtdAberturas"
                    name="Novas OS"
                    fill="#6366f1"
                    radius={[3, 3, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="receitaConcluida"
                    name="Receita"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Novas OS por mês (abertura)
              </p>
              <div className="mt-4 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={a.chartAberturasPorMes}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-slate-200 dark:stroke-slate-700"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      className="fill-slate-500"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      className="fill-slate-500"
                    />
                    <Tooltip
                      formatter={(value) => {
                        const v = Number(value ?? 0)
                        return [
                          v === 1 ? '1 ordem' : `${v} ordens`,
                          'Quantidade',
                        ]
                      }}
                    />
                    <Bar
                      dataKey="valor"
                      name="Quantidade"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Receita concluída por mês (conclusão)
              </p>
              <div className="mt-4 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={a.chartReceitaConcluidaPorMes}
                    margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-slate-200 dark:stroke-slate-700"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      className="fill-slate-500"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="fill-slate-500"
                      tickFormatter={(v) =>
                        v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        F.formatMoney(Number(value ?? 0)),
                        'Receita',
                      ]}
                    />
                    <Bar
                      dataKey="valor"
                      name="Valor"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>

          <details className="group rounded-2xl border border-slate-300 bg-slate-50/80 open:bg-white dark:border-slate-600 dark:bg-slate-900/80 dark:open:bg-slate-900">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-slate-800 marker:content-none dark:text-slate-100 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-2">
                Camada avançada: empilhamento, faixas de valor e leitura extra
                <span className="text-xs font-normal text-slate-500 group-open:hidden dark:text-slate-400">
                  Abrir
                </span>
                <span className="hidden text-xs font-normal text-slate-500 group-open:inline dark:text-slate-400">
                  Fechar
                </span>
              </span>
            </summary>
            <div className="space-y-6 border-t border-slate-200 px-5 pb-6 pt-4 dark:border-slate-700">
              <article>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  OS por mês de abertura e status (empilhado)
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Cada barra soma as aberturas daquele mês, separadas por status
                  atual.
                </p>
                <div className="mt-4 h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={a.chartMesStatusStack}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-slate-200 dark:stroke-slate-700"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        className="fill-slate-500"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10 }}
                        className="fill-slate-500"
                      />
                      <Tooltip
                        formatter={(value) => {
                          const v = Number(value ?? 0)
                          return [v === 1 ? '1' : String(v), '']
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="aberto"
                        stackId="st"
                        name="Aberto"
                        fill="#f59e0b"
                      />
                      <Bar
                        dataKey="fazendo"
                        stackId="st"
                        name="Em andamento"
                        fill="#0ea5e9"
                      />
                      <Bar
                        dataKey="pronto"
                        stackId="st"
                        name="Pronto"
                        fill="#10b981"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Distribuição do valor da OS (faixas)
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Contagem de ordens no recorte por faixa de valor cadastrado.
                </p>
                <div className="mt-4 h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={a.chartFaixasValor}
                      layout="vertical"
                      margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-slate-200 dark:stroke-slate-700"
                      />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={148}
                        tick={{ fontSize: 10 }}
                        className="fill-slate-500"
                      />
                      <Tooltip
                        formatter={(value) => {
                          const v = Number(value ?? 0)
                          return [v === 1 ? '1 ordem' : `${v} ordens`, 'Qtd']
                        }}
                      />
                      <Bar
                        dataKey="qtd"
                        name="Quantidade"
                        fill="#8b5cf6"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>
          </details>

          <article className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Tabela analítica
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {ordensTabela.length}{' '}
                  {ordensTabela.length === 1 ? 'ordem' : 'ordens'} no recorte.
                  Linhas com fundo avermelhado: previsão vencida e não prontas.
                </p>
              </div>
              <button
                type="button"
                disabled={!ordensTabela.length}
                onClick={handleExportCsv}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Exportar CSV (Excel)
              </button>
            </div>
            <div className="max-h-[min(520px,70vh)] overflow-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">OS</th>
                    <th className="px-3 py-2 font-medium">Cliente</th>
                    <th className="px-3 py-2 font-medium">Veículo</th>
                    <th className="px-3 py-2 font-medium">Placa</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium text-right">Valor</th>
                    <th className="px-3 py-2 font-medium">Abertura</th>
                    <th className="px-3 py-2 font-medium">Previsão</th>
                    <th className="px-3 py-2 font-medium">Conclusão</th>
                  </tr>
                </thead>
                <tbody>
                  {ordensTabela.map((o) => {
                    const atrasada = ordemAtrasadaNaLista(o)
                    return (
                      <tr
                        key={o.id}
                        className={
                          atrasada
                            ? 'border-b border-slate-100 bg-red-50/80 dark:border-slate-800 dark:bg-red-950/25'
                            : 'border-b border-slate-100 dark:border-slate-800'
                        }
                      >
                        <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                          #{o.id}
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-2 text-slate-800 dark:text-slate-200">
                          {o.cliente}
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-2 text-slate-600 dark:text-slate-400">
                          {[o.marca, o.modelo, o.ano].filter(Boolean).join(' ')}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {o.placa}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              o.status === 'pronto'
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : o.status === 'fazendo'
                                  ? 'text-sky-700 dark:text-sky-300'
                                  : 'text-amber-800 dark:text-amber-200'
                            }
                          >
                            {STATUS_LABEL[o.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums text-slate-900 dark:text-slate-100">
                          {F.formatMoney(o.valor)}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums text-slate-600 dark:text-slate-400">
                          {F.formatDateBR(o.dataAbertura)}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums text-slate-600 dark:text-slate-400">
                          {F.formatDateBR(o.previsaoEntrega)}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums text-slate-600 dark:text-slate-400">
                          {F.formatDateBR(o.dataConclusao)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}
    </section>
  )
}
