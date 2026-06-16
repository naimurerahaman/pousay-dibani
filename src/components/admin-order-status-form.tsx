"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { type AdminActionResult, orderStatusLabels, orderStatusValues } from "@/lib/admin-constants";

type AdminOrderStatusFormProps = {
  orderId: string;
  initialStatus: string;
  action: (formData: FormData) => Promise<AdminActionResult>;
};

export function AdminOrderStatusForm({ orderId, initialStatus, action }: AdminOrderStatusFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form className="checkout-panel" onSubmit={handleSubmit}>
      <h2>Update status</h2>
      {error ? <div className="form-banner">{error}</div> : null}

      <input type="hidden" name="orderId" value={orderId} />
      <label className="field">
        <span>Status</span>
        <select
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {orderStatusValues.map((value) => (
            <option key={value} value={value}>
              {orderStatusLabels[value]}
            </option>
          ))}
        </select>
      </label>

      <button
        className="button"
        type="submit"
        disabled={isPending || status === initialStatus}
      >
        <CheckCircle2 size={16} aria-hidden="true" />
        {isPending ? "Saving…" : "Save status"}
      </button>
    </form>
  );
}
