/**
 * Runtime checks for required environment variables.
 * Use these to fail fast on missing or insecure config in production.
 */

const isProduction = process.env.NODE_ENV === "production";

export function assertProductionEnv() {
  if (!isProduction) return;

  const errors: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required.");
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push("NEXT_PUBLIC_APP_URL is required.");
  } else if (process.env.NEXT_PUBLIC_APP_URL.startsWith("http://")) {
    errors.push("NEXT_PUBLIC_APP_URL must use https in production.");
  }

  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    errors.push(
      "AUTH_SECRET is required in production and must be at least 32 characters. Generate with: openssl rand -base64 32",
    );
  }

  if (process.env.AUTH_SECRET && /change-me|REPLACE_ME|admin@123/i.test(process.env.AUTH_SECRET)) {
    errors.push("AUTH_SECRET looks like a placeholder. Replace it before deploying.");
  }

  if (process.env.ADMIN_PASSWORD && /change-me|admin@123/i.test(process.env.ADMIN_PASSWORD)) {
    errors.push(
      "ADMIN_PASSWORD looks like a placeholder. Rotate it before deploying or change it after the first admin login.",
    );
  }

  if (errors.length > 0) {
    const message = `Refusing to start in production with invalid env:\n  - ${errors.join("\n  - ")}`;
    throw new Error(message);
  }
}

export function getSecureCookiesEnabled() {
  if (process.env.AUTH_USE_SECURE_COOKIES) {
    return process.env.AUTH_USE_SECURE_COOKIES === "true";
  }
  return isProduction;
}
