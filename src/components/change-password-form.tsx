"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import type { AdminActionResult } from "@/lib/admin-constants";

type ChangePasswordFormProps = {
  action: (formData: FormData) => Promise<AdminActionResult>;
};

export function ChangePasswordForm({ action }: ChangePasswordFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setFieldErrors({});
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }
      form.reset();
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form className="checkout-panel" onSubmit={handleSubmit}>
      <h2>Change password</h2>
      {error ? <div className="form-banner">{error}</div> : null}
      {success ? (
        <div className="form-banner form-banner--success">
          Password updated successfully.
        </div>
      ) : null}

      <div className="form-grid">
        <label className="field field--full">
          <span>Current password</span>
          <input name="currentPassword" type="password" required autoComplete="current-password" />
          {fieldErrors.currentPassword ? (
            <span className="field-error">{fieldErrors.currentPassword}</span>
          ) : null}
        </label>
        <label className="field field--full">
          <span>New password</span>
          <input
            name="newPassword"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
          />
          {fieldErrors.newPassword ? (
            <span className="field-error">{fieldErrors.newPassword}</span>
          ) : null}
        </label>
        <label className="field field--full">
          <span>Confirm new password</span>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
          />
          {fieldErrors.confirmPassword ? (
            <span className="field-error">{fieldErrors.confirmPassword}</span>
          ) : null}
        </label>
      </div>

      <div className="admin-toolbar" style={{ marginTop: 16 }}>
        <button className="button" type="submit" disabled={isPending}>
          <KeyRound size={16} aria-hidden="true" />
          {isPending ? "Saving…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
