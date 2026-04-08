import { useAuth } from "@/context/AuthContext";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const { login, loading } = useAuth();

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
