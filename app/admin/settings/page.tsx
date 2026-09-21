"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiSave,
  FiShield,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";

export default function AdminSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [currentEmail, setCurrentEmail] =
    useState("");

  const [newEmail, setNewEmail] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    changingEmail,
    setChangingEmail,
  ] = useState(false);

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);

  const [emailError, setEmailError] =
    useState("");

  const [
    emailSuccess,
    setEmailSuccess,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    passwordSuccess,
    setPasswordSuccess,
  ] = useState("");

  /* =========================================================
     VERIFY ADMIN
  ========================================================= */

  useEffect(() => {
    const initialize =
      async () => {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) {
          router.replace(
            "/admin/login",
          );

          return;
        }

        const {
          data: isAdmin,
          error: adminError,
        } =
          await supabase.rpc(
            "is_admin",
          );

        if (
          adminError ||
          !isAdmin
        ) {
          await supabase.auth.signOut();

          router.replace(
            "/admin/login",
          );

          return;
        }

        setCurrentEmail(
          user.email || "",
        );

        setNewEmail(
          user.email || "",
        );

        setLoading(false);
      };

    initialize();
  }, [router]);

  /* =========================================================
     CHANGE EMAIL
  ========================================================= */

  const changeEmail =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setEmailError("");
      setEmailSuccess("");

      const cleanEmail =
        newEmail
          .trim()
          .toLowerCase();

      if (!cleanEmail) {
        setEmailError(
          "Please enter the new email address.",
        );

        return;
      }

      if (
        cleanEmail ===
        currentEmail.toLowerCase()
      ) {
        setEmailError(
          "This is already the current admin email address.",
        );

        return;
      }

      setChangingEmail(true);

      const {
        data,
        error,
      } =
        await supabase.auth.updateUser({
          email: cleanEmail,
        });

      if (error) {
        setEmailError(
          error.message,
        );

        setChangingEmail(false);
        return;
      }

      const updatedEmail =
        data.user?.email ||
        currentEmail;

      /*
       * With email confirmation enabled,
       * Supabase may keep the current
       * email active until confirmation.
       */
      if (
        updatedEmail.toLowerCase() ===
        cleanEmail
      ) {
        setCurrentEmail(
          updatedEmail,
        );

        setEmailSuccess(
          "Admin email changed successfully.",
        );
      } else {
        setEmailSuccess(
          `Email change requested for ${cleanEmail}. Check the confirmation emails sent by Supabase before the new address becomes active.`,
        );
      }

      setChangingEmail(false);
    };

  /* =========================================================
     CHANGE PASSWORD
  ========================================================= */

  const changePassword =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setPasswordError("");
      setPasswordSuccess("");

      if (
        newPassword.length < 8
      ) {
        setPasswordError(
          "Use a password with at least 8 characters.",
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setPasswordError(
          "The two password fields do not match.",
        );

        return;
      }

      setChangingPassword(true);

      const {
        error,
      } =
        await supabase.auth.updateUser({
          password:
            newPassword,
        });

      if (error) {
        setPasswordError(
          error.message,
        );

        setChangingPassword(false);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");

      setPasswordSuccess(
        "Password changed successfully. Use the new password the next time you sign in.",
      );

      setChangingPassword(false);
    };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030303] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d6a62b]/30 border-t-[#f2c857]" />

          <p className="text-sm text-[#8f7741]">
            Loading admin settings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050403] text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-[#d6a62b]/15 bg-[#050403]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-5 md:px-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin",
              )
            }
            className="flex items-center gap-2 text-xs font-bold text-[#c6a653] transition hover:text-[#f2c857]"
          >
            <FiArrowLeft />
            Dashboard
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d6a62b]/40 bg-gradient-to-br from-[#171109] to-[#c7921e] text-[12px] font-black italic tracking-[-0.06em] text-[#fff0b0]">
              BGG
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-black tracking-[0.06em]">
                BLESSED GOD IS GREAT
              </p>

              <p className="mt-1 text-[7px] font-bold tracking-[0.18em] text-[#d6a62b]">
                ADMIN SETTINGS
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-[980px] px-4 py-8 sm:px-5 md:px-8 md:py-12">
        <div className="rounded-[28px] border border-[#d6a62b]/15 bg-gradient-to-br from-[#0e0c08] to-[#080705] p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d6a62b]/20 bg-[#d6a62b]/10 text-xl text-[#f2c857]">
              <FiShield />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d6a62b]">
                Account Security
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Admin Settings
              </h1>

              <p className="mt-3 max-w-[650px] text-sm leading-7 text-slate-400">
                Change the dealership admin email or password without editing
                the website code.
              </p>
            </div>
          </div>
        </div>

        {/* CURRENT ACCOUNT */}

        <section className="mt-6 rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <FiMail className="text-xl text-[#f2c857]" />

            <div>
              <h2 className="text-lg font-black">
                Current Admin Account
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                This is the email currently signed into the admin portal.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#d6a62b]/10 bg-black/25 p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#8f7741]">
              Current Email
            </p>

            <p className="mt-2 break-all text-sm font-black text-white">
              {currentEmail}
            </p>
          </div>
        </section>

        {/* CHANGE EMAIL */}

        <form
          onSubmit={changeEmail}
          className="mt-6 rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5 sm:p-7"
        >
          <div className="flex items-center gap-3">
            <FiMail className="text-xl text-[#f2c857]" />

            <div>
              <h2 className="text-lg font-black">
                Change Admin Email
              </h2>

              <p className="mt-1 text-xs leading-6 text-slate-500">
                This email will be used for future admin logins.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-[#9f874d]">
              New Email Address
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={newEmail}
              onChange={(event) =>
                setNewEmail(
                  event.target.value,
                )
              }
              placeholder="owner@example.com"
              className="gz-input"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-[#d6a62b]/10 bg-[#d6a62b]/[0.04] p-4">
            <p className="text-[11px] leading-6 text-slate-500">
              Depending on your Supabase email settings, confirmation may be
              required before the new address becomes active. Keep access to
              both the old and new email accounts while changing it.
            </p>
          </div>

          {emailError && (
            <Message
              type="error"
              text={emailError}
            />
          )}

          {emailSuccess && (
            <Message
              type="success"
              text={emailSuccess}
            />
          )}

          <button
            type="submit"
            disabled={changingEmail}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-3.5 text-sm font-black text-[#080603] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {changingEmail ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                Updating Email...
              </>
            ) : (
              <>
                <FiSave />
                Change Email
              </>
            )}
          </button>
        </form>

        {/* CHANGE PASSWORD */}

        <form
          onSubmit={changePassword}
          className="mt-6 rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5 sm:p-7"
        >
          <div className="flex items-center gap-3">
            <FiLock className="text-xl text-[#f2c857]" />

            <div>
              <h2 className="text-lg font-black">
                Change Password
              </h2>

              <p className="mt-1 text-xs leading-6 text-slate-500">
                Choose a private password that is not shared with anyone else.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={
                setNewPassword
              }
              visible={
                showPassword
              }
              onToggle={() =>
                setShowPassword(
                  (current) =>
                    !current,
                )
              }
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirm New Password"
              value={
                confirmPassword
              }
              onChange={
                setConfirmPassword
              }
              visible={
                showConfirmPassword
              }
              onToggle={() =>
                setShowConfirmPassword(
                  (current) =>
                    !current,
                )
              }
              autoComplete="new-password"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-[#d6a62b]/10 bg-black/20 p-4">
            <p className="text-[11px] leading-6 text-slate-500">
              Use at least 8 characters. A longer password with a mixture of
              letters, numbers and symbols is better.
            </p>
          </div>

          {passwordError && (
            <Message
              type="error"
              text={passwordError}
            />
          )}

          {passwordSuccess && (
            <Message
              type="success"
              text={
                passwordSuccess
              }
            />
          )}

          <button
            type="submit"
            disabled={
              changingPassword
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-3.5 text-sm font-black text-[#080603] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {changingPassword ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                Updating Password...
              </>
            ) : (
              <>
                <FiLock />
                Change Password
              </>
            )}
          </button>
        </form>

        {/* SECURITY NOTE */}

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#d6a62b]/10 bg-[#d6a62b]/[0.035] p-5">
          <FiShield className="mt-0.5 shrink-0 text-lg text-[#d6a62b]" />

          <div>
            <p className="text-xs font-black text-white">
              Security note
            </p>

            <p className="mt-2 text-[11px] leading-6 text-slate-500">
              The password is handled by Supabase Authentication. It is not
              stored in the website source code or in the dealership vehicle
              tables.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-[#9f874d]">
        {label}
      </label>

      <div className="relative">
        <input
          type={
            visible
              ? "text"
              : "password"
          }
          required
          minLength={8}
          autoComplete={
            autoComplete
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          placeholder="At least 8 characters"
          className="gz-input pr-12"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#f2c857]"
        >
          {visible ? (
            <FiEyeOff />
          ) : (
            <FiEye />
          )}
        </button>
      </div>
    </div>
  );
}

function Message({
  type,
  text,
}: {
  type:
    | "success"
    | "error";
  text: string;
}) {
  const success =
    type === "success";

  return (
    <div
      className={`mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${
        success
          ? "border-green-500/20 bg-green-500/10 text-green-300"
          : "border-red-500/20 bg-red-500/10 text-red-300"
      }`}
    >
      {success ? (
        <FiCheck className="mt-1 shrink-0" />
      ) : (
        <FiAlertCircle className="mt-1 shrink-0" />
      )}

      <span>{text}</span>
    </div>
  );
}
