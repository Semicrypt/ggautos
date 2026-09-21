"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiLock,
  FiMail,
  FiShield,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkExistingSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCheckingSession(false);
        return;
      }

      const {
        data: isAdmin,
        error: adminError,
      } = await supabase.rpc("is_admin");

      if (!adminError && isAdmin) {
        router.replace("/admin");
        return;
      }

      await supabase.auth.signOut();
      setCheckingSession(false);
    };

    checkExistingSession();
  }, [router]);

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const {
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const {
      data: isAdmin,
      error: adminError,
    } = await supabase.rpc("is_admin");

    if (adminError || !isAdmin) {
      await supabase.auth.signOut();

      setError(
        "This account is not authorized to access the admin portal.",
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

          <p className="text-sm text-[#8f7741]">
            Checking admin session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030303] text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[5%] h-[430px] w-[430px] rounded-full bg-[#d6a62b]/10 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#d6a62b]/10 blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,202,97,0.8) 1px, transparent 1px)",
            backgroundSize: "74px 74px",
          }}
        />
      </div>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[470px]">
          {/* BRAND */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-[#d6a62b]/40 bg-gradient-to-br from-[#171109] via-[#6d4c0b] to-[#d7a72c] text-[18px] font-black italic tracking-[-0.08em] text-[#fff2bd] shadow-[0_0_35px_rgba(214,166,43,0.18)]">
              BGG
            </div>

            <p className="mt-5 text-lg font-black tracking-[0.06em] text-white sm:text-xl">
              BLESSED GOD IS GREAT
            </p>

            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.15em] text-[#d6a62b] sm:text-[9px]">
              Motor Autos Int&apos;l Ventures
            </p>
          </div>

          {/* LOGIN CARD */}
          <div className="overflow-hidden rounded-[28px] border border-[#d6a62b]/18 bg-[#0b0906]/90 shadow-[0_35px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#d6a62b] to-transparent" />

            <div className="p-6 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d6a62b]/20 bg-[#d6a62b]/10 text-xl text-[#f2c857]">
                <FiShield />
              </div>

              <p className="mt-5 text-[9px] font-black uppercase tracking-[0.23em] text-[#d6a62b]">
                Administrator Access
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Welcome back.
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Sign in to manage Blessed God Is Great vehicle inventory,
                media and customer enquiries.
              </p>

              <form
                onSubmit={handleLogin}
                className="mt-7 space-y-5"
              >
                <div>
                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-[#9f874d]">
                    Email address
                  </label>

                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8f7741]" />

                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="admin@example.com"
                      className="w-full rounded-2xl border border-[#d6a62b]/15 bg-black/35 py-4 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-[#d6a62b]/50 focus:ring-2 focus:ring-[#d6a62b]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-[#9f874d]">
                    Password
                  </label>

                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8f7741]" />

                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-[#d6a62b]/15 bg-black/35 py-4 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-[#d6a62b]/50 focus:ring-2 focus:ring-[#d6a62b]/10"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-4 text-sm font-black text-[#080603] shadow-[0_15px_45px_rgba(214,166,43,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <FiArrowRight className="transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-[10px] leading-5 text-slate-600">
                Authorized Blessed God Is Great personnel only.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
