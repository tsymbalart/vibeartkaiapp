import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiUrl } from "@/lib/api";

const IS_DEV = import.meta.env.DEV;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

async function loadGIS(): Promise<void> {
  if (window.google?.accounts?.id) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export default function Login() {
  const { setUser, devLogin } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [devLoading, setDevLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("auth_error");
  });
  const [gisReady, setGisReady] = useState(false);
  const [gisError, setGisError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch client ID from backend (avoids baking it into the build)
        const res = await fetch(apiUrl("/api/auth/config"), { credentials: "include" });
        if (!res.ok) throw new Error("Config fetch failed");
        const { googleClientId } = await res.json() as { googleClientId: string | null };
        if (!googleClientId) {
          setGisError("Google Sign-In is not configured. Ask an admin to set GOOGLE_CLIENT_ID.");
          return;
        }

        await loadGIS();
        if (cancelled) return;

        window.google!.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              const credRes = await fetch(apiUrl("/api/auth/google-credential"), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
              });
              if (credRes.status === 403) {
                setAuthError("not_authorized");
                return;
              }
              if (!credRes.ok) {
                setAuthError("sign_in_failed");
                return;
              }
              const data = await credRes.json() as { user: Parameters<typeof setUser>[0] };
              setUser(data.user);
            } catch {
              setAuthError("sign_in_failed");
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        setGisReady(true);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setGisError("Could not load Google Sign-In. Check your connection.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [setUser]);

  // Render the Google button once GIS is ready and the ref is mounted
  useEffect(() => {
    if (gisReady && googleBtnRef.current && window.google?.accounts?.id) {
      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 320,
      });
    }
  }, [gisReady]);

  const handleDevLogin = async () => {
    setDevLoading(true);
    await devLogin();
    setDevLoading(false);
  };

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
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-left space-y-1.5" role="alert">
            <p className="text-sm font-medium text-destructive">Access denied</p>
            <p className="text-xs text-destructive/80 leading-relaxed">
              This Google account isn't on the Artkai Pulse allowlist. Ask a director to
              invite your email, then try again.
            </p>
          </div>
        )}
        {authError === "invalid_invite" && (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-left space-y-1.5" role="alert">
            <p className="text-sm font-medium text-destructive">Invitation expired</p>
            <p className="text-xs text-destructive/80 leading-relaxed">
              The invitation link is invalid or expired. Ask a director for a fresh one.
            </p>
          </div>
        )}
        {authError === "sign_in_failed" && (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-left space-y-1.5" role="alert">
            <p className="text-sm font-medium text-destructive">Sign-in failed</p>
            <p className="text-xs text-destructive/80 leading-relaxed">
              Something went wrong. Please try again.
            </p>
          </div>
        )}
        {authError && !["not_authorized", "invalid_invite", "sign_in_failed"].includes(authError) && (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-left space-y-1.5" role="alert">
            <p className="text-sm font-medium text-destructive">Sign-in failed</p>
            <p className="text-xs text-destructive/80 leading-relaxed">
              Something went wrong ({authError}). Please try again.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {gisError ? (
            <p className="text-sm text-destructive">{gisError}</p>
          ) : (
            <div className="flex justify-center">
              <div
                ref={googleBtnRef}
                data-testid="button-google-signin"
                className="min-h-[44px] flex items-center justify-center"
              >
                {!gisReady && (
                  <div className="w-[320px] h-[44px] rounded-md bg-muted animate-pulse" />
                )}
              </div>
            </div>
          )}

          {IS_DEV && (
            <button
              onClick={handleDevLogin}
              disabled={devLoading}
              data-testid="button-dev-signin"
              className="w-full flex items-center justify-center gap-3 px-6 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium transition-all duration-200 hover:bg-muted/80 border border-border disabled:opacity-50"
            >
              {devLoading ? "Signing in…" : "Dev: Sign in as Art Tsymbal"}
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground/60">
          Sign in with your Artkai Google account to access your team's pulse check-ins
        </p>
      </div>
    </div>
  );
}
