import { useAuth } from "@/context/AuthContext";
import { BiSolidGroup } from "react-icons/bi";

export default function Onboarding() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-medium mx-auto">
          A
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-medium tracking-tight">Welcome to Artkai Pulse</h1>
          <p className="text-muted-foreground">
            Hi {user?.name || "there"}! You don't belong to a team yet.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <BiSolidGroup className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Waiting for a team invitation</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ask your team lead or director to send you an invitation. Once they invite you using your email address, refresh this page to get started.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Refresh
          </button>
        </div>

        <button
          onClick={logout}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
