# Pousay Dibani — Project Status & Handoff

> **Read this first.** This file tracks what has been built, what is in progress, what
> is unfinished, and what to do next. Update it whenever the state of the project changes.

---

## 1. What this project is

**Pousay Dibani** is a Khulna-based (Bangladesh) home delivery MVP — a full-stack
e-commerce web app for ordering everyday goods with delivery inside Khulna city. See
`PRD.md` for the full product requirements.

Two main surfaces:

- **Customer storefront** — `/`, `/products`, `/products/[slug]`, `/cart`, `/checkout`, `/order-status`
- **Admin console** — `/admin/login`, `/admin`, `/admin/orders`, `/admin/products`, `/admin/categories`, `/admin/delivery-areas`

Cash on delivery only for MVP. No online payments, no rider app, no GPS, no multi-city.

---

## 2. Current status: 5 of 5 milestones complete — DEPLOYED & LIVE

**🚀 Live in production: https://pousay-dibani.vercel.app**

The app is no longer just "production-ready in code" — it is **deployed and
running on Vercel**, backed by a **Supabase** PostgreSQL database that is
migrated and seeded. The storefront and admin both serve real data.

| # | Milestone                          | Status     | Notes                                                   |
|---|------------------------------------|------------|---------------------------------------------------------|
| 1 | Project Foundation                 | ✅ Done     | Next.js 16, TS, Prisma + PostgreSQL, design tokens      |
| 2 | Catalog and Cart                   | ✅ Done     | Reads from Prisma, seeded, search + category filter     |
| 3 | Checkout and Orders                | ✅ Done     | Real Order/OrderItem writes, status lookup, validation  |
| 4 | Admin Dashboard                    | ✅ Done     | Auth.js v5, dashboard, full CRUD, order status workflow |
| 5 | Production Deployment              | ✅ **Deployed** | Live on Vercel (`pousay-dibani.vercel.app`), Supabase Postgres, GitHub auto-deploy from `main`, env vars set, DB migrated + seeded |

### Features shipped since the original MVP (post-Milestone-5)

- **Order confirmation SMS** via a pluggable provider (`SmsProvider` interface).
  Default `console` provider logs to stdout; every attempt is recorded in a new
  `SmsLog` table. (commit `f94431a`)
- **First-visit location picker** — modal captures the delivery area once,
  persists to localStorage, surfaces in navbar / cart / checkout. (commit `e311433`)
- **Storefront navbar hidden on `/admin/*` routes.** (commit `b63be05`)
- **Order-status page auto-tracks the most recent order** placed in this
  browser (no need to re-enter phone). (commit `63f0f74`)
- **Professional project README.** (commit `d44ad26`)

### Live verification (2026-06-22)

Checked against `https://pousay-dibani.vercel.app`:
- `/` → 200 ✅
- `/products` → 200 ✅ and **renders real seeded products** (DB connected)
- `/admin/login` → 200 ✅
- `/order-status` → 200 ✅

