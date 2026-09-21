"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const checkExistingSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: isAdmin } =
          await supabase.rpc("is_admin");

        if (isAdmin) {
          router.replace("/admin");
          return;
        }
      }

      setCheckingSession(false);
    };

    checkExistingSession();
  }, [router]);

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const {
      data,
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(
        loginError.message ||
          "Unable to sign in."
      );

      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Unable to authenticate user.");
      setLoading(false);
      return;
    }

    const {
      data: isAdmin,
      error: adminError,
    } = await supabase.rpc("is_admin");

    if (adminError) {
      await supabase.auth.signOut();

      setError(
        "Unable to verify administrator access."
      );

      setLoading(false);
      return;
    }

    if (!isAdmin) {
      await supabase.auth.signOut();

      setError(
        "This account does not have administrator access."
      );

      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030303] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d6a62b]/30 border-t-[#f2c857]" />

          <p className="text-sm text-[#9c8755]">
            Checking administrator session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030303] px-4 py-10 text-white">
      {/* GOLD BACKGROUND GLOWS */}

      <div className="pointer-events-none absolute left-[-120px] top-[10%] h-[400px] w-[400px] rounded-full bg-[#d6a62b]/10 blur-[130px]" />

      <div className="pointer-events-none absolute bottom-[-160px] right-[-100px] h-[500px] w-[500px] rounded-full bg-[#ffb000]/10 blur-[150px]" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,193,55,0.7) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* LOGIN BOX */}

      <section className="relative z-10 w-full max-w-[470px]">
        {/* BRAND */}

        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[#d6a62b]/40 bg-gradient-to-br from-[#171109] via-[#6d4c0b] to-[#d7a72c] shadow-[0_0_35px_rgba(214,166,43,0.2)]">
              <span className="relative z-10 text-xl font-black italic text-[#fff2bd]">
                GZ
              </span>

              <div className="absolute bottom-2 left-1/2 h-[2px] w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#ffe08a] to-transparent" />
            </div>

            <div>
              <h1 className="text-lg font-black tracking-[0.08em]">
                GREAT ZUBY
              </h1>

              <p className="mt-1 text-[8px] font-bold tracking-[0.25em] text-[#d6a62b]">
                AUTO & LOGISTICS LTD.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[30px] border border-[#d6a62b]/20 bg-[#0a0906]/85 shadow-[0_35px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          {/* GOLD TOP LINE */}

          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d6a62b] to-transparent" />

          <div className="p-7 sm:p-9">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#d6a62b]">
                Administrator Access
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Welcome back.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Sign in to manage Great Zuby vehicle
                inventory, photos, videos and vehicle
                availability.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="mt-8"
            >
              {/* EMAIL */}

              <label
                htmlFor="email"
                className="text-[10px] font-black uppercase tracking-[0.18em] text-[#aa9255]"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="admin@greatzubyauto.com"
                className="mt-2 w-full rounded-2xl border border-[#d6a62b]/15 bg-black/40 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#d6a62b]/60 focus:ring-2 focus:ring-[#d6a62b]/10"
              />

              {/* PASSWORD */}

              <label
                htmlFor="password"
                className="mt-5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#aa9255]"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                className="mt-2 w-full rounded-2xl border border-[#d6a62b]/15 bg-black/40 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#d6a62b]/60 focus:ring-2 focus:ring-[#d6a62b]/10"
              />

              {/* ERROR */}

              {error && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
                  {error}
                </div>
              )}

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="mt-7 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-5 py-4 text-sm font-black text-[#080603] shadow-[0_15px_45px_rgba(214,166,43,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing in..."
                  : "Sign In to Dashboard"}
              </button>
            </form>

            <p className="mt-7 text-center text-[10px] leading-5 text-slate-600">
              Authorized Great Zuby personnel only.
            </p>
          </div>
        </div>

        {/* RETURN */}

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs font-bold text-[#b99b53] transition hover:text-[#f2c857]"
          >
            ← Return to Great Zuby website
          </a>
        </div>
      </section>
    </main>
  );
}