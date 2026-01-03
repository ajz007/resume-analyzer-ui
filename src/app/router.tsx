import { createBrowserRouter, Navigate } from 'react-router-dom'
import AnalyzerPage from '../pages/AnalyzerPage'
import HistoryPage from '../pages/HistoryPage'
import ResultsPage from '../pages/ResultsPage'
import PricingPage from '../pages/PricingPage'
import PrivacyPage from '../pages/PrivacyPage'
import TermsPage from '../pages/TermsPage'
import AppShell from '../components/layout/AppShell'
import RouteError from '../components/RouteError'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        element: <Navigate to="/app/analyzer" replace />,
      },
      {
        path: 'app',
        children: [
          {
            index: true,
            element: <Navigate to="/app/analyzer" replace />,
          },
          {
            path: 'analyzer',
            element: <AnalyzerPage />,
          },
          {
            path: 'results/:analysisId',
            element: <ResultsPage />,
          },
          {
            path: 'history',
            element: <HistoryPage />,
          },
        ],
      },
      {
        path: 'pricing',
        element: <PricingPage />,
      },
      {
        path: 'privacy',
        element: <PrivacyPage />,
      },
      {
        path: 'terms',
        element: <TermsPage />,
      },
    ],
  },
])
