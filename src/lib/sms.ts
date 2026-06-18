/**
 * Pluggable SMS provider interface.
 *
 * The default `ConsoleSmsProvider` just logs the message to stdout so the
 * order-placement flow can be exercised end-to-end without real gateway
 * credentials. When a real provider (BulkSMS BD, Twilio, etc.) is wired
 * up, register a new class implementing `SmsProvider` and select it in
 * `getSmsProvider()` via `process.env.SMS_PROVIDER`.
 */

import { randomUUID } from "node:crypto";
import { phoneRegex } from "@/lib/orders";

export type SmsSendResult =
  | { status: "sent"; providerRef: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export interface SmsProvider {
  readonly name: string;
  send(to: string, body: string): Promise<SmsSendResult>;
}

class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";

  async send(to: string, body: string): Promise<SmsSendResult> {
    if (!phoneRegex.test(to)) {
      return { status: "failed", error: "invalid phone" };
    }

    console.info(
      JSON.stringify({
        tag: "pousay-dibani.sms",
        provider: this.name,
        to,
        body,
        timestamp: Date.now(),
      }),
    );

    return { status: "sent", providerRef: `console-${randomUUID()}` };
  }
}

let cachedProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (cachedProvider) return cachedProvider;

  // Future: branch on `process.env.SMS_PROVIDER` ("bulksms", "twilio", ...).
  // For now the console provider is the only one and is the safe default.
  cachedProvider = new ConsoleSmsProvider();
  return cachedProvider;
}
