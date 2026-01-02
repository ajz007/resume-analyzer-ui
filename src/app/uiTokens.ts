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
}

export type UITokens = typeof ui
