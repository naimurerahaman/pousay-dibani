# Pousay Dibani

Pousay Dibani is a full-stack home delivery MVP for Khulna city, Bangladesh. It gives customers a simple storefront for browsing everyday goods, placing cash-on-delivery orders, and checking order status. It also includes a protected admin console for managing products, categories, delivery areas, and order fulfillment.

Live site: [https://pousay-dibani.vercel.app](https://pousay-dibani.vercel.app)

## Features

- Customer storefront with home, product listing, product detail, cart, checkout, and order status pages
- Product search and category filtering
- Local cart state with quantity updates and item removal
- Cash-on-delivery checkout with delivery area validation
- Order lookup by order number and customer phone
- Admin authentication with Auth.js credentials
- Admin dashboard for order and revenue summaries
- Product, category, and delivery area management
- Order status workflow: pending, confirmed, preparing, out for delivery, delivered, cancelled
- PostgreSQL persistence through Prisma
- Supabase-ready database configuration
- Vercel deployment configuration and smoke test script

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | React 19, CSS design tokens, lucide-react icons |
| Database | PostgreSQL |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | Auth.js v5 credentials provider |
| Validation | Zod |
| Deployment | Vercel |
| Database hosting | Supabase/PostgreSQL compatible |

## App Routes

### Customer

- `/` - Home page
- `/products` - Product catalog with search and category filter
- `/products/[slug]` - Product detail page
- `/cart` - Shopping cart
- `/checkout` - Cash-on-delivery checkout
- `/order-status` - Customer order lookup

### Admin

- `/admin/login` - Admin sign in
- `/admin` - Admin dashboard
- `/admin/orders` - Order management
- `/admin/products` - Product management
- `/admin/categories` - Category management
- `/admin/delivery-areas` - Delivery area management

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database, local or hosted

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in real values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. Use a pooled Supabase connection string in production. |
| `NEXT_PUBLIC_APP_URL` | App base URL, for example `http://localhost:3000` locally or the Vercel URL in production. |
| `AUTH_SECRET` | Auth.js secret. Generate with `openssl rand -base64 32`. |
| `AUTH_TRUST_HOST` | Set to `true` for Vercel/hosted environments. |
| `ADMIN_EMAIL` | Initial admin email used by the seed script. |
| `ADMIN_PASSWORD` | Initial admin password used by the seed script. Use a strong value in production. |
| `SENTRY_DSN` | Optional server-side error reporting endpoint. |
| `RESEND_API_KEY`, `ORDER_NOTIFY_TO`, `ORDER_NOTIFY_FROM` | Optional. Email new-order alerts to the admin via Resend. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Optional. Telegram new-order alerts. |
| `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_PHONE` | Optional. Storefront footer contact details. |

Never commit `.env` or real secrets.

### Order notifications

When a customer checks out, the admin can be alerted by **email (Resend)** and/or
**Telegram**. Both channels are best-effort and never block checkout — if their
env vars are unset, that channel is silently skipped. See `.env.example` for setup.

### Inventory

Products carry a numeric `stockQty`. Placing an order decrements stock atomically
(no overselling under concurrent checkouts); cancelling an order in the admin
returns the stock. A product shows as sold out when `stockQty` reaches 0 or its
status is set to `OUT_OF_STOCK`. After the inventory migration, run
`npm run backfill:stock` once to seed stock for pre-existing products.

### 3. Apply database migrations

```bash
npm run prisma:migrate
```

### 4. Seed initial data

```bash
npm run prisma:seed
```

The seed creates starter categories, products, delivery areas, and an admin user from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Generate Prisma Client and build the production app. |
| `npm run start` | Start the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript type checking. |
| `npm run prisma:generate` | Generate Prisma Client. |
| `npm run prisma:migrate` | Run Prisma migrations in development. |
| `npm run prisma:seed` | Seed catalog, delivery areas, and admin account. |
| `npm run prisma:studio` | Open Prisma Studio. |
| `npm run scrape:prices` | Match catalog products to Shwapno by image id and refresh prices. Dry-run by default; add `-- --apply` to write. |
| `npm run backfill:stock` | Give existing products a starting `stockQty` (one-time after the inventory migration). |
| `npm run reset:admin-password` | Reset an admin password from the CLI (lockout recovery). |
| `npm test` | Run the Vitest unit tests. |
| `npm run smoke` | Smoke-test key routes against a running app. |

## Database Notes

The Prisma schema targets PostgreSQL. Because this project uses Prisma 7 with the PostgreSQL driver adapter, the datasource URL is configured through `prisma.config.ts` rather than directly inside `prisma/schema.prisma`.

The runtime database client checks these environment variables in order:

1. `DATABASE_URL`
2. `POSTGRES_PRISMA_URL`
3. `POSTGRES_URL`

Blank values are ignored so hosted environments do not accidentally fall back to `localhost`.

## Deployment

The project is configured for Vercel.

### Production environment variables

Set these in Vercel Project Settings before deploying:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `AUTH_TRUST_HOST`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

For Supabase, use the pooled PostgreSQL connection string for `DATABASE_URL`.

### Deploy

```bash
vercel --prod
```

After deployment, apply migrations and seed the production database with the production `DATABASE_URL`:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

Then smoke-test the live deployment:

```bash
BASE_URL=https://pousay-dibani.vercel.app npm run smoke
```

## Project Structure

```text
pousay-dibani/
|-- prisma/
|   |-- schema.prisma
|   |-- seed.ts
|   `-- migrations/
|-- scripts/
|   `-- smoke-test.mjs
|-- src/
|   |-- app/
|   |   |-- admin/
|   |   |-- api/auth/[...nextauth]/
|   |   |-- cart/
|   |   |-- checkout/
|   |   |-- order-status/
|   |   `-- products/
|   |-- components/
|   |-- hooks/
|   |-- lib/
|   |-- auth.ts
|   `-- proxy.ts
|-- supabase/
|   `-- config.toml
|-- next.config.ts
|-- prisma.config.ts
|-- vercel.json
`-- package.json
```

## Production Checklist

- Configure all required Vercel environment variables
- Run production migrations
- Seed the initial admin account
- Visit `/admin/login` and confirm admin access
- Place a test order from the storefront
- Confirm the order appears in `/admin/orders`
- Update the order status and verify it through `/order-status`
- Run the smoke test against the production URL

## Roadmap

Done since the initial MVP:

- ✅ Email + Telegram notifications for new orders
- ✅ Inventory tracking (decrement on order, revert on cancel)
- ✅ Audit log (timeline) for order status changes
- ✅ Real catalog prices synced from source
- ✅ Admin password change + CLI reset
- ✅ Order-submission rate limiting
- ✅ Unit tests for cart/order/rate-limit logic

Still open:

- Product image upload through Supabase Storage or another media provider
- Customer accounts and order history
- Payment integration for bKash, Nagad, or another provider
- Rider/delivery assignment workflow
- Shared (Redis/KV) rate-limit store for multi-instance deploys
- End-to-end tests for checkout and admin workflows

## License

This project is private and maintained for the Pousay Dibani home delivery MVP.
