import { STATUS_LABEL } from '../constants/ordemUi'
import type { OrdemServico } from '../types/ordem'
import * as F from '../utils/ordemForm'

type Props = {
  ordem: OrdemServico
  onClose: () => void
  onConfirm: () => void
  deleting?: boolean
}

export function DeleteOrdemConfirmModal({
  ordem,
  onClose,
  onConfirm,
  deleting = false,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget && !deleting) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-ordem-title"
        aria-describedby="delete-ordem-desc"
        className="my-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id="delete-ordem-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          Excluir esta ordem?
        </h2>
        <p
          id="delete-ordem-desc"
          className="mt-2 text-sm text-slate-600 dark:text-slate-400"
        >
          Esta ação não pode ser desfeita. A ordem e os arquivos vinculados (como
          fotos) serão removidos.
        </p>

        <dl className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/60">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">OS</dt>
            <dd className="font-semibold text-slate-900 dark:text-slate-100">
              #{ordem.id}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Cliente</dt>
            <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
              {ordem.cliente}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Placa</dt>
            <dd className="font-mono font-medium">
              {F.formatPlacaStored(ordem.placa)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium">{STATUS_LABEL[ordem.status]}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-xl border border-red-300 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-red-800 dark:hover:bg-red-700"
          >
            {deleting ? 'Excluindo…' : 'Excluir ordem'}
          </button>
        </div>
      </div>
    </div>
  )
}
