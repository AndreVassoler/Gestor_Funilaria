import type { OrdemServico, OrdemServicoStatus } from '../types/ordem'

export type MesPonto = { key: string; label: string; valor: number }

export type RankingItem = {
  nome: string
  ordens: number
  valor: number
}

function inicioDoDia(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function ordemAtrasadaNaLista(o: OrdemServico): boolean {
  if (o.status === 'pronto') return false
  if (!o.previsaoEntrega) return false
  const prev = inicioDoDia(new Date(o.previsaoEntrega))
  const hoje = inicioDoDia(new Date())
  return prev < hoje
}

function ymKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const

export function ultimos12MesesLabels(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = []
  const base = new Date()
  for (let i = 11; i >= 0; i--) {
    const x = new Date(base.getFullYear(), base.getMonth() - i, 1)
    const key = ymKey(x)
    const label = `${MESES_CURTOS[x.getMonth()]}/${String(x.getFullYear()).slice(-2)}`
    out.push({ key, label })
  }
  return out
}

function parseDataAbertura(o: OrdemServico): Date | null {
  if (!o.dataAbertura) return null
  const d = new Date(o.dataAbertura)
  return Number.isNaN(d.getTime()) ? null : d
}

function parseDataConclusao(o: OrdemServico): Date | null {
  if (!o.dataConclusao) return null
  const d = new Date(o.dataConclusao)
  return Number.isNaN(d.getTime()) ? null : d
}

function diasEntre(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

function acumulaMap(
  map: Map<string, number>,
  key: string,
  delta: number,
): void {
  map.set(key, (map.get(key) ?? 0) + delta)
}

function rankingPorCampo(
  ordens: OrdemServico[],
  campo: 'marca' | 'cliente',
  topN: number,
): RankingItem[] {
  const map = new Map<string, { ordens: number; valor: number }>()
  for (const o of ordens) {
    const nome = (o[campo] ?? '').trim() || '(sem nome)'
    const cur = map.get(nome) ?? { ordens: 0, valor: 0 }
    cur.ordens += 1
    cur.valor += o.valor ?? 0
    map.set(nome, cur)
  }
  return [...map.entries()]
    .map(([nome, v]) => ({ nome, ordens: v.ordens, valor: v.valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, topN)
}

function rankingVeiculos(ordens: OrdemServico[], topN: number): RankingItem[] {
  const map = new Map<string, { ordens: number; valor: number }>()
  for (const o of ordens) {
    const nome =
      [o.marca, o.modelo].filter(Boolean).join(' ').trim() || '(sem veículo)'
    const cur = map.get(nome) ?? { ordens: 0, valor: 0 }
    cur.ordens += 1
    cur.valor += o.valor ?? 0
    map.set(nome, cur)
  }
  return [...map.entries()]
    .map(([nome, v]) => ({ nome, ordens: v.ordens, valor: v.valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, topN)
}

function mediana(nums: number[]): number | null {
  if (!nums.length) return null
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

const FAIXAS_VALOR: { label: string; test: (v: number) => boolean }[] = [
  { label: 'Até R$ 500', test: (v) => v <= 500 },
  { label: 'R$ 500,01 – 1.500', test: (v) => v > 500 && v <= 1500 },
  { label: 'R$ 1.500,01 – 3.000', test: (v) => v > 1500 && v <= 3000 },
  { label: 'Acima de R$ 3.000', test: (v) => v > 3000 },
]

export type MesStatusStack = {
  key: string
  label: string
  aberto: number
  fazendo: number
  pronto: number
}

export type FaixaValorPonto = { label: string; qtd: number }

export type RelatorioAnalytics = {
  qtd: number
  valorTotal: number
  ticketMedio: number | null
  medianaValor: number | null
  valorMin: number | null
  valorMax: number | null
  taxaConclusaoPct: number | null
  semPrevisaoEntrega: number
  atrasadasNaAmostra: number
  porStatus: Record<OrdemServicoStatus, number>
  leadTimeMedioDias: number | null
  leadTimeMedianaDias: number | null
  leadTimeAmostra: number
  prontosComPrevisao: number
  prontosEntreguesNoPrazo: number
  chartAberturasPorMes: MesPonto[]
  chartReceitaConcluidaPorMes: MesPonto[]
  chartMesStatusStack: MesStatusStack[]
  chartFaixasValor: FaixaValorPonto[]
  chartComparativoMes: {
    label: string
    qtdAberturas: number
    receitaConcluida: number
  }[]
  topMarcas: RankingItem[]
  topClientes: RankingItem[]
  topVeiculos: RankingItem[]
}

export function computeRelatorioAnalytics(
  ordens: OrdemServico[],
): RelatorioAnalytics {
  const meses = ultimos12MesesLabels()
  const keys = new Set(meses.map((m) => m.key))

  const aberturas = new Map<string, number>()
  const receitaConcluida = new Map<string, number>()
  const statusPorMes = new Map<
    string,
    { aberto: number; fazendo: number; pronto: number }
  >()
  for (const k of keys) {
    aberturas.set(k, 0)
    receitaConcluida.set(k, 0)
    statusPorMes.set(k, { aberto: 0, fazendo: 0, pronto: 0 })
  }

  const porStatus: Record<OrdemServicoStatus, number> = {
    aberto: 0,
    fazendo: 0,
    pronto: 0,
  }

  let valorTotal = 0
  let semPrevisaoEntrega = 0
  let atrasadasNaAmostra = 0
  const leadTimes: number[] = []
  const valores: number[] = []

  let valorMin: number | null = null
  let valorMax: number | null = null

  let prontosComPrevisao = 0
  let prontosEntreguesNoPrazo = 0

  for (const o of ordens) {
    valorTotal += o.valor ?? 0
    const v = o.valor ?? 0
    valores.push(v)
    valorMin = valorMin === null ? v : Math.min(valorMin, v)
    valorMax = valorMax === null ? v : Math.max(valorMax, v)

    porStatus[o.status] += 1

    if (!o.previsaoEntrega) semPrevisaoEntrega += 1
    if (ordemAtrasadaNaLista(o)) atrasadasNaAmostra += 1

    const da = parseDataAbertura(o)
    if (da) {
      const k = ymKey(da)
      if (keys.has(k)) {
        acumulaMap(aberturas, k, 1)
        const st = statusPorMes.get(k)!
        st[o.status] += 1
      }
    }

    if (o.status === 'pronto') {
      const dc = parseDataConclusao(o)
      if (dc) {
        const k = ymKey(dc)
        if (keys.has(k)) acumulaMap(receitaConcluida, k, o.valor ?? 0)
      }
      if (da && dc) {
        leadTimes.push(diasEntre(da, dc))
      }
      if (o.previsaoEntrega && dc) {
        prontosComPrevisao += 1
        const prev = inicioDoDia(new Date(o.previsaoEntrega))
        const conc = inicioDoDia(dc)
        if (conc.getTime() <= prev.getTime()) prontosEntreguesNoPrazo += 1
      }
    }
  }

  const leadTimeAmostra = leadTimes.length
  const leadTimeMedioDias =
    leadTimeAmostra > 0
      ? Math.round(
          (leadTimes.reduce((a, b) => a + b, 0) / leadTimeAmostra) * 10,
        ) / 10
      : null
  const leadTimeMedianaDias =
    leadTimeAmostra > 0 ? mediana(leadTimes) : null

  const chartAberturasPorMes: MesPonto[] = meses.map(({ key, label }) => ({
    key,
    label,
    valor: aberturas.get(key) ?? 0,
  }))

  const chartReceitaConcluidaPorMes: MesPonto[] = meses.map(
    ({ key, label }) => ({
      key,
      label,
      valor: receitaConcluida.get(key) ?? 0,
    }),
  )

  const chartMesStatusStack: MesStatusStack[] = meses.map(({ key, label }) => {
    const s = statusPorMes.get(key)!
    return {
      key,
      label,
      aberto: s.aberto,
      fazendo: s.fazendo,
      pronto: s.pronto,
    }
  })

  const chartComparativoMes = meses.map(({ label }, i) => ({
    label,
    qtdAberturas: chartAberturasPorMes[i]!.valor,
    receitaConcluida: chartReceitaConcluidaPorMes[i]!.valor,
  }))

  const faixaCounts = FAIXAS_VALOR.map(() => 0)
  for (const v of valores) {
    FAIXAS_VALOR.forEach((f, i) => {
      if (f.test(v)) faixaCounts[i] += 1
    })
  }
  const chartFaixasValor: FaixaValorPonto[] = FAIXAS_VALOR.map((f, i) => ({
    label: f.label,
    qtd: faixaCounts[i]!,
  }))

  const qtd = ordens.length
  const taxaConclusaoPct =
    qtd > 0
      ? Math.round((porStatus.pronto / qtd) * 1000) / 10
      : null

  return {
    qtd,
    valorTotal,
    ticketMedio: qtd > 0 ? valorTotal / qtd : null,
    medianaValor: mediana(valores),
    valorMin: qtd ? valorMin : null,
    valorMax: qtd ? valorMax : null,
    taxaConclusaoPct,
    semPrevisaoEntrega,
    atrasadasNaAmostra,
    porStatus,
    leadTimeMedioDias,
    leadTimeMedianaDias,
    leadTimeAmostra,
    prontosComPrevisao,
    prontosEntreguesNoPrazo,
    chartAberturasPorMes,
    chartReceitaConcluidaPorMes,
    chartMesStatusStack,
    chartFaixasValor,
    chartComparativoMes,
    topMarcas: rankingPorCampo(ordens, 'marca', 10),
    topClientes: rankingPorCampo(ordens, 'cliente', 10),
    topVeiculos: rankingVeiculos(ordens, 10),
  }
}

export function gerarFrasesInsight(a: RelatorioAnalytics): string[] {
  const s: string[] = []
  if (a.qtd === 0) return s

  if (a.taxaConclusaoPct != null) {
    s.push(
      `${a.porStatus.pronto} de ${a.qtd} OS estão concluídas (${a.taxaConclusaoPct}% da amostra).`,
    )
  }

  if (a.topClientes[0]) {
    const t = a.topClientes[0]!
    s.push(
      `Cliente com maior volume financeiro na amostra: ${t.nome} (${t.ordens} OS).`,
    )
  }

  if (a.topMarcas[0]) {
    const t = a.topMarcas[0]!
    s.push(`Marca líder em valor: ${t.nome} (${t.ordens} OS).`)
  }

  const maxAb = [...a.chartAberturasPorMes].sort(
    (x, y) => y.valor - x.valor,
  )[0]
  if (maxAb && maxAb.valor > 0) {
    s.push(
      `Mês com mais aberturas nos últimos 12 meses: ${maxAb.label} (${maxAb.valor} OS).`,
    )
  }

  const maxRec = [...a.chartReceitaConcluidaPorMes].sort(
    (x, y) => y.valor - x.valor,
  )[0]
  if (maxRec && maxRec.valor > 0) {
    s.push(
      `Pico de receita concluída (por mês de conclusão): ${maxRec.label}.`,
    )
  }

  if (a.prontosComPrevisao > 0) {
    const pct =
      Math.round(
        (a.prontosEntreguesNoPrazo / a.prontosComPrevisao) * 1000,
      ) / 10
    s.push(
      `Entre as concluídas com previsão cadastrada, ${pct}% foram entregues na data ou antes.`,
    )
  }

  if (a.atrasadasNaAmostra > 0) {
    s.push(
      `Há ${a.atrasadasNaAmostra} OS com previsão vencida e ainda não marcadas como prontas.`,
    )
  }

  if (a.semPrevisaoEntrega > 0) {
    s.push(
      `${a.semPrevisaoEntrega} OS na amostra estão sem data de previsão de entrega.`,
    )
  }

  return s.slice(0, 10)
}

/** Mês civil corrente × mês civil anterior (usa `referencia`, default: hoje). */
export type ComparativoMesAMes = {
  labelMesAtual: string
  labelMesAnterior: string
  aberturasAtual: number
  aberturasAnterior: number
  receitaConcluidaAtual: number
  receitaConcluidaAnterior: number
  /** % variação aberturas: null se mês anterior = 0 */
  pctVariacaoAberturas: number | null
  /** % variação receita: null se mês anterior = 0 */
  pctVariacaoReceita: number | null
}

function mesCivilAnterior(y: number, m: number): { y: number; m: number } {
  if (m > 1) return { y, m: m - 1 }
  return { y: y - 1, m: 12 }
}

function labelMesPt(y: number, m: number): string {
  const d = new Date(y, m - 1, 1)
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(d)
}

function pctVariacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((atual - anterior) / anterior) * 1000) / 10
}

export function computeComparativoMesAMes(
  ordens: OrdemServico[],
  referencia: Date = new Date(),
): ComparativoMesAMes {
  const y0 = referencia.getFullYear()
  const m0 = referencia.getMonth() + 1
  const ant = mesCivilAnterior(y0, m0)

  let aberturasAtual = 0
  let aberturasAnterior = 0
  let receitaConcluidaAtual = 0
  let receitaConcluidaAnterior = 0

  for (const o of ordens) {
    const da = parseDataAbertura(o)
    if (da) {
      const y = da.getFullYear()
      const m = da.getMonth() + 1
      if (y === y0 && m === m0) aberturasAtual += 1
      if (y === ant.y && m === ant.m) aberturasAnterior += 1
    }

    if (o.status === 'pronto') {
      const dc = parseDataConclusao(o)
      if (dc) {
        const y = dc.getFullYear()
        const m = dc.getMonth() + 1
        const v = o.valor ?? 0
        if (y === y0 && m === m0) receitaConcluidaAtual += v
        if (y === ant.y && m === ant.m) receitaConcluidaAnterior += v
      }
    }
  }

  return {
    labelMesAtual: labelMesPt(y0, m0),
    labelMesAnterior: labelMesPt(ant.y, ant.m),
    aberturasAtual,
    aberturasAnterior,
    receitaConcluidaAtual,
    receitaConcluidaAnterior,
    pctVariacaoAberturas: pctVariacao(aberturasAtual, aberturasAnterior),
    pctVariacaoReceita: pctVariacao(
      receitaConcluidaAtual,
      receitaConcluidaAnterior,
    ),
  }
}
