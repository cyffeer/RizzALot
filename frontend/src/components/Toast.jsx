import { useEffect } from 'react'

export default function ToastContainer({ toasts = [], onClose }) {
  // Auto-dismiss
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => onClose?.(t.id), t.duration || 4000))
    return () => timers.forEach(clearTimeout)
  }, [toasts, onClose])

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[60] flex w-80 max-w-[90vw] flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto overflow-hidden rounded-xl border border-gray-200/80 bg-white/95 shadow-lg backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/95">
          <div className="flex items-start gap-3 p-3">
            <div className="mt-0.5 text-xl">{t.icon || '🔔'}</div>
            <div className="min-w-0 flex-1">
              {t.title ? <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{t.title}</div> : null}
              {t.body ? <div className="truncate text-sm text-gray-700 dark:text-gray-300">{t.body}</div> : null}
              {t.action ? (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary px-3 py-1 text-xs"
                    onClick={() => { t.onAction?.(); onClose?.(t.id) }}
                  >
                    {t.action}
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              onClick={() => onClose?.(t.id)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
