/**
 * New-order notifications for the shop admin.
 *
 * Two best-effort channels, both off by default and auto-skipped when their
 * env vars are missing:
 *   - Email via Resend's REST API (no SDK dependency, mirrors monitoring.ts).
 *   - Telegram via the Bot API sendMessage endpoint.
 *
 * Notifications must NEVER block or fail a checkout, so every send is wrapped
 * and any error is reported but swallowed.
 */

import { report } from "@/lib/monitoring";
import { formatTaka } from "@/lib/format";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ORDER_NOTIFY_TO = process.env.ORDER_NOTIFY_TO;
const ORDER_NOTIFY_FROM =
  process.env.ORDER_NOTIFY_FROM ?? "Pousay Dibani <onboarding@resend.dev>";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export type NewOrderNotification = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryArea: string;
  deliveryAddress: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
};

function itemLines(order: NewOrderNotification): string {
  return order.items
    .map(
      (item) =>
        `  • ${item.quantity}× ${item.name} — ${formatTaka(item.lineTotal)}`,
    )
    .join("\n");
}

function plainBody(order: NewOrderNotification): string {
  return [
    `New order ${order.orderNumber}`,
    "",
    `Customer: ${order.customerName} (${order.customerPhone})`,
    `Area: ${order.deliveryArea}`,
    `Address: ${order.deliveryAddress}`,
    "",
    "Items:",
    itemLines(order),
    "",
    `Subtotal: ${formatTaka(order.subtotal)}`,
    `Delivery: ${formatTaka(order.deliveryFee)}`,
    `Total: ${formatTaka(order.total)}`,
  ].join("\n");
}

async function sendEmail(order: NewOrderNotification) {
  if (!RESEND_API_KEY || !ORDER_NOTIFY_TO) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ORDER_NOTIFY_FROM,
      to: ORDER_NOTIFY_TO.split(",").map((s) => s.trim()).filter(Boolean),
      subject: `New order ${order.orderNumber} — ${formatTaka(order.total)}`,
      text: plainBody(order),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 300)}`);
  }
}

async function sendTelegram(order: NewOrderNotification) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const text = [
    `📦 *New order ${order.orderNumber}*`,
    `👤 ${order.customerName} — ${order.customerPhone}`,
    `📍 ${order.deliveryArea}`,
    `🏠 ${order.deliveryAddress}`,
    "",
    itemLines(order),
    "",
    `🧾 Total: *${formatTaka(order.total)}* (delivery ${formatTaka(order.deliveryFee)})`,
  ].join("\n");

  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Telegram responded ${res.status}: ${detail.slice(0, 300)}`);
  }
}

/**
 * Notify the admin of a new order on every configured channel. Safe to call
 * with `void` — it resolves to nothing and never rejects.
 */
export async function notifyNewOrder(order: NewOrderNotification): Promise<void> {
  const results = await Promise.allSettled([
    sendEmail(order),
    sendTelegram(order),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      void report({
        message: "Order notification failed",
        severity: "warning",
        error: result.reason,
        context: { orderNumber: order.orderNumber },
      });
    }
  }
}
