import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/common/LoadingState";

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const LearningPage = lazy(() => import("@/features/learning/LearningPage"));
const ListeningPage = lazy(() => import("@/features/listening/ListeningPage"));
const QuizPage = lazy(() => import("@/features/quiz/QuizPage"));
const ReviewPage = lazy(() => import("@/features/review/ReviewPage"));
const InterviewPage = lazy(() => import("@/features/interview/InterviewPage"));
const ProgressPage = lazy(() => import("@/features/achievements/ProgressPage"));
const SourcesPage = lazy(() => import("@/features/sources/SourcesPage"));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));
const NotFoundPage = lazy(() => import("@/features/dashboard/NotFoundPage"));

export function AppRouter() {
  return (
    <HashRouter>
      <AppShell>
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/learn" element={<LearningPage />} />
            <Route path="/listen" element={<ListeningPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </HashRouter>
  );
}
