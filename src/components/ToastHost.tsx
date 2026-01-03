import { useEffect, useMemo } from 'react'
import { useToastStore, type Toast } from '../store/useToastStore'

const iconByType: Record<Toast['type'], string> = {
  success: '✅',
  info: 'ℹ️',
  error: '⚠️',
}

const barColorByType: Record<Toast['type'], string> = {
  success: 'border-green-500',
  info: 'border-blue-500',
  error: 'border-amber-500',
}

const ToastItem = ({ toast }: { toast: Toast }) => {
  const dismissToast = useToastStore((state) => state.dismissToast)

  useEffect(() => {
    const timeout = window.setTimeout(() => dismissToast(toast.id), toast.ttlMs)
    return () => window.clearTimeout(timeout)
  }, [dismissToast, toast.id, toast.ttlMs])

  return (
    <div
      className={`w-full bg-white border shadow-md rounded-lg px-4 py-3 flex gap-3 items-start ${barColorByType[toast.type]} border-l-4 transition`}
    >
      <div className="text-xl leading-none pt-0.5" aria-hidden>
        {iconByType[toast.type]}
      </div>
      <div className="flex-1 text-left">
        {toast.title && <div className="font-semibold text-gray-900 text-sm">{toast.title}</div>}
        <div className="text-sm text-gray-800">{toast.message}</div>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        onClick={() => dismissToast(toast.id)}
      >
        ×
      </button>
    </div>
  )
}

const ToastHost = () => {
  const toasts = useToastStore((state) => state.toasts)

  const visible = useMemo(
    () => [...toasts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3),
    [toasts],
  )

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm space-y-3 md:left-auto md:right-4 md:translate-x-0 md:w-96 z-50">
      {visible.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

export default ToastHost
