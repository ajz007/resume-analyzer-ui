import { createBrowserRouter, Navigate } from 'react-router-dom'
import WorkspaceHomePage from '../pages/WorkspaceHomePage'
import HomePage from '../pages/marketing/HomePage'
import AnalyzerPage from '../pages/AnalyzerPage'
import HistoryPage from '../pages/HistoryPage'
import ResultsPage from '../pages/ResultsPage'
import PricingPage from '../pages/PricingPage'
import PrivacyPage from '../pages/PrivacyPage'
import TermsPage from '../pages/TermsPage'
import RefundPage from '../pages/RefundPage'
import DeliveryPage from '../pages/DeliveryPage'
import ContactPage from '../pages/ContactPage'
import SharedReportPage from '../pages/SharedReportPage'
import AtsResumeCheckerPage from '../pages/AtsResumeCheckerPage'
import AiResumeBuilderPage from '../pages/AiResumeBuilderPage'
import ResumeListPage from '../pages/resumes/ResumeListPage'
import NewResumePage from '../pages/resumes/NewResumePage'
import ResumeWorkspacePage from '../pages/resumes/ResumeWorkspacePage'
import TailorResumePage from '../pages/resumes/TailorResumePage'
import AppShell from '../components/layout/AppShell'
import RouteError from '../components/RouteError'
import RequireLogin from '../components/auth/RequireLogin'

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
            element: <Navigate to="/app/home" replace />,
          },
          {
            path: 'home',
            element: <WorkspaceHomePage />,
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
          {
            element: <RequireLogin />,
            children: [
              {
                path: 'resumes',
                element: <ResumeListPage />,
              },
              {
                path: 'resumes/new',
                element: <NewResumePage />,
              },
              {
                path: 'resumes/:id',
                element: <ResumeWorkspacePage />,
              },
              {
                path: 'resumes/:id/tailor',
                element: <TailorResumePage />,
              },
            ],
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
      {
        path: 'refund',
        element: <RefundPage />,
      },
      {
        path: 'delivery',
        element: <DeliveryPage />,
      },
      {
        path: 'contact',
        element: <ContactPage />,
      },
    ],
  },
])
