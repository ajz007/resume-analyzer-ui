import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  errorMessage?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: undefined,
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unexpected error occurred.'
    return { hasError: true, errorMessage: message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application error', error, info)
  }

  handleReload = () => window.location.reload()
  handleBack = () => window.history.back()

  render() {
    if (!this.state.hasError) return this.props.children

    const isDev = import.meta.env.DEV

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 space-y-4 text-center border border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="text-gray-700">
            An unexpected error occurred. Please try again or come back later.
          </p>
          {isDev && this.state.errorMessage && (
            <p className="text-sm text-gray-500">
              Hint: {this.state.errorMessage}
            </p>
          )}
          <div className="flex flex-col sm:flex-row sm:justify-center gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded border border-gray-300 text-gray-800 hover:bg-gray-50"
              onClick={this.handleBack}
            >
              Go back
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={this.handleReload}
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    )
  }
}
