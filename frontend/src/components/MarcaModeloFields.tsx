import { useEffect, useId, useRef, useState } from 'react'
import {
  filterMarcas,
  filterModelos,
  findMarcaKey,
} from '../data/veiculos-brasil'

function titleCaseWords(s: string) {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none ring-slate-400/30 focus:ring-2 dark:border-slate-700 dark:bg-slate-950'
/** Ancorada ao input (top-full), não ao bloco inteiro com o label */
const listClass =
  'absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900'

type Props = {
  marca: string
  modelo: string
  onMarcaChange: (v: string) => void
  onModeloChange: (v: string) => void
}

export function MarcaModeloFields({
  marca,
  modelo,
  onMarcaChange,
  onModeloChange,
}: Props) {
  const idBase = useId()
  const [openMarca, setOpenMarca] = useState(false)
  const [openModelo, setOpenModelo] = useState(false)
  const [marcaCatalogKey, setMarcaCatalogKey] = useState<string | null>(null)

  const wrapMarca = useRef<HTMLDivElement>(null)
  const wrapModelo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (wrapMarca.current && !wrapMarca.current.contains(t))
        setOpenMarca(false)
      if (wrapModelo.current && !wrapModelo.current.contains(t))
        setOpenModelo(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!marca.trim()) {
      setMarcaCatalogKey(null)
      return
    }
    setMarcaCatalogKey(findMarcaKey(titleCaseWords(marca)))
  }, [marca])

  const sugestoesMarca = filterMarcas(marca)
  const sugestoesModelo = marcaCatalogKey
    ? filterModelos(marcaCatalogKey, modelo)
    : []

  function handleMarcaChange(v: string) {
    if (!v.trim()) {
      setMarcaCatalogKey(null)
      onModeloChange('')
    }
    onMarcaChange(v)
  }

  function handleMarcaBlur() {
    const fmt = titleCaseWords(marca)
    onMarcaChange(fmt)
    const k = findMarcaKey(fmt)
    if (k !== marcaCatalogKey) {
      if (marcaCatalogKey !== null && (k === null || k !== marcaCatalogKey)) {
        onModeloChange('')
      }
      setMarcaCatalogKey(k)
    }
    setOpenMarca(false)
  }

  function escolherMarca(m: string) {
    if (marcaCatalogKey !== null && marcaCatalogKey !== m) onModeloChange('')
    onMarcaChange(m)
    setMarcaCatalogKey(m)
    setOpenMarca(false)
  }

  const modeloBloqueado = !marca.trim()

  return (
    <>
      <div ref={wrapMarca} className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Marca
        </span>
        <div className="relative">
          <input
            id={`${idBase}-marca`}
            required
            autoComplete="off"
            role="combobox"
            aria-expanded={openMarca}
            aria-controls={`${idBase}-marca-list`}
            aria-autocomplete="list"
            className={`${inputClass} relative z-10`}
            value={marca}
            onChange={(e) => handleMarcaChange(e.target.value)}
            onFocus={() => setOpenMarca(true)}
            onBlur={handleMarcaBlur}
            placeholder="Busque ou selecione a marca"
          />
          {openMarca && sugestoesMarca.length > 0 && (
            <ul
              id={`${idBase}-marca-list`}
              role="listbox"
              className={listClass}
            >
              {sugestoesMarca.map((m) => (
                <li key={m} role="presentation">
                  <button
                    type="button"
                    role="option"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => escolherMarca(m)}
                  >
                    {m}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div ref={wrapModelo} className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Modelo
        </span>
        <div className="relative">
          <input
            id={`${idBase}-modelo`}
            required
            readOnly={modeloBloqueado}
            autoComplete="off"
            role="combobox"
            aria-expanded={openModelo && !modeloBloqueado}
            aria-controls={`${idBase}-modelo-list`}
            aria-readonly={modeloBloqueado}
            className={`${inputClass} relative z-10 ${modeloBloqueado ? 'cursor-not-allowed bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : ''}`}
            value={modelo}
            onChange={(e) => {
              if (modeloBloqueado) return
              onModeloChange(e.target.value)
            }}
            onFocus={() => {
              if (!modeloBloqueado) setOpenModelo(true)
            }}
            onBlur={() => {
              onModeloChange(titleCaseWords(modelo))
              setOpenModelo(false)
            }}
            placeholder={
              modeloBloqueado
                ? 'Primeiro informe a marca'
                : marcaCatalogKey
                  ? 'Busque o modelo desta marca'
                  : 'Marca fora do catálogo — digite o modelo livremente'
            }
          />
          {openModelo && !modeloBloqueado && sugestoesModelo.length > 0 && (
            <ul
              id={`${idBase}-modelo-list`}
              role="listbox"
              className={listClass}
            >
              {sugestoesModelo.map((mo) => (
                <li key={mo} role="presentation">
                  <button
                    type="button"
                    role="option"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onModeloChange(mo)
                      setOpenModelo(false)
                    }}
                  >
                    {mo}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