Still requires a manual human pass (can't be automated): logging into `/admin`
with the real credentials and walking an order through a status change. See
section 6.6.

Verification passes locally:
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run build` ✅ — 21 routes registered
- `npm run prisma:seed` ✅ — admin user + catalog + delivery areas
- `npm run smoke` ✅ (after `npm start`) — see section 6.7

---

## 3. Tech stack (as built)

| Layer        | Choice                                | Why                                                |
|--------------|---------------------------------------|----------------------------------------------------|
| Framework    | Next.js 16.2 (App Router, Turbopack)  | Per PRD                                            |
| Language     | TypeScript 6                          | Per PRD                                            |
| Styling      | Plain CSS with design tokens          | Project came pre-scaffolded this way (no Tailwind) |
| ORM          | Prisma 7 + `@prisma/adapter-pg`       | Per PRD                                            |
| Database     | PostgreSQL                            | Per PRD                                            |
| Auth         | Auth.js v5 (Credentials + JWT)        | Per PRD ("Auth.js or custom")                      |
| Passwords    | bcryptjs                              | Standard for credential-based auth                 |
| Validation   | Zod                                   | Already installed; used in all server actions      |
| Icons        | lucide-react                          | Already installed                                  |
| Seed runner  | tsx + dotenv-cli                      | For `prisma db seed` with TS                       |
| Deploy       | Vercel (target)                       | Per PRD                                            |
| Image storage| TBD (Cloudinary or Supabase)          | Per PRD — not implemented yet                      |

---

## 4. Project layout

```
pousay-dibani/
├── PRD.md                       # Product requirements (do not edit)
├── PROJECT_STATUS.md            # THIS file
├── package.json
├── tsconfig.json
├── next.config.ts               # typedRoutes: true, images.remotePatterns: [Unsplash]
├── eslint.config.mjs
├── prisma.config.ts             # schema + seed via tsx
├── .env / .env.example          # DATABASE_URL, ADMIN_*, AUTH_SECRET, etc.
├── supabase/
│   └── config.toml              # Supabase project config (project_id = pousay-dibani)
├── prisma/
│   ├── schema.prisma            # 7 models: Product, Category, Order, OrderItem, AdminUser, DeliveryArea, SmsLog
│   ├── seed.ts                  # seeds 4 categories, 8 products, 5 areas, 1 admin
│   └── migrations/              # two: 20260615..._init, 20260618..._add_sms_log
└── src/
    ├── auth.ts                  # Auth.js config
    ├── proxy.ts                 # protects /admin/* (replaces deprecated middleware.ts)
    ├── middleware.ts            # does NOT exist — proxy is the new convention
    ├── lib/
    │   ├── prisma.ts            # PrismaClient singleton (pg driver adapter)
    │   ├── format.ts            # formatTaka (BDT currency)
    │   ├── catalog.ts           # async Prisma queries (getActiveCategories, searchProducts, etc.)
    │   ├── cart.ts              # localStorage cart helpers (CART_STORAGE_KEY, mergeCartItem, etc.)
    │   ├── types.ts             # Product, ProductCategory, CartItem, StockStatus types
    │   ├── orders.ts            # Zod schemas: checkoutFormSchema, orderLookupSchema, formatPhone
    │   ├── order-actions.ts     # "use server" actions: placeOrder, lookupOrder, getActiveDeliveryAreas
    │   ├── order-number.ts      # generateUniqueOrderNumber
    │   ├── admin-actions.ts     # "use server" actions: CRUD for products/categories/areas + updateOrderStatus
    │   └── admin-constants.ts   # AdminActionResult type, status enums + labels (separated from "use server")
    ├── hooks/
    │   └── use-cart-items.ts    # useSyncExternalStore over localStorage + pousay-cart-updated event
    ├── components/
    │   ├── site-header.tsx              # public nav
    │   ├── product-card.tsx             # async server component
    │   ├── add-to-cart-button.tsx       # client, writes to localStorage
    │   ├── cart-link.tsx                # shows cart badge
    │   ├── cart-view.tsx                # cart items + summary
    │   ├── checkout-form.tsx            # calls placeOrder server action
    │   ├── order-status-form.tsx        # customer order lookup
    │   ├── order-summary.tsx            # shared order panel (used by checkout + status pages)
    │   ├── order-status-badge.tsx       # shared status pill
    │   ├── admin-shell.tsx              # sidebar layout for /admin/*
    │   ├── admin-login-form.tsx         # /admin/login form
    │   ├── admin-order-status-form.tsx  # /admin/orders/[id] status update
    │   ├── category-form.tsx            # create/edit category
    │   ├── product-form.tsx             # create/edit product
    │   └── delivery-area-form.tsx       # create/edit delivery area
    └── app/
        ├── layout.tsx                   # public root layout (SiteHeader + footer)
        ├── page.tsx                     # /  (home — featured + categories)
        ├── products/page.tsx            # listing + search + category filter
        ├── products/[slug]/page.tsx     # product detail (dynamic)
        ├── cart/page.tsx                # /cart
        ├── checkout/page.tsx            # /checkout (loads delivery areas)
        ├── order-status/page.tsx        # /order-status (server-side initial lookup)
        ├── api/auth/[...nextauth]/route.ts   # Auth.js handlers
        └── admin/
            ├── (public)/login/page.tsx  # /admin/login (no shell)
            └── (authenticated)/
                ├── page.tsx                 # /admin dashboard
                ├── orders/page.tsx          # /admin/orders (with status filter)
                ├── orders/[id]/page.tsx     # /admin/orders/[id] (status update)
                ├── products/page.tsx        # /admin/products list
                ├── products/new/page.tsx
                ├── products/[id]/page.tsx
                ├── categories/page.tsx
                ├── categories/new/page.tsx
                ├── categories/[id]/page.tsx
                ├── delivery-areas/page.tsx
                ├── delivery-areas/new/page.tsx
                └── delivery-areas/[id]/page.tsx
```

---

## 5. How to run it locally

```bash
# 1. Make sure PostgreSQL is running and .env has the right DATABASE_URL
#    (current .env points to postgres:emon@2026@localhost:5432/pousay_dibani)

# 2. Apply the schema (only needed if you don't have the DB yet)
npm run prisma:migrate

# 3. Seed: 4 categories, 8 products, 5 delivery areas, 1 admin
npm run prisma:seed

# 4. Start the dev server
npm run dev
```

**Default admin credentials** (from `.env`):
- Email: `admin@pousaydibani.com`
- Password: `admin@123`

Visit:
- `http://localhost:3000` — store
- `http://localhost:3000/admin` — admin (redirects to login)

---

## 6. Milestone 5 — what was delivered

The codebase is now production-ready. The remaining work is mostly **cloud account
setup and a one-time deploy**, both of which the project can't do on its own.

### 6.1 What was added in code

- **`vercel.json`** — explicit `buildCommand`, `installCommand`, framework, region
  (`sin1`, Singapore — closest to Khulna), and a baseline set of security headers.
- **`src/lib/env.ts`** — `assertProductionEnv()` runs at startup and refuses to boot
  if `DATABASE_URL`, `AUTH_SECRET`, or `ADMIN_PASSWORD` look like placeholders in
  production. Also exports `useSecureCookies()`.
- **`src/lib/rate-limit.ts`** — in-memory token-bucket limiter (5 attempts, refills
  1 token every 12 seconds). Used to throttle `/admin/login`. Replace with a
  Redis/Upstash backend for multi-instance deploys.
- **`src/lib/auth-actions.ts`** — server action `checkLoginRateLimit()` that the
  login form calls before submitting credentials.
- **`src/lib/monitoring.ts`** — `report({ message, error, context })` writes a
  structured JSON log line and (if `SENTRY_DSN` is set) forwards to Sentry. No
  SDK dependency for the MVP.
- **`src/lib/boot.ts`** — placeholder for future `process.on` hooks.
- **`src/lib/action-wrapper.ts`** — `withErrorHandling(name, fn)` utility for
  wrapping server actions. Available but not yet applied to existing actions
  (which already return typed error results from Zod).
- **`src/app/error.tsx`** — global error boundary. Renders a friendly page with
  a `digest` reference and a "Try again" button. Vercel logs the underlying
  error automatically.
- **`next.config.ts`** — `poweredByHeader: false`, a baseline CSP, and the same
  security headers as `vercel.json` (defense in depth).
- **`prisma/seed.ts`** — now supports `tsx prisma/seed.ts <mode>`:
  - `all` (default) — categories + products + delivery areas + admin
  - `admin` — only the admin user
  - `catalog` — categories + products + delivery areas, no admin
- **`scripts/smoke-test.mjs`** — `npm run smoke`. Hits 7 key URLs and asserts
  200 + expected text. Run after `npm start` to validate a deployment.
- **`package.json`** — new scripts:
  - `prebuild` — `prisma generate` before every build
  - `postinstall` — `prisma generate` so Vercel's `npm install` produces a
    valid Prisma client
  - `prisma:generate` — no longer wraps with `dotenv` (works without a `.env`
    during `npm install`)
  - `smoke` — `node scripts/smoke-test.mjs`

### 6.2 Deployment checklist — DONE (with current state)

> **This whole checklist is now complete.** It's kept here as a record of how
> the live deployment was set up and as a runbook for re-deploying or moving to
> a new database/host. Items that still need a human are flagged ⚠️.

#### 1. Provision a production PostgreSQL database — ✅ Supabase
The production DB is **Supabase Postgres** (project_id `pousay-dibani`, see
`supabase/config.toml`). `src/lib/prisma.ts` resolves the connection string from
`DATABASE_URL` → `POSTGRES_PRISMA_URL` → `POSTGRES_URL`, so Supabase's
auto-injected `POSTGRES_*` vars work without extra config.

#### 2. Generate a real `AUTH_SECRET` — ✅ Set on Vercel
A real secret is configured in the Vercel project env (the production build is
live and `assertProductionEnv()` rejects placeholder secrets at sign-in time).
⚠️ The actual value can't be read back via the API — if admin login ever fails
with a session error, re-check `AUTH_SECRET` in Vercel → Settings → Env Vars.

#### 3. Deploy to Vercel — ✅ Done (GitHub auto-deploy)
- Repo: `github.com/naimurerahaman/pousay-dibani` (public).
- Vercel project: `pousay-dibani` under team "Emon's projects".
- Every push to `main` auto-deploys to **production** (Node 24.x, Turbopack).
- Domains: `pousay-dibani.vercel.app` (canonical),
  `pousay-dibani-git-main-...vercel.app`, plus per-deploy URLs.

#### 4. Apply migrations and seed on production — ✅ Done
Both migrations (`_init`, `_add_sms_log`) are applied and the catalog is seeded
(verified: `/products` renders real products on the live site). To re-run later
against the production DB:
```bash
npx prisma migrate deploy      # apply any new migrations
npm run prisma:seed            # full seed (catalog + admin)
npm run prisma:seed -- admin   # only the admin user
```
> Note: `npm run prisma:seed -- admin` passes `admin` to the seed script as
> the first CLI argument.

#### 5. Smoke-test the production deploy
```bash
npm run smoke
# or with an explicit URL:
BASE_URL=https://pousay-dibani.vercel.app npm run smoke
```
You should see `All 7 smoke checks passed.`

#### 6. Manual verification (do this once after every deploy)
- [ ] Visit `/` and confirm the home page renders with the hero and categories
- [ ] Visit `/products` and confirm products load
- [ ] Add a product to cart, complete a checkout (use a real phone + area)
- [ ] Note the order number shown
- [ ] Visit `/order-status`, enter the order number + the phone you used,
      confirm the order shows up
- [ ] Visit `/admin/login`, sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] On the dashboard, find the order you just placed
- [ ] Click into it, change the status to "Confirmed", confirm it persists
- [ ] Sign out

