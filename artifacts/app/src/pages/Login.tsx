import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const { login, loading } = useAuth();

  const authError = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("auth_error");
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-medium text-2xl shadow-lg shadow-primary/20">
            A
          </div>
          <h1 className="text-2xl font-medium text-foreground tracking-tight">
            Artkai Pulse
          </h1>
          <p className="text-muted-foreground text-sm">
            Team health check-ins and feedback
          </p>
        </div>

        {authError === "not_authorized" && (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-left space-y-1.5">
            <p className="text-sm font-medium text-destructive">Access denied</p>
            <p className="text-xs text-destructive/80 leading-relaxed">
              This Google account isn't on the Artkai Pulse allowlist and has no pending
              invitation. Ask a director to invite your email, then try again.
            </p>
          </div>
        )}
        {authError === "invalid_invite" && (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-left space-y-1.5">
            <p className="text-sm font-medium text-destructive">Invitation expired</p>
            <p className="text-xs text-destructive/80 leading-relaxed">
              The invitation link is invalid, already used, or expired. Ask a director
              to send you a fresh invitation.
            </p>
          </div>
        )}

        <button
          onClick={() => login("/")}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white text-gray-700 font-medium transition-all duration-200 hover:bg-gray-50 disabled:opacity-50 shadow-lg border border-gray-200"
        >
          <FcGoogle className="w-5 h-5" />
          {loading ? "Loading…" : "Sign in with Google"}
        </button>

        <p className="text-xs text-muted-foreground/60">
          Sign in with your Google account to access your team's pulse check-ins
        </p>
      </div>
    </div>
  );
}
