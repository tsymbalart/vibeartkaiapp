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

export function AtmosphericCard() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "#07142D" }}
    >
      {/* Soft center glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 42%, rgba(80,120,220,0.13) 0%, transparent 70%)",
        }}
      />
      {/* Bottom-right warm tint */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400, height: 400,
          bottom: -80, right: -80,
          background: "radial-gradient(circle, rgba(46,125,50,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-xs rounded-2xl flex flex-col items-center gap-8 p-8"
        style={{
          background: "rgba(255,255,255,0.055)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        {/* Brand block */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex items-center justify-center">
            {/* Outer halo ring */}
            <div
              className="absolute"
              style={{
                inset: -7,
                borderRadius: 23,
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            />
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-semibold text-white select-none"
              style={{
                background: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.16)",
              }}
            >
              A
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Artkai Pulse
            </h1>
            <p className="text-sm text-center leading-snug" style={{ color: "rgba(255,255,255,0.42)" }}>
              Team health check-ins and feedback
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.94)",
              color: "#1c2840",
              boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
            }}
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <button
            className="w-full flex items-center justify-center h-11 rounded-lg text-sm font-medium"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            Dev: Sign in as Art Tsymbal
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.25)", maxWidth: 200 }}>
          Use your Artkai Google account to access your team's pulse
        </p>
      </div>
    </div>
  );
}
