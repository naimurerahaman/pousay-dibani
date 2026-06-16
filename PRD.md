# Pousay Dibani - Minimal Product Requirements Document

## 1. Product Summary

Pousay Dibani is a Khulna-based home delivery platform for everyday goods and products. Customers can browse available products, place orders for delivery inside Khulna city, and track order progress. Admins can manage products, inventory, delivery areas, orders, and delivery status from a secure dashboard.

## 2. Goals

- Launch a simple, reliable full stack MVP for Khulna city delivery.
- Allow customers to place orders without friction.
- Give admins a clear workflow for managing products and orders.
- Support public deployment with a production database, authentication, and basic monitoring.
- Build a foundation that can later support riders, online payment, promotions, and multi-area expansion.

## 3. Target Users

- Customers: People in Khulna city who want goods delivered to their home.
- Admin/operator: Business owner or staff managing catalog, inventory, and orders.
- Delivery staff: Person responsible for fulfilling and delivering confirmed orders.

## 4. MVP Scope

### Customer Features

- View home page with featured categories and products.
- Browse product list by category.
- Search products by name.
- View product details with price, image, description, and availability.
- Add products to cart.
- Update cart quantities and remove items.
- Checkout with name, phone number, delivery address, area, and notes.
- Choose cash on delivery for MVP.
- Receive order confirmation with order ID.
- Check order status using phone number and order ID.

### Admin Features

- Secure admin login.
- Dashboard summary for total orders, pending orders, delivered orders, and revenue.
- Create, edit, disable, and delete products.
- Manage product categories.
- Manage product price, image, stock status, and visibility.
- View all orders.
- Filter orders by status.
- Update order status: pending, confirmed, preparing, out for delivery, delivered, cancelled.
- View customer contact and delivery details.

### Delivery Area Rules

- Service area starts with Khulna city only.
- Admin can configure supported delivery areas.
- Checkout should block unsupported areas or show a clear message.
- Delivery fee can be fixed for MVP.

## 5. Out of Scope for MVP

- Online payment integration.
- Dedicated rider mobile app.
- Live GPS tracking.
- Vendor marketplace features.
- User wallet, loyalty points, coupons, or subscriptions.
- Multi-city support.
- Advanced inventory forecasting.

## 6. Core User Flows

### Customer Order Flow

1. Customer opens the website.
2. Customer browses or searches products.
3. Customer adds products to cart.
4. Customer enters delivery information.
5. Customer confirms cash on delivery order.
6. System creates the order and shows confirmation.
7. Admin reviews and updates the order status.
8. Customer checks status using order ID and phone number.

### Admin Order Flow

1. Admin logs in.
2. Admin reviews new pending orders.
3. Admin confirms or cancels the order.
4. Admin prepares the order.
5. Admin marks it out for delivery.
6. Admin marks it delivered after completion.

## 7. Suggested Tech Stack

- Frontend: Next.js with TypeScript.
- Styling: Tailwind CSS.
- Backend: Next.js API routes or server actions for MVP.
- Database: PostgreSQL.
- ORM: Prisma.
- Authentication: Auth.js or custom credentials auth for admin-only MVP.
- Image storage: Cloudinary or Supabase Storage.
- Deployment: Vercel for app hosting and Supabase/Neon for PostgreSQL.
- Monitoring: Vercel logs plus basic error logging.

## 8. Initial Data Model

### Product

- id
- name
- slug
- description
- price
- imageUrl
- categoryId
- stockStatus
- isActive
- createdAt
- updatedAt

### Category

- id
- name
- slug
- isActive

### Order

- id
- orderNumber
- customerName
- customerPhone
- deliveryAddress
- deliveryArea
- deliveryFee
- subtotal
- total
- status
- notes
- createdAt
- updatedAt

### OrderItem

- id
- orderId
- productId
- productName
- unitPrice
- quantity
- lineTotal

### AdminUser

- id
- name
- email
- passwordHash
- role
- createdAt

### DeliveryArea

- id
- name
- deliveryFee
- isActive

## 9. MVP Pages

- `/` - Home page.
- `/products` - Product listing and search.
- `/products/[slug]` - Product detail page.
- `/cart` - Cart page.
- `/checkout` - Checkout page.
- `/order-status` - Customer order lookup.
- `/admin/login` - Admin login.
- `/admin` - Admin dashboard.
- `/admin/products` - Product management.
- `/admin/categories` - Category management.
- `/admin/orders` - Order management.
- `/admin/delivery-areas` - Delivery area management.

## 10. Success Metrics

- Customer can place a valid order from mobile and desktop.
- Admin can add products and process orders without database access.
- Order status can be updated and viewed reliably.
- Public deployment is accessible by a production URL.
- MVP can support at least 100 products and daily order operations.

## 11. Milestones

### Milestone 1: Project Foundation

- Initialize Next.js app.
- Add TypeScript, Tailwind CSS, Prisma, PostgreSQL config.
- Create base layout, navigation, and environment setup.

### Milestone 2: Catalog and Cart

- Build category and product models.
- Build product listing, search, detail page, and cart state.
- Seed demo products for Khulna delivery use cases.

### Milestone 3: Checkout and Orders

- Build checkout form.
- Validate delivery area and phone number.
- Create order and order items.
- Build order confirmation and status lookup.

### Milestone 4: Admin Dashboard

- Add admin authentication.
- Build product, category, delivery area, and order management.
- Add order status updates.

### Milestone 5: Production Deployment

- Configure production database.
- Configure image storage.
- Add environment variables.
- Deploy to Vercel.
- Run smoke tests on production.

## 12. Open Questions

- What product categories should launch first?
- What are the exact supported delivery areas inside Khulna city?
- Should delivery fee be fixed or area-based at launch?
- Should customers need accounts, or should checkout remain guest-only for MVP?
- Who will receive new order notifications, and through what channel?
- What brand colors, logo, and language preference should the UI use?

