import { useEffect } from 'react'

type Props = {
  message: string | null
  onDismiss: () => void
}

export function FlashToast({ message, onDismiss }: Props) {
  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(onDismiss, 3800)
    return () => window.clearTimeout(id)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-60 max-w-[min(90vw,24rem)] -translate-x-1/2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-900 shadow-lg shadow-emerald-900/10 dark:border-emerald-800/60 dark:bg-emerald-950/90 dark:text-emerald-100"
    >
      {message}
    </div>
  )
}
