import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ui } from '../../app/uiTokens'
import { downloadResumeDocx, fetchResumes, type ResumeListItem } from '../../api/resumes'
import AppPageMetadata from '../../components/seo/AppPageMetadata'
import { useToastStore } from '../../store/useToastStore'

export const ResumeListView = ({
  resumes,
  loading,
  downloadingId,
  onNew,
  onOpen,
  onDownload,
}: {
  resumes: ResumeListItem[]
  loading: boolean
  downloadingId?: string
  onNew: () => void
  onOpen: (id: string) => void
  onDownload: (resume: ResumeListItem) => void
}) => (
  <div className="space-y-5 p-6">
    <div className={ui.layout.header}>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-blue-700">Resume Workspace</p>
        <h1 className={ui.text.h2}>Resumes</h1>
        <p className={ui.text.subtitle}>View structured resumes, open a workspace, or download DOCX.</p>
      </div>
      <button type="button" className={ui.button.primary} onClick={onNew}>
        New resume
      </button>
    </div>

    {loading ? (
      <div className={`${ui.card.base} p-8 text-center text-gray-700`}>Loading resumes...</div>
    ) : resumes.length === 0 ? (
      <div className={`${ui.card.base} p-8 text-center space-y-3`}>
        <h2 className="text-xl font-bold text-gray-900">No resumes yet</h2>
        <p className={ui.text.subtitle}>Generate ATS-friendly resume content from notes or start blank.</p>
        <button type="button" className={ui.button.primary} onClick={onNew}>
          Generate ATS-friendly resume
        </button>
      </div>
    ) : (
      <div className={ui.card.list}>
        {resumes.map((resume, idx) => (
          <div
            key={resume.id}
            className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${
              idx !== resumes.length - 1 ? 'border-b' : ''
            }`}
          >
            <div className="min-w-0 space-y-1">
              <h2 className="truncate text-base font-semibold text-gray-900">{resume.title}</h2>
              <p className="text-sm text-gray-600">Updated {new Date(resume.updatedAt).toLocaleString()}</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800">
                  {resume.status}
                </span>
                {resume.originType ? (
                  <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                    {resume.originType}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={ui.button.secondary} onClick={() => onOpen(resume.id)}>
                Open
              </button>
              <button
                type="button"
                className={ui.button.secondary}
                onClick={() => onDownload(resume)}
                disabled={downloadingId === resume.id}
              >
                {downloadingId === resume.id ? 'Preparing...' : 'Download DOCX'}
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const ResumeListPage = () => {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const items = await fetchResumes()
        if (!cancelled) setResumes(items)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load resumes.'
        if (!cancelled) showToast({ type: 'error', title: 'Could not load resumes', message })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [showToast])

  const sorted = useMemo(
    () => [...resumes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [resumes],
  )

  const handleDownload = async (resume: ResumeListItem) => {
    setDownloadingId(resume.id)
    try {
      await downloadResumeDocx(resume.id, resume.title)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not download DOCX.'
      showToast({ type: 'error', title: 'Download failed', message })
    } finally {
      setDownloadingId(undefined)
    }
  }

  return (
    <>
      <AppPageMetadata title="My Resumes | Rethink Resume" description="View and manage your saved resumes." />
      <ResumeListView
        resumes={sorted}
        loading={loading}
        downloadingId={downloadingId}
        onNew={() => navigate('/app/resumes/new')}
        onOpen={(id) => navigate(`/app/resumes/${id}`)}
        onDownload={(resume) => void handleDownload(resume)}
      />
    </>
  )
}

export default ResumeListPage
