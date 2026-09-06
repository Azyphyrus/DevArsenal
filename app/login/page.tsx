'use client';

import { useEffect, useState } from "react";

/**
 * Google sign-in page. The middleware redirects unauthenticated visitors of
 * /Dashboard here. On success the OAuth callback points back to /Dashboard.
 */
export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("error");
    if (raw) {
      // Error messages from the callback can be long URLs; show the short form.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(raw.length > 120 ? `${decodeURIComponent(raw).slice(0, 120)}…` : decodeURIComponent(raw));
    }
  }, []);

  const startGoogleLogin = () => {
    window.location.href = "/api/auth/login/google";
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-10 space-y-8 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-linear-to-br from-[#00d9ff] to-[#00ff88] flex items-center justify-center text-2xl font-bold text-[#1a1a1a]">
              DT
            </div>
            <h1 className="text-2xl font-bold">Welcome to DevToolbox</h1>
            <p className="text-[#aaaaaa] text-sm">
              Sign in with Google to sync your snippets, notes, and tasks across all your devices.
            </p>
          </div>

          {error && (
            <div className="bg-[#3a1f1f] border border-[#6b1c1c] rounded-lg px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={startGoogleLogin}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-[#333333] bg-[#252525] hover:bg-[#2e2e2e] hover:border-[#00d9ff] transition-colors font-medium"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.6 29.3 4.3 24 4.3 13 4.3 4.3 13 4.3 24S13 43.7 24 43.7 43.7 35 43.7 24c0-1.3-.1-2.6-.1-3.9z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.6 29.3 4.3 24 4.3 13.7 4.3 6.6 9.6 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 43.7c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-1.9 1.5-4.3 2.4-7.2 2.4-4.9 0-9.1-3.1-10.7-7.5l-6.2 4.8c3.1 6 9.3 10.7 16.9 10.7z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.9l6.2 5.2c-.4.4 6.6-4.8 6.6-14.9 0-1.3-.1-2.6-.1-3.9z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-center text-[#666666]">
            Your data syncs automatically every few seconds while signed in.
          </p>
        </div>
      </div>
    </div>
  );
}