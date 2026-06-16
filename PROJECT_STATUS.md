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

## 2. Current status: 5 of 5 milestones complete

| # | Milestone                          | Status     | Notes                                                   |
|---|------------------------------------|------------|---------------------------------------------------------|
| 1 | Project Foundation                 | ✅ Done     | Next.js 16, TS, Prisma + PostgreSQL, design tokens      |
| 2 | Catalog and Cart                   | ✅ Done     | Reads from Prisma, seeded, search + category filter     |
| 3 | Checkout and Orders                | ✅ Done     | Real Order/OrderItem writes, status lookup, validation  |
| 4 | Admin Dashboard                    | ✅ Done     | Auth.js v5, dashboard, full CRUD, order status workflow |
| 5 | Production Deployment              | ✅ Done     | Vercel config, env hardening, security headers, rate limiting, monitoring hook, smoke test, deployment guide |

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
├── prisma/
│   ├── schema.prisma            # 6 models: Product, Category, Order, OrderItem, AdminUser, DeliveryArea
│   ├── seed.ts                  # seeds 4 categories, 8 products, 5 areas, 1 admin
│   └── migrations/              # one init migration
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

### 6.2 What you still need to do (deployment checklist)

#### 1. Provision a production PostgreSQL database
Recommended providers (all have generous free tiers):
- **Vercel Postgres** — easiest if you're on Vercel. Click "Storage → Create
  Database → Postgres" in your Vercel project. Vercel auto-sets `DATABASE_URL`.
- **Neon** (https://neon.tech) — serverless Postgres with branching. Free tier
  is plenty for MVP. Copy the pooled connection string.
- **Supabase** (https://supabase.com) — Postgres with extras (auth, storage).
  If you want image storage, Supabase is a natural choice.

#### 2. Generate a real `AUTH_SECRET`
On your local machine:
```bash
openssl rand -base64 32
```
Use that value for both local `.env` and the Vercel env var.

#### 3. Deploy to Vercel
1. Push the repo to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New Project → Import** the repo.
3. Vercel will auto-detect Next.js. Override nothing; defaults are correct.
4. **Environment Variables**: set the following in the Vercel project settings
   before the first deploy:
   - `DATABASE_URL` — paste your production database URL
   - `NEXT_PUBLIC_APP_URL` — `https://<your-project>.vercel.app` (or your custom domain)
   - `AUTH_SECRET` — the value from step 2
   - `AUTH_TRUST_HOST` — `true`
   - `ADMIN_EMAIL` — your real admin email
   - `ADMIN_PASSWORD` — a **strong** password (min 12 chars, mixed case + symbols)
5. Click **Deploy**. The first build will run `npm install` → `prisma generate`
   (via `postinstall`) → `next build`.

#### 4. Apply migrations and seed on production
Once the first deploy is live, run this locally (or in Vercel's shell) with
your production `DATABASE_URL`:
```bash
# Apply the schema
npx prisma migrate deploy

# Seed catalog + admin (or just the admin if you don't want demo data)
npm run prisma:seed           # full seed
npm run prisma:seed -- admin  # only the admin user
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

#### 7. First-30-minutes must-dos
- [ ] **Change the admin password** in the DB (no UI for this yet — easiest is
      `npm run prisma:seed -- admin` after setting a new `ADMIN_PASSWORD`)
- [ ] **Verify `NEXT_PUBLIC_APP_URL`** is the real production URL (else auth
      redirects will break)
- [ ] **Check Vercel logs** for any startup errors
- [ ] **Lock down the Vercel project** — disable "Auto-Deploy" on PR branches if
      you don't want preview URLs
- [ ] **(Optional) Connect a custom domain** in Vercel → Settings → Domains

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
4. **No email or SMS notifications.** The PRD open questions mention notifications —
   none are wired up. When a customer places an order, the only feedback is the
   confirmation page. The admin has to check the dashboard.
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
| `DATABASE_URL`       | local + Vercel | yes      | PostgreSQL connection string                       |
| `NEXT_PUBLIC_APP_URL`| local + Vercel | yes      | Used for absolute URLs (emails, etc. when added). Must be https in production. |
| `ADMIN_EMAIL`        | local + Vercel | yes (seed) | Owner email for the seeded admin                  |
| `ADMIN_PASSWORD`     | local + Vercel | yes (seed) | **Rotate in production.** Don't keep `admin@123`   |
| `AUTH_SECRET`        | local + Vercel | yes      | `openssl rand -base64 32`. Required by Auth.js. Asserted at startup. |
| `AUTH_TRUST_HOST`    | local + Vercel | yes      | `true` in hosted environments                      |
| `AUTH_USE_SECURE_COOKIES` | optional  | no       | Force `true`/`false`. Defaults to `NODE_ENV=production`. |
| `SENTRY_DSN`         | optional       | no       | If set, server errors are forwarded to Sentry.     |

---

## 12. Last verified

- Date: 2026-06-16
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run build` ✅ — 21 routes, 3 static, 18 dynamic
- `npm run prisma:seed` ✅
- Admin login: `admin@pousaydibani.com` / `admin@123` (dev only)

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
