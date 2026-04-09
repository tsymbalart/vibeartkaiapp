import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import CheckInFlow from "@/pages/CheckIn";
import MyJourney from "@/pages/MyJourney";
import TeamInsights from "@/pages/TeamInsights";
import PulseSetup from "@/pages/PulseSetup";
import PulseFeedback from "@/pages/PulseFeedback";
import MyFeedback from "@/pages/MyFeedback";
import Kudos from "@/pages/Kudos";
import Settings from "@/pages/Settings";
import OneOnOnes from "@/pages/OneOnOnes";
import OneOnOneMember from "@/pages/OneOnOneMember";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import DesignTeam from "@/pages/DesignTeam";
import DesignTeamMember from "@/pages/DesignTeamMember";
import OperationalTasks from "@/pages/OperationalTasks";
import NotFound from "@/pages/not-found";
import { RequireRole } from "@/components/layout/RequireRole";

const LEAD_ROLES = ["lead", "director"] as const;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
          <span className="text-primary font-medium text-lg">A</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!user.teamId) {
    return <Onboarding />;
  }

  return <>{children}</>;
}

function LeadOnly({ children }: { children: React.ReactNode }) {
  return <RequireRole roles={[...LEAD_ROLES]}>{children}</RequireRole>;
}

function AppRoutes() {
  return (
    <Switch>
      {/* Everyone (members included) — pulse check-ins and personal data. */}
      <Route path="/" component={Dashboard} />
      <Route path="/check-in" component={CheckInFlow} />
      <Route path="/my-journey" component={MyJourney} />
      <Route path="/my-feedback" component={MyFeedback} />
      <Route path="/kudos" component={Kudos} />

      {/* Lead / director only — team aggregates and design-ops tools. */}
      <Route path="/team-insights">
        <LeadOnly><TeamInsights /></LeadOnly>
      </Route>
      <Route path="/pulse-feedback">
        <LeadOnly><PulseFeedback /></LeadOnly>
      </Route>
      <Route path="/pulse-setup">
        <LeadOnly><PulseSetup /></LeadOnly>
      </Route>
      <Route path="/settings">
        <LeadOnly><Settings /></LeadOnly>
      </Route>
      <Route path="/one-on-ones/:memberId">
        <LeadOnly><OneOnOneMember /></LeadOnly>
      </Route>
      <Route path="/one-on-ones">
        <LeadOnly><OneOnOnes /></LeadOnly>
      </Route>
      <Route path="/projects/:id">
        <LeadOnly><ProjectDetail /></LeadOnly>
      </Route>
      <Route path="/projects">
        <LeadOnly><Projects /></LeadOnly>
      </Route>
      <Route path="/design-team/:userId">
        <LeadOnly><DesignTeamMember /></LeadOnly>
      </Route>
      <Route path="/design-team">
        <LeadOnly><DesignTeam /></LeadOnly>
      </Route>
      <Route path="/operational-tasks">
        <LeadOnly><OperationalTasks /></LeadOnly>
      </Route>

      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AuthGate>
                <AppRoutes />
              </AuthGate>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
