import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

type ApiErrorShape = {
  status?: number
  message?: string
  code?: string
}

const classifyError = (error: unknown) => {
  if (isRouteErrorResponse(error)) {
    return {
      title: 'Page not available',
      message:
        error.status === 404
          ? 'The page you requested could not be found.'
          : 'We could not load this page right now. Please try again.',
    }
  }

  const apiError = error as ApiErrorShape
  if (typeof apiError?.status === 'number' && typeof apiError?.message === 'string') {
    return {
      title: 'Request failed',
      message: apiError.message,
    }
  }

  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return {
      title: 'Network issue',
      message: 'We could not reach the server. Check your connection and try again.',
    }
  }

  return {
    title: 'Unexpected error',
    message: 'Something went wrong while loading this page.',
  }
}

const RouteError = () => {
  const error = useRouteError()
  const details = classifyError(error)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 space-y-3 text-center border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">{details.title}</h1>
        <p className="text-gray-700">{details.message}</p>
        <div className="flex flex-col sm:flex-row sm:justify-center gap-3 pt-2">
          <button
            type="button"
            className="px-4 py-2 rounded border border-gray-300 text-gray-800 hover:bg-gray-50"
            onClick={() => window.history.back()}
          >
            Go back
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  )
}

export default RouteError