#### 7. Outstanding operator to-dos (post-launch)
The deploy is live; these are the remaining manual items, none of them blockers:
- [ ] ⚠️ **Run the manual order → admin flow** on production (section 6.6). This
      is the one verification still pending — confirms admin login + status
      updates work end-to-end against the live DB.
- [ ] ⚠️ **Change the admin password** off any default (no UI yet — set a new
      `ADMIN_PASSWORD` in Vercel + local, then `npm run prisma:seed -- admin`)
- [ ] **Confirm `NEXT_PUBLIC_APP_URL`** = `https://pousay-dibani.vercel.app`
      (or the custom domain) so auth redirects and tracking links are correct
- [ ] **Check Vercel runtime logs** for any startup/runtime errors
- [ ] **(Optional) Connect a custom domain** in Vercel → Settings → Domains
- [ ] **(Optional) Wire a real SMS provider** — currently `console` only (logs
      to Vercel stdout). Set `SMS_PROVIDER` + provider keys to send real SMS.

#### 8. Image storage (deferred)
Currently product images are hotlinked from `images.unsplash.com`. To upload
your own:
1. Create a Cloudinary or Supabase Storage bucket
2. Add an upload UI to `src/components/product-form.tsx` (use a presigned URL
   flow to keep secrets safe)
