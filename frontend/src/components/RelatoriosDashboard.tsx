import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { TooltipPayload } from 'recharts'
import type { DashboardResumo } from '../types/ordem'
import * as F from '../utils/ordemForm'

type Props = {
  resumo: DashboardResumo | null
  loading: boolean
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 1000) / 10
}

const STATUS_PIE_COLORS = {
  Aberto: '#f59e0b',
  'Em andamento': '#0ea5e9',
  Pronto: '#10b981',
} as const

type PieDatum = {
  name: keyof typeof STATUS_PIE_COLORS
  value: number
  color: string
}

function StatusPieTooltip({
  active,
  payload,
  totalOrdens,
}: {
  active?: boolean
  payload?: TooltipPayload
  totalOrdens: number
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]
  const datum = row.payload as PieDatum | undefined
  const name = datum?.name ?? row.name
  const value = Number(row.value ?? 0)
  const p = pct(value, totalOrdens)
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md dark:border-slate-600 dark:bg-slate-900">
      <p className="font-medium text-slate-900 dark:text-slate-100">{name}</p>
      <p className="tabular-nums text-slate-600 dark:text-slate-300">
        {value} {value === 1 ? 'ordem' : 'ordens'} ({p}%)
      </p>
    </div>
  )
}

export function RelatoriosDashboard({ resumo, loading }: Props) {
  if (loading && !resumo) {
    return (
      <section
        className="mb-10 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900"
        aria-busy="true"
      >
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      </section>
    )
  }

  if (!resumo) return null

  const {
    abertas,
    emAndamento,
    prontas,
    atrasadas,
    totalOrdens: totalInformado,
    valorArrecadadoProntos: valorProntosInformado,
    valorEmAbertoEAndamento: valorCarteiraInformado,
  } = resumo

  const totalOrdens =
    totalInformado ?? abertas + emAndamento + prontas
  const valorArrecadadoProntos = valorProntosInformado ?? 0
  const valorEmAbertoEAndamento = valorCarteiraInformado ?? 0

  const ticketMedioProntos =
    prontas > 0 ? valorArrecadadoProntos / prontas : null

  const pAberto = pct(abertas, totalOrdens)
  const pFazendo = pct(emAndamento, totalOrdens)
  const pPronto = pct(prontas, totalOrdens)

  const statusPieData: PieDatum[] = [
    { name: 'Aberto' as const, value: abertas, color: STATUS_PIE_COLORS.Aberto },
    {
      name: 'Em andamento' as const,
      value: emAndamento,
      color: STATUS_PIE_COLORS['Em andamento'],
    },
    { name: 'Pronto' as const, value: prontas, color: STATUS_PIE_COLORS.Pronto },
  ].filter((d) => d.value > 0)

  return (
    <section className="mb-10 space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Visão geral do que está na oficina: quantidade por status, atrasos e
          valores (estimados cadastrados nas OS).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/80">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total de OS
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {totalOrdens}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Todas as ordens cadastradas
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/35">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Abertos
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-950 dark:text-amber-100">
            {abertas}
          </p>
          <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-200/90">
            {pAberto}% do total
          </p>
        </article>

        <article className="rounded-2xl border border-sky-200/80 bg-sky-50/90 p-5 shadow-sm dark:border-sky-900/40 dark:bg-sky-950/35">
          <p className="text-xs font-medium uppercase tracking-wide text-sky-800 dark:text-sky-200">
            Em andamento
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-sky-950 dark:text-sky-100">
            {emAndamento}
          </p>
          <p className="mt-2 text-xs text-sky-800/80 dark:text-sky-200/90">
            {pFazendo}% do total
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/35">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
            Prontos
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-950 dark:text-emerald-100">
            {prontas}
          </p>
          <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-200/90">
            {pPronto}% do total
          </p>
        </article>

        <article className="rounded-2xl border border-red-200/80 bg-red-50/90 p-5 shadow-sm dark:border-red-900/40 dark:bg-red-950/35">
          <p className="text-xs font-medium uppercase tracking-wide text-red-800 dark:text-red-200">
            Atrasadas
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-red-950 dark:text-red-100">
            {atrasadas}
          </p>
          <p className="mt-2 text-xs leading-snug text-red-800/85 dark:text-red-200/85">
            Previsão anterior a hoje e status diferente de pronto
          </p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="lg:col-span-2 rounded-2xl border border-violet-200/80 bg-linear-to-br from-violet-50 via-white to-indigo-50/80 p-6 shadow-sm dark:border-violet-900/40 dark:from-violet-950/40 dark:via-slate-900 dark:to-indigo-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-800 dark:text-violet-200">
            Valor arrecadado (serviços concluídos)
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-violet-950 tabular-nums sm:text-4xl dark:text-violet-100">
            {F.formatMoney(valorArrecadadoProntos)}
          </p>
          <p className="mt-3 text-sm text-violet-900/80 dark:text-violet-200/85">
            Soma dos valores estimados das ordens com status{' '}
            <span className="font-medium">Pronto</span>. Reflete o que foi
            cadastrado em cada OS concluída.
          </p>
          {ticketMedioProntos != null && (
            <p className="mt-4 inline-flex rounded-lg border border-violet-200/60 bg-white/80 px-3 py-2 text-sm text-violet-900 dark:border-violet-800/50 dark:bg-slate-950/40 dark:text-violet-100">
              Ticket médio (prontos):{' '}
              <span className="ml-1 font-semibold tabular-nums">
                {F.formatMoney(ticketMedioProntos)}
              </span>
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Valor em carteira
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {F.formatMoney(valorEmAbertoEAndamento)}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Soma dos valores em OS <span className="font-medium">Aberto</span>{' '}
            ou <span className="font-medium">Em andamento</span> — trabalho
            ainda não marcado como pronto.
          </p>
        </article>
      </div>

      {totalOrdens > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            Distribuição por status
          </p>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            {statusPieData.length > 0 && (
              <div
                className="mx-auto w-full max-w-[320px]"
                role="img"
                aria-label={`Gráfico: ${abertas} abertos, ${emAndamento} em andamento, ${prontas} prontos`}
              >
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={88}
                        paddingAngle={2}
                      >
                        {statusPieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        content={(props) => (
                          <StatusPieTooltip
                            active={props.active}
                            payload={props.payload}
                            totalOrdens={totalOrdens}
                          />
                        )}
                      />
                      <Legend
                        verticalAlign="bottom"
                        formatter={(value) => (
                          <span className="text-xs text-slate-600 dark:text-slate-300">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Barra proporcional
              </p>
              <div
                className="flex h-4 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800"
                role="img"
                aria-label={`Distribuição: ${abertas} abertos, ${emAndamento} em andamento, ${prontas} prontos`}
              >
                {abertas > 0 && (
                  <div
                    className="bg-amber-400 dark:bg-amber-600"
                    style={{ width: `${pAberto}%` }}
                    title={`Abertos: ${pAberto}%`}
                  />
                )}
                {emAndamento > 0 && (
                  <div
                    className="bg-sky-400 dark:bg-sky-600"
                    style={{ width: `${pFazendo}%` }}
                    title={`Em andamento: ${pFazendo}%`}
                  />
                )}
                {prontas > 0 && (
                  <div
                    className="bg-emerald-400 dark:bg-emerald-600"
                    style={{ width: `${pPronto}%` }}
                    title={`Prontos: ${pPronto}%`}
                  />
                )}
              </div>
              <ul className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-sm bg-amber-400 dark:bg-amber-600"
                    aria-hidden
                  />
                  Aberto {pAberto}%
                </li>
                <li className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-sm bg-sky-400 dark:bg-sky-600"
                    aria-hidden
                  />
                  Em andamento {pFazendo}%
                </li>
                <li className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-sm bg-emerald-400 dark:bg-emerald-600"
                    aria-hidden
                  />
                  Pronto {pPronto}%
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
