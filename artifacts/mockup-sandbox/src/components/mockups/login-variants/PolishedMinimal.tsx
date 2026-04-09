function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export function PolishedMinimal() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "radial-gradient(ellipse 80% 70% at 50% 38%, #f5f6f8 0%, #e8eaee 100%)",
      }}
    >
      <div className="w-full max-w-xs flex flex-col items-center gap-9">

        {/* Brand block */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex items-center justify-center">
            <div
              className="absolute rounded-3xl"
              style={{
                width: 68, height: 68,
                background: "rgba(7,20,45,0.10)",
                filter: "blur(14px)",
                transform: "translateY(8px)",
              }}
            />
            <div
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-semibold text-white select-none"
              style={{ background: "#07142D" }}
            >
              A
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Artkai Pulse
            </h1>
            <p className="text-sm text-slate-500 text-center leading-snug">
              Team health check-ins and feedback
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 select-none tracking-wide uppercase" style={{ fontSize: 10 }}>sign in to continue</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Action block */}
        <div className="w-full flex flex-col gap-3">
          <button
            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-lg bg-white text-slate-700 text-sm font-medium transition-all"
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.04)",
            }}
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <button
            className="w-full flex items-center justify-center h-11 rounded-lg text-sm font-medium"
            style={{
              background: "rgba(0,0,0,0.04)",
              color: "#97A3BB",
              border: "1px solid rgba(0,0,0,0.07)",
            }}
          >
            Dev: Sign in as Art Tsymbal
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center leading-relaxed" style={{ color: "#97A3BB", maxWidth: 210 }}>
          Use your Artkai Google account to access your team's pulse
        </p>
      </div>
    </div>
  );
}