3. Save the returned URL to `Product.imageUrl`
4. Add the new host to `images.remotePatterns` in `next.config.ts`

This is explicitly listed as a stretch goal in section 8 below.

---

## 7. Known issues / sharp edges

These are intentional shortcuts taken in the MVP. They should be addressed before
broad rollout but are not blockers for the MVP.

1. **No Tailwind.** The PRD §7 lists Tailwind as the suggested stack. The project
   actually uses plain CSS with design tokens in `src/app/globals.css`. Refactoring
   to Tailwind would be a sizable rewrite; only do it if you want it for new work.
2. **No password reset flow.** The seeded admin password is the only way in. For
   production: add a "forgot password" flow or at least document a manual DB reset
   procedure (currently `npm run prisma:seed -- admin` after setting a new
   `ADMIN_PASSWORD`).
3. **No order cancellation reason / audit log.** Admins can flip an order to CANCELLED
   but there's no record of who/when beyond `updatedAt`. Consider an `OrderEvent` table
   for the future.
4. **SMS notifications are stubbed, email is not wired.** Order confirmation SMS
   now exists (`src/lib/sms.ts` + `order-sms.ts`, logged to `SmsLog`), but the
   shipped provider is `console` (logs to stdout only) — no real SMS goes out
   until a provider (`bulksms`/`twilio`) is implemented and `SMS_PROVIDER` is set.
   No admin email notification on new orders; admin still checks the dashboard.
