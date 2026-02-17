import { useEffect } from 'react'
import { ui } from '../app/uiTokens'

type ShareModalProps = {
  open: boolean
  shareUrl: string
  isCopying: boolean
  errorMessage?: string
  onClose: () => void
  onCopy: () => void
}

const ShareModal = ({ open, shareUrl, isCopying, errorMessage, onClose, onCopy }: ShareModalProps) => {
  useEffect(() => {
    if (!open) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-label="Share report link">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Share report</h2>
            <p className={ui.results.text.meta}>Anyone with this link can view this report.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="share-url" className={ui.results.text.label}>
              Share URL
            </label>
            <input
              id="share-url"
              value={shareUrl}
              readOnly
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800"
            />
            {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className={ui.button.secondary}>
              Close
            </button>
            <button
              type="button"
              onClick={onCopy}
              disabled={!shareUrl || isCopying}
              className={ui.button.primary}
            >
              {isCopying ? 'Copying...' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
