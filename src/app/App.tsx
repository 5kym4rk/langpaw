import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { DynamicBackground } from "@/components/layout/DynamicBackground";
import { MusicManager } from "@/components/layout/MusicManager";
import { PwaUpdatePrompt } from "@/components/layout/PwaUpdatePrompt";
import { Onboarding } from "@/components/layout/Onboarding";
import { AppRouter } from "./AppRouter";

export function App() {
  return (
    <ErrorBoundary>
      <DynamicBackground />
      <MusicManager />
      <AppRouter />
      <Onboarding />
      <PwaUpdatePrompt />
    </ErrorBoundary>
  );
}