5. **In-memory rate limiter.** `src/lib/rate-limit.ts` is fine for a single-instance
   deploy. For multi-instance production, swap the in-memory Map for Upstash Redis or
   Vercel KV — the `consume()` API stays the same.
6. **No image upload from the admin form.** Product images are URLs only. The image
   `remotePatterns` in `next.config.ts` is restricted to `images.unsplash.com`, so
   any other image host will be blocked by Next/Image.
7. **No accessibility audit.** Forms use semantic HTML and `aria-invalid`, but a
   proper audit (axe, Lighthouse) hasn't been run.
8. **No tests.** No unit tests, no e2e tests. The MVP shipped on manual verification.
   The smoke-test script (`npm run smoke`) catches the obvious surface area but not
   regressions in business logic.
9. **Search uses `contains` with `mode: "insensitive"`.** For larger catalogs,
   consider Postgres full-text search (`tsvector`) or a hosted search service.
10. **Order lookup requires exact phone match.** Customers have to enter the phone
    they used at checkout. This is intentional for privacy but is friction.
11. **Phone is stored as a plain string.** A `customers` table or normalization
    to E.164 would be useful if you add SMS later.

---

## 8. Recommended next steps (in priority order)

### 8.1 Finish the MVP (Milestone 5)
✅ **DONE in code.** See section 6.2 for the deploy checklist that you (the
operator) need to walk through on Vercel. Once that's done, the MVP is launched.

### 8.2 Add basic observability before launch
- ✅ **Done (partially)**: `src/lib/monitoring.ts` provides a `report()` function
  that writes structured JSON logs and (optionally) forwards to Sentry. No
  SDK dependency for the MVP.
- A simple "request ID" middleware header (`x-request-id`) that gets logged with
  errors. Vercel's logs are decent but a request ID makes support much easier.
- Wire `process.on("unhandledRejection")` and `process.on("uncaughtException")`
  in `src/lib/boot.ts` to call `report()`.

### 8.3 Add a customer account (out of MVP scope but very valuable)
The PRD lists this as an open question. A `User` model + login for customers
unlocks:
- Real order history on the customer side (instead of the phone+orderNumber dance)
- Marketing/notification hooks
- A foundation for online payments, subscriptions, etc.

### 8.4 Add online payments
The PRD §5 lists payments as out of scope for MVP, but it's the single biggest
value unlock for the business. Recommended providers for Bangladesh:
- **bKash / Nagad** — the dominant local options. Either via their official
  payment gateway (if available) or by having the customer send to a merchant
  number and reference the order number (less automated but workable).
- **Stripe** — not widely used in BD retail, but well-documented if you go that way.

### 8.5 Add a delivery/rider module
A simple `Rider` model (id, name, phone, isActive) and a `riderId` foreign key on
`Order` would let you:
- Show a rider's current queue in the admin
- Send an SMS when an order is `OUT_FOR_DELIVERY`
- Track delivery times per area (great input for expansion decisions)

The PRD explicitly excludes "dedicated rider mobile app", but a web UI for the
rider (just "here are my orders, mark delivered") is achievable in a day or two.

### 8.6 Address the open questions in PRD §12
- **Product categories to launch first** — current seed has groceries, household,
  health, stationery. Reasonable for a Khulna launch. Revisit after the first month
  of sales data.
- **Supported delivery areas** — currently 5 (Sonadanga, Khalishpur, Daulatpur,
  Boyra, New Market). Add more via `/admin/delivery-areas` as you grow.
- **Fixed vs area-based delivery fee** — already area-based, good.
- **Customer accounts** — see 8.3.
- **New order notifications** — at minimum, email the admin. SMS via bKash or a
  provider like SSL Wireless is more reliable in BD.
- **Brand / language** — current UI is in English. Consider a Bengali (`bn`) locale
  using `next-intl` or built-in i18n routing.

### 8.7 Other things that would be high-leverage
- **Receipts** — generate a printable PDF on the order status page.
- **Image optimization pipeline** — Unsplash is a placeholder; once you have
  Cloudinary set up, generate thumbnails automatically.
