import type { ResumePreview } from '../../api/tailoredResumes'

export default function TailoredResumePreview({ preview }: { preview: ResumePreview }) {
  const content = preview.blocks ?? preview.text.split(/\r?\n/).filter(Boolean).map((text) => ({ kind: 'paragraph', text }))
  return (
    <div className="mt-3 max-h-[60vh] overflow-auto rounded border border-slate-200 bg-white px-4 py-5 text-sm leading-relaxed text-slate-800 sm:px-7">
      {content.map(({ kind, text }, index) => {
        if (kind === 'title') {
          return <p key={index} className="mb-2 break-words text-xl font-semibold text-slate-950">{text}</p>
        }
        if (kind === 'heading') {
          return <h3 key={index} className="mb-2 mt-5 border-b border-slate-200 pb-1 font-semibold text-slate-950">{text}</h3>
        }
        if (kind === 'bullet') {
          if (content[index - 1]?.kind === 'bullet') return null
          let end = index + 1
          while (content[end]?.kind === 'bullet') end++
          return (
            <ul key={index} className="my-2 list-disc space-y-1 pl-5">
              {content.slice(index, end).map((bullet, offset) => <li key={offset} className="break-words">{bullet.text}</li>)}
            </ul>
          )
        }
        return <p key={index} className="mb-2 break-words">{text}</p>
      })}
    </div>
  )
}
