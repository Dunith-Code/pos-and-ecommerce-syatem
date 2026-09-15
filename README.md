# POS & E-Commerce Order/Payment System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-11%20passing-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Deploy](https://img.shields.io/badge/Backend-Railway-0B0D0E?logo=railway&logoColor=white)](https://railway.app/)
[![Deploy](https://img.shields.io/badge/Frontend-Netlify-00C7B7?logo=netlify&logoColor=white)](https://netlify.com/)

## 📖 Introduction
 
This project is a concurrency-safe order and payment platform built around a shared inventory core, split into two applications: a point-of-sale system for in-person, cashier-driven transactions, and an e-commerce storefront for online shoppers. Both handle the same underlying problem: reserving limited stock safely when many people might try to buy the same item at once, processing payments that can succeed, fail, or time out, and keeping every order's status consistent through cancellations and refunds. Rather than solving that problem twice, the core logic (stock reservation, payment handling, order lifecycle) lives in one shared package that both applications build on.

**Repository:** https://github.com/Dunith-Code/pos-and-ecommerce-system

---

## 📐 Diagrams

### Use Case Diagram

![Use Case Diagram](docs/diagrams/use_case_diagram.drawio.png)

### Class Diagram

![Class Diagram](docs/diagrams/class_diagram.drawio.png)

### Order State Diagram

![Order State Diagram](docs/diagrams/order_state_diagram.drawio.png)

### Checkout Sequence Diagram

![Checkout Sequence Diagram](docs/diagrams/sequence_diagram_checkout.drawio.png)

### Sequence Diagram (Reservation Expiry Job)

![Reservation Expiry Sequence](docs/diagrams/sequence_diagram_job.drawio.png)

### Deployment Diagram

![Deployment Diagram](docs/diagrams/deployment_diagram.drawio.png)

---

## 🌐 Live Deployments
 
| | Live URL |
|---|---|
| **Section 01: POS Order & Inventory System** | https://pos-ecommerce-section01.netlify.app |
| **Section 02: E-Commerce Checkout & Payment System** | https://pos-ecommerce-section02.netlify.app |
| **Shared backend API** | https://pos-and-ecommerce-system-production.up.railway.app |
 
> **Note on folder naming:** the assessment brief refers to `/task-01` and `/task-02`. This repository uses `/section-01` and `/section-02` instead, with the same structure and mapping, just a different naming choice made early in the build. `section-01` is Task 01 (POS), `section-02` is Task 02 (E-commerce).

---

## 🏗️ Architecture
 
Both tasks share the exact same domain logic. Stock reservation, mock payment processing, order lifecycle, and cancellation are identical business rules whether the customer is a cashier at a POS terminal or a shopper checking out online. Rather than duplicate that logic, it lives once in a shared package and both tasks build on top of it:

```
pos-and-ecommerce-system/
├── packages/core/          # Shared domain logic (Prisma schema, reservation,
│                            # payment, order services, expiry cron job)
├── section-01/
│   ├── backend/             # POS Order & Inventory System (Express + core)
│   └── frontend/            # POS UI (React + Vite + Tailwind)
└── section-02/
    ├── backend/              # E-Commerce Checkout & Payment System (Express + core)
    └── frontend/             # Storefront UI (React + Vite + Tailwind)
```
**Deployment note:** both backends are deployed as a single combined Railway service (`server.combined.ts`), mounting Section 01's routes under `/section-01/api/*` and Section 02's routes under `/section-02/api/*`. This was a deliberate choice given how much logic the two tasks share (identical order/payment/cancellation code). Each frontend is still deployed and fully testable independently, and calls the shared backend under its own path prefix. Locally, each backend can also run standalone on its own port (`section-01/backend` on 4001, `section-02/backend` on 4002) via `npm run dev`.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Database:** PostgreSQL, accessed via Prisma ORM 7 (with `@prisma/adapter-pg` driver adapter)
- **Testing:** Vitest
- **Scheduling:** node-cron (reservation expiry job)
- **Deployment:** Railway (backend and Postgres), Netlify (both frontends)

---


## 🧠 Core Domain Logic

This is the heart of the assessment: concurrency-safe stock reservation, mock payments, and order lifecycle management, shared by both tasks (`packages/core`).
 
- **Concurrency-safe reservation:** stock is decremented with a single atomic SQL statement (`UPDATE "Product" SET stock = stock - $qty WHERE id = $id AND stock >= $qty`). If two requests race for the last unit, only one `UPDATE` affects a row; the other gets 0 rows affected and is rejected. No application-level check-then-write race condition.
- **5-minute reservation expiry:** a `node-cron` job runs every 30 seconds, finds `RESERVED` orders past their `reservedUntil` timestamp, flips them to `EXPIRED`, and releases the held stock, all inside one transaction per order.
- **Mock payment gateway:** simulates SUCCESS, FAILED, and TIMEOUT outcomes. SUCCESS marks the order `PAID`. FAILED marks it `FAILED` and releases stock. TIMEOUT leaves it `RESERVED` for the expiry job to resolve. Duplicate payment attempts (same idempotency key, or a second attempt against an already-`PAID` order) are rejected without double-processing.
- **Order lifecycle:** a single source-of-truth transition table (`PENDING -> RESERVED -> PAID/FAILED/EXPIRED/CANCELLED`) is enforced on every status change; illegal transitions throw rather than silently succeeding.
- **Cancellation:** valid from `PENDING`, `RESERVED`, or `PAID`. Releases held stock, and simulates a refund (logged) if the order had already been paid.

---

### 🧪 Automated Test Coverage

11 tests across 4 files (`packages/core/tests/`), all passing:
 
| File | Covers |
|---|---|
| `concurrency.test.ts` | Fires 20 simultaneous checkout requests against 5 units of stock; asserts exactly 5 succeed and final stock is 0 |
| `expiry.test.ts` | Reserves stock, forces the reservation into the past, confirms the cron job expires it and restores stock |
| `payment.test.ts` | SUCCESS/FAILED/TIMEOUT outcomes, duplicate-payment rejection |
| `orderService.test.ts` | Cancellation from RESERVED and PAID states, rejected cancellation of terminal-state orders |

Run the suite:
```bash
npm run core:test
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 20+
- npm
- A PostgreSQL database (local or hosted)
### 1. Clone and install
```bash
git clone https://github.com/Dunith-Code/pos-and-ecommerce-system.git
cd pos-and-ecommerce-system
npm install
```
 
### 2. Configure environment variables
 
Copy each `.env.example` to `.env` and fill in your database connection string:
 
```bash
cp packages/core/.env.example packages/core/.env
cp section-01/backend/.env.example section-01/backend/.env
cp section-02/backend/.env.example section-02/backend/.env
```
 
| Variable | Where | Description |
|---|---|---|
| `DATABASE_URL` | `packages/core/.env`, both backend `.env` files | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/pos_ecom?schema=public` |
| `PORT` | Each backend `.env` | `4001` for section-01, `4002` for section-02 (only used when running standalone) |
| `CORS_ORIGIN` | Each backend `.env` (production) | Comma-separated list of allowed frontend origins, e.g. `https://pos-ecommerce-section01.netlify.app,https://pos-ecommerce-section02.netlify.app` |
| `VITE_API_URL` | Set in Netlify dashboard for each frontend | Base URL of the deployed backend (e.g. the Railway URL) |
 
### 3. Run database migrations
```bash
npm run core:migrate
```
 
### 4. Run the automated test suite
```bash
npm run core:test
```
Expected: 4 test files, 11 tests, all passing.
 
### 5. Run locally
 
**Option A: standalone (two separate backends):**
```bash
# Terminal 1
cd section-01/backend && npm run dev     # http://localhost:4001
 
# Terminal 2
cd section-02/backend && npm run dev     # http://localhost:4002
 
# Terminal 3
cd section-01/frontend && npm run dev    # http://localhost:5173
 
# Terminal 4
cd section-02/frontend && npm run dev    # http://localhost:5174
```
 
**Option B: combined backend (matches the deployed setup):**
```bash
cd section-01/backend
npm run build
node dist/server.combined.js             # serves both /section-01/api/* and /section-02/api/* on :4001
```
If using Option B, each frontend's `client.ts` expects the `/section-01/api` or `/section-02/api` prefix. This is already baked in, matching the deployed configuration.
 
---
 
## 🎯 How to Test Each Feature
 
### 🏪 Section 01: POS Order & Inventory System
1. Open the live URL (or `localhost:5173`)
2. **Products tab:** add a product with a name, price, and stock count; confirm it appears in the table; delete a product
3. **Checkout tab:** select a product and quantity, click **Reserve stock**. Confirm the order shows status `RESERVED` with a "reserved until" timestamp
4. Click **Simulate success**. Confirm status flips to `PAID`
5. Reserve a second order, click **Simulate failure**. Confirm status flips to `FAILED` and the product's stock count is restored
6. Reserve a third order, click **Simulate timeout**. Confirm the order stays `RESERVED` (it will auto-expire after 5 minutes, restoring stock)
7. **Order history tab:** confirm all orders and their statuses are listed; click **Cancel order** on any `PENDING`/`RESERVED`/`PAID` order and confirm it moves to `CANCELLED` with stock restored (and a refund logged server-side if it was `PAID`)
### 🛍️ Section 02: E-Commerce Checkout & Payment System
1. Open the live URL (or `localhost:5174`)
2. **Shop tab:** use the search box and min/max price filters to confirm results narrow correctly; toggle "In stock only"
3. Click a product to open its detail page, set a quantity, click **Buy now**
4. On the checkout screen, click **Reserve & continue**, then **Simulate success**
5. **Order history tab:** confirm the order appears as `PAID`; cancel a different open order and confirm stock restoration
### 🔥 Concurrency (no-overselling) proof
This is verified by an automated test rather than manual UI testing, since it requires firing simultaneous requests:
```bash
npm run core:test -- concurrency
```
This creates a product with 5 units of stock and fires 20 simultaneous reservation requests against it. The test asserts exactly 5 succeed, 15 are rejected with an out-of-stock error, and the product's final stock is exactly 0, proving the atomic decrement pattern prevents overselling under real concurrent load.
 
---
 
## ⚠️ Known Limitations
 
- Netlify's free-tier projects default to private visibility. Both frontends here have been explicitly set to public so they're reachable without a Netlify account.
- Railway's free trial credit is time-limited. If this deployment appears down after an extended period, the trial credit has likely been exhausted; the codebase itself remains fully functional and redeployable.
- The mock payment gateway's SUCCESS/FAILED/TIMEOUT outcome can be forced explicitly via the `forcedOutcome` parameter (used by both UIs' "Simulate X" buttons) for deterministic testing, in addition to its default random-outcome behavior.

---

## 🎥 Demo Walkthrough

> Screen Recording: 📹 Screen recording will be added here shortly.

---

**Dunith Desitha Athukorala**