- **Public status page** — `/order-status` already exists. Consider adding a
  "recently placed" widget on the home page once volume picks up (with consent).
- **Promotions** — coupons, free-delivery thresholds. Simple to add once you have
  Order + User models in place.
- **Inventory** — currently the admin toggles stock status manually. A proper
  inventory table with decrement-on-order (and revert-on-cancel) is the next step.

---

## 9. Quick reference: how to add a new admin page

1. Create `src/app/admin/(authenticated)/<section>/page.tsx` (server component).
2. If it needs forms, create a client component in `src/components/`.
3. Add server actions in `src/lib/admin-actions.ts` — wrap them in `await requireAdmin()`.
4. Add a nav link in `src/components/admin-shell.tsx`.
5. Run `npm run typecheck && npm run lint && npm run build`.

## 10. Quick reference: how to add a new server action

```ts
// src/lib/admin-actions.ts (or a new "use server" file)
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { fieldErrorsFromZod, type AdminActionResult } from "@/lib/admin-constants";

const mySchema = z.object({ /* ... */ });

export async function myAction(input: unknown): Promise<AdminActionResult> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = mySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "...", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  // ... do the thing
  return { ok: true };
}
```

Remember: only **async functions** can be exported from a `"use server"` file. Move
any constants, types, or labels to `src/lib/admin-constants.ts`.

---

## 11. Environment variables

| Var                  | Where          | Required | Notes                                              |
|----------------------|----------------|----------|----------------------------------------------------|
| `DATABASE_URL`       | local + Vercel | yes      | PostgreSQL connection string. Prod = Supabase.     |
| `POSTGRES_PRISMA_URL` / `POSTGRES_URL` | Vercel | fallback | Auto-injected by Supabase; `prisma.ts` falls back to these if `DATABASE_URL` is unset. |
| `NEXT_PUBLIC_APP_URL`| local + Vercel | yes      | Used for absolute URLs (SMS tracking links, etc.). Must be https in production. |
| `SMS_PROVIDER`       | optional       | no       | `console` (default, logs only), or future `bulksms` / `twilio`. See `.env.example`. |
| `ADMIN_EMAIL`        | local + Vercel | yes (seed) | Owner email for the seeded admin                  |
| `ADMIN_PASSWORD`     | local + Vercel | yes (seed) | **Rotate in production.** Don't keep `admin@123`   |
| `AUTH_SECRET`        | local + Vercel | yes      | `openssl rand -base64 32`. Required by Auth.js. Asserted at startup. |
| `AUTH_TRUST_HOST`    | local + Vercel | yes      | `true` in hosted environments                      |
| `AUTH_USE_SECURE_COOKIES` | optional  | no       | Force `true`/`false`. Defaults to `NODE_ENV=production`. |
| `SENTRY_DSN`         | optional       | no       | If set, server errors are forwarded to Sentry.     |

---

## 12. Last verified

- Date: 2026-06-22
- **Production is LIVE:** https://pousay-dibani.vercel.app
  - `/`, `/products`, `/admin/login`, `/order-status` → all 200
  - `/products` renders real seeded products → Supabase DB connected + seeded
  - Latest production deploy `READY` (auto-deployed from `main` @ `63f0f74`)
- ⚠️ Still pending: manual admin login + order-status-change click-through on
  prod (section 6.6), and rotating the admin password (section 6.7).
- Prior local verification (2026-06-16):
  - `npm run typecheck` ✅ / `npm run lint` ✅
  - `npm run build` ✅ — 21 routes, 3 static, 18 dynamic
  - `npm run prisma:seed` ✅
- Admin login (local/dev default): `admin@pousaydibani.com` / `admin@123`

### Milestone 5 hardening — final pass

- `assertProductionEnv()` deferred to request time (inside `authorize` and `session`
  callbacks in `src/auth.ts`) so it no longer fires during `next build` and blocks
  the production build with placeholder secrets in `.env`. The check still runs on
  every sign-in attempt and on every authenticated session read in production.
- Build verified end-to-end with `NODE_ENV=production` semantics, all 21 routes
  generated, 3 static (`/_not-found`, `/cart`, `/api/auth/[...nextauth]`), 18
  dynamic. Proxy (middleware) registered for `/admin/*`.

> **Reminder:** Before each work session, re-read this file. After meaningful changes,
> update it so the next person (or future-you) can pick up where you left off.
