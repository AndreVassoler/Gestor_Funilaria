import type { OrdemServico } from '../types/ordem'
import { STATUS_LABEL } from '../constants/ordemUi'
import { formatDateBR } from './ordemForm'

function csvCell(s: string): string {
  const t = s.replace(/"/g, '""')
  if (/[;\r\n"]/.test(t)) return `"${t}"`
  return t
}

export function ordensToCsvSemicolon(ordens: OrdemServico[]): string {
  const headers = [
    'id',
    'cliente',
    'contato',
    'marca',
    'modelo',
    'ano',
    'placa',
    'status',
    'valor',
    'data_abertura',
    'previsao_entrega',
    'data_conclusao',
    'descricao',
  ]
  const lines = [headers.join(';')]
  for (const o of ordens) {
    const row = [
      String(o.id),
      o.cliente ?? '',
      o.contato ?? '',
      o.marca ?? '',
      o.modelo ?? '',
      String(o.ano ?? ''),
      o.placa ?? '',
      STATUS_LABEL[o.status] ?? o.status,
      String(o.valor ?? 0).replace('.', ','),
      o.dataAbertura ? formatDateBR(o.dataAbertura) : '',
      o.previsaoEntrega ? formatDateBR(o.previsaoEntrega) : '',
      o.dataConclusao ? formatDateBR(o.dataConclusao) : '',
      o.descricao ?? '',
    ].map(csvCell)
    lines.push(row.join(';'))
  }
  return '\uFEFF' + lines.join('\r\n')
}

export function downloadTextFile(
  content: string,
  filename: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
