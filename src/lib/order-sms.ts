/**
 * Order-confirmation SMS renderer + dispatcher.
 *
 * Renders the confirmation message template, hands it to the configured
 * `SmsProvider`, and records every attempt in the `SmsLog` table.
 */

import { SmsStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSmsProvider, type SmsSendResult } from "@/lib/sms";
import { report } from "@/lib/monitoring";

function toSmsStatus(result: SmsSendResult): SmsStatus {
  switch (result.status) {
    case "sent":
      return "SENT";
    case "skipped":
      return "SKIPPED";
    case "failed":
      return "FAILED";
  }
}

export type SendOrderConfirmationInput = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  total: number;
  appUrl: string;
};

export type SendOrderConfirmationResult =
  | { ok: true; logId: string; status: "sent" }
  | {
      ok: false;
      status: "skipped" | "failed";
      reason: string;
    };

function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  return first || "there";
}

export function renderOrderConfirmation({
  customerName,
  orderNumber,
  total,
  appUrl,
}: {
  customerName: string;
  orderNumber: string;
  total: number;
  appUrl: string;
}): string {
  const trackingUrl = `${appUrl.replace(/\/$/, "")}/order-status`;
  return [
    `Hi ${firstName(customerName)}, thanks for ordering from Pousay Dibani!`,
    `Order ${orderNumber} (৳${total}) received.`,
    `We'll call to confirm. Track: ${trackingUrl}`,
  ].join(" ");
}

export async function sendOrderConfirmation(
  input: SendOrderConfirmationInput,
): Promise<SendOrderConfirmationResult> {
  const body = renderOrderConfirmation({
    customerName: input.customerName,
    orderNumber: input.orderNumber,
    total: input.total,
    appUrl: input.appUrl,
  });

  const provider = getSmsProvider();
  let result;
  try {
    result = await provider.send(input.customerPhone, body);
  } catch (error) {
    await report({
      message: "SMS provider threw an unexpected error",
      severity: "error",
      error,
      context: { orderId: input.orderId, provider: provider.name },
    });
    result = {
      status: "failed" as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Always log the attempt, regardless of outcome.
  let log;
  try {
    log = await prisma.smsLog.create({
      data: {
        orderId: input.orderId,
        toPhone: input.customerPhone,
        body,
        provider: provider.name,
        status: toSmsStatus(result),
        providerRef: result.status === "sent" ? result.providerRef : null,
        errorMessage:
          result.status === "failed"
            ? result.error
            : result.status === "skipped"
              ? result.reason
              : null,
      },
      select: { id: true },
    });
  } catch (error) {
    // Logging itself failed — never let it block the order.
    await report({
      message: "Failed to persist SmsLog row",
      severity: "error",
      error,
      context: { orderId: input.orderId },
    });
  }

  if (result.status === "sent") {
    return { ok: true, status: "sent", logId: log?.id ?? "" };
  }

  return {
    ok: false,
    status: result.status,
    reason: result.status === "skipped" ? result.reason : result.error,
  };
}