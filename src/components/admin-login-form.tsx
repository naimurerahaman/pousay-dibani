"use client";

import { LogIn } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { checkLoginRateLimit } from "@/lib/auth-actions";

type AdminLoginFormProps = {
  callbackUrl: string;
  initialError: string | null;
};

export function AdminLoginForm({ callbackUrl, initialError }: AdminLoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const gate = await checkLoginRateLimit();
      if (!gate.ok) {
        setError(gate.error);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      window.location.assign(callbackUrl);
    });
  }

  return (
    <form className="checkout-panel admin-login-form" onSubmit={handleSubmit}>
      <h2>Admin sign in</h2>
      <p className="muted">
        Sign in with the credentials configured by the Pousay Dibani operator.
      </p>
      {error ? <div className="form-banner">{error}</div> : null}
      <label className="field">
        <span>Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@pousaydibani.com"
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      <button className="button" type="submit" disabled={isPending}>
        <LogIn size={17} aria-hidden="true" />
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
