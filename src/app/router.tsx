import { createBrowserRouter, Navigate } from 'react-router-dom'
import HomePage from '../pages/marketing/HomePage'
import AnalyzerPage from '../pages/AnalyzerPage'
import HistoryPage from '../pages/HistoryPage'
import ResultsPage from '../pages/ResultsPage'
import PricingPage from '../pages/PricingPage'
import PrivacyPage from '../pages/PrivacyPage'
import TermsPage from '../pages/TermsPage'
import SharedReportPage from '../pages/SharedReportPage'
import AtsResumeCheckerPage from '../pages/AtsResumeCheckerPage'
import AiResumeBuilderPage from '../pages/AiResumeBuilderPage'
import AppShell from '../components/layout/AppShell'
import RouteError from '../components/RouteError'

export const router = createBrowserRouter([
  {
    path: '/app/share/:token',
    element: <SharedReportPage />,
    errorElement: <RouteError />,
  },
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        element: <HomePage />,
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
        path: 'ats-resume-checker',
        element: <AtsResumeCheckerPage />,
      },
      {
        path: 'ai-resume-builder',
        element: <AiResumeBuilderPage />,
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
