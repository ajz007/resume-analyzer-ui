export const ui = {
  layout: {
    page: 'min-h-screen bg-gray-100',
    container: 'max-w-7xl mx-auto px-4',
    stack: 'space-y-4',
    header: 'flex items-start justify-between gap-4',
    gridMain: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
  },
  card: {
    base: 'bg-white border rounded-lg',
    elevated: 'bg-white border rounded-xl shadow-sm',
    padded: 'bg-white border rounded-lg p-4',
    paddedLg: 'bg-white border rounded-xl p-6 shadow-sm space-y-4',
    form: 'w-full bg-white border rounded-lg p-5 shadow-md space-y-4',
    list: 'bg-white border rounded-lg',
  },
  text: {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    h3: 'text-2xl font-bold',
    subtitle: 'text-sm text-gray-600',
    body: 'text-sm text-gray-700',
    label: 'block mb-2 font-semibold',
    smallMuted: 'text-sm text-gray-600',
    smallLight: 'text-sm text-gray-300',
  },
  input: {
    textarea: 'w-full p-2 border rounded',
    helper: 'text-sm text-gray-600',
    dropzone: 'w-full border-2 border-dashed rounded p-4 text-center cursor-pointer',
    dropzoneActive: 'border-blue-500 bg-blue-50',
  },
  button: {
    primary: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50',
    secondary:
      'border border-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50',
    pill: 'inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold text-gray-800',
  },
  nav: {
    header: 'bg-white border-b sticky top-0 z-10',
    linkBase: 'px-3 py-2 rounded',
    linkActive: 'text-blue-700 bg-blue-50 font-semibold',
    linkInactive: 'text-gray-700 hover:bg-gray-100',
    footerWrap: 'flex items-center gap-2 text-sm text-gray-600',
    footerLink: 'hover:underline hover:text-gray-900',
  },
  badge: {
    score: 'inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold text-gray-800',
    usageUnavailable:
      'inline-flex items-center gap-2 px-2 py-1 rounded border text-xs text-gray-600 bg-white whitespace-nowrap leading-none',
  },
  results: {
    page: {
      container: 'p-6 space-y-8 text-[16px] leading-[1.7] text-gray-900',
      headerTitle: 'text-[28px] font-semibold tracking-tight text-gray-900',
      headerMeta: 'text-[14px] text-gray-500',
      jumpLinks: 'text-[14px] text-blue-600 underline underline-offset-2 hover:text-blue-700',
    },
    card: {
      base: 'bg-white border border-gray-200 rounded-lg p-5',
      emphasis: 'bg-slate-50 border border-slate-200 rounded-lg p-5',
      muted: 'bg-gray-50 border border-gray-200 rounded-lg p-5',
    },
    section: {
      title: 'text-[20px] font-semibold text-gray-900',
      subtitle: 'text-[15px] text-gray-700',
      helper: 'text-[14px] text-gray-500',
    },
    text: {
      body: 'text-[16px] text-gray-900',
      secondary: 'text-[15px] text-gray-700',
      meta: 'text-[14px] text-gray-500',
      label: 'text-[13px] font-medium text-gray-600',
    },
    link: 'text-blue-600 underline underline-offset-2 hover:text-blue-700',
    button: {
      primary:
        'inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700',
      ghost:
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-blue-600 hover:bg-blue-50 font-medium',
    },
    score: {
      primary: 'text-4xl font-semibold text-blue-600',
      secondary: 'text-[15px] text-gray-700',
      pill:
        'text-[14px] font-medium px-3 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200',
    },
    chip: {
      base: 'text-[13px] font-medium px-2 py-1 rounded-full border',
      critical: 'bg-rose-50 text-rose-700 border-rose-200',
      warning: 'bg-amber-50 text-amber-800 border-amber-200',
      ok: 'bg-green-50 text-green-700 border-green-200',
      info: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    list: {
      bullets: 'list-disc list-inside space-y-1 text-[16px] text-gray-900 leading-relaxed',
      bulletsSecondary:
        'list-disc list-inside space-y-1 text-[15px] text-gray-700 leading-relaxed',
    },
  },
}

export type UITokens = typeof ui
