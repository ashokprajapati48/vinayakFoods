# 🍽️ VINAYAK FOODS — Comprehensive Technical & Architecture Documentation

## 1. System Overview
**VINAYAK FOODS** is a full-stack, enterprise-grade Restaurant Management & Point-of-Sale (POS) system designed for multi-station kitchen coordination, dine-in/delivery order handling, customer credit tracking, employee payroll, and real-time operational analytics.

---

## 2. Technology Stack

### Frontend Architecture
- **Framework**: Next.js 16.3 (Turbopack, App Router, React 19)
- **Styling**: TailwindCSS 4, Custom Glassmorphism Design System, Lucide Icons
- **State & Data Fetching**: `@tanstack/react-query`, Axios with JWT interceptors
- **Real-Time Communication**: `socket.io-client` with role-based room subscriptions
- **Visualization**: `recharts` for sales, revenue, and order velocity charts
- **Notifications**: `react-hot-toast`

### Backend Architecture
- **Framework**: NestJS 11 (Modular Architecture with Dependency Injection)
- **Database & ORM**: PostgreSQL + Prisma ORM 7 (`@prisma/adapter-pg`)
- **Authentication**: Passport-JWT, Refresh Tokens, Bcrypt Password Hashing
- **Real-Time Gateway**: `@nestjs/websockets`, `@nestjs/platform-socket.io` (Socket.IO Gateway)
- **Validation**: `class-validator`, `class-transformer` with strict Global Validation Pipe

---

## 3. Database Schema & Data Models (PostgreSQL / Prisma)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │    Table     │       │   Customer   │
│  (Auth/Role) │       │ (Dine-in 1-20)│       │ (Credit/CRM) │
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │                      │                      │
       └──────────────┐       │       ┌──────────────┘
                      ▼       ▼       ▼
                    ┌──────────────────┐
                    │      Order       │
                    │(NEW/PREP/READY..)│
                    └─────────┬────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│    OrderItem     │ │   KitchenOrder   │ │     Payment      │
│ (KITCHEN_1 / 2)  │ │ (K1 / K2 status) │ │(CASH/ONLINE/CRD) │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Core Entities

| Model | Purpose | Key Attributes |
|---|---|---|
| **User** | System users & staff authentication | `id`, `username`, `passwordHash`, `displayName`, `role`, `refreshToken` |
| **Category** | Menu groupings | `id`, `name`, `sortOrder`, `isActive` |
| **MenuItem** | Food & beverage catalog | `id`, `name`, `price`, `kitchen` (KITCHEN_1 / KITCHEN_2), `categoryId`, `isAvailable` |
| **Table** | Physical dine-in tables | `id`, `number` (1–20), `capacity`, `status` (AVAILABLE, OCCUPIED, RESERVED) |
| **Customer** | Customer directory & credit | `id`, `name`, `mobile`, `address`, `creditBalance` |
| **Order** | Dine-in & Delivery tickets | `id`, `orderNumber` (Auto-inc), `type` (DINE_IN/DELIVERY), `status`, `subtotal`, `total` |
| **OrderItem** | Specific dish items per order | `id`, `orderId`, `menuItemId`, `quantity`, `unitPrice`, `kitchen`, `kitchenStatus` |
| **KitchenOrder** | Station-specific aggregate state | `id`, `orderId`, `kitchen` (KITCHEN_1/KITCHEN_2), `status` (NEW/PREPARING/READY) |
| **Payment** | Invoicing & transactions | `id`, `orderId`, `amount`, `method` (CASH/ONLINE/CREDIT), `status` |
| **CreditLedger** | Khata / Customer credit history | `id`, `customerId`, `orderId`, `type` (DEBIT/CREDIT), `amount`, `balanceAfter` |
| **DeliveryInfo** | Delivery orders metadata | `id`, `orderId`, `customerId`, `address`, `deliveryBoy`, `phone`, `status` |
| **Expense** | Operational expenses | `id`, `categoryId`, `amount`, `date`, `paymentMethod`, `createdBy` |
| **Staff & Salary** | Employee registry & payroll | `name`, `role`, `salary`, `status` + `SalaryPayment` monthly records |
| **AuditLog** | Security & activity audit | `userId`, `action`, `entity`, `entityId`, `details`, `ipAddress` |

---

## 4. Multi-Role System & Station Workflows

```mermaid
graph LR
    Cashier([Cashier / Waiter]) -->|Creates Order| Backend[NestJS API & Socket Gateway]
    Backend -->|Auto-splits K1 Items| K1[Kitchen 1: Tandoor / Curries]
    Backend -->|Auto-splits K2 Items| K2[Kitchen 2: Chinese / Rice / Fast Food]
    K1 -->|Mark Ready| Gateway((Socket Gateway))
    K2 -->|Mark Ready| Gateway
    Gateway -->|All items ready| WaiterStation[Waiter / Food Runner Queue]
    WaiterStation -->|Collected & Served| TableStatus[Table Occupied / Served]
    Cashier -->|Settle Bill Cash/Online/Credit| Settle[Payment / Credit Ledger]
    Admin([Admin Portal]) -->|Monitor| Analytics[Live Analytics, P&L, Staff]
```

### Role Breakdown

#### 1. Administrator (`ADMIN`)
- **Dashboard**: Live revenue, order velocity, active kitchen queues, quick statistics.
- **Menu Management**: Create/update items, assign to Kitchen 1 (Tandoor/Curries) or Kitchen 2 (Chinese/Rice/Fast Food), toggle availability.
- **Table Management**: Real-time table status grid (Available, Occupied, Reserved).
- **Customer & Credit**: Ledger tracking (debit/credit adjustments), payment settlements.
- **Financials**: Daily/monthly revenue reports, expense categories & tracking, staff salary disbursement.
- **System Settings & Auditing**: User creation, audit log inspection.

#### 2. Cashier (`CASHIER`)
- **POS / New Order**: Interactive menu grid, live cart, table selection, customer auto-complete.
- **Order Management**: Filter by status, view split items, print receipts.
- **Billing & Settlements**: Split payments, cash/UPI/credit settlement with instant receipt generation.
- **Credit (Khata)**: Customer balance search, outstanding dues, quick collection.

#### 3. Kitchen 1 (`KITCHEN1` - Tandoor & Indian Gravies)
- **KDS (Kitchen Display System)**: Real-time ticket cards via WebSocket.
- **Item Progression**: `NEW` ➔ `PREPARING` ➔ `READY`.
- **Sound Alerts**: Audio chime on new incoming orders.

#### 4. Kitchen 2 (`KITCHEN2` - Chinese, Rice, Fast Food)
- **Dedicated KDS**: Receives only items routed to Kitchen 2.
- **Independent Progression**: Tracks status independently from Kitchen 1.

#### 5. Waiter (`WAITER`)
- **Order Ready Queue**: Real-time notification when all items for a table are marked `READY` across both kitchens.
- **Delivery Confirmation**: Marks order as `COLLECTED` / `SERVED`.

---

## 5. Backend Modules & API Surface

All API routes are prefixed with `/api`:

| Module | Route Prefix | Main Endpoints |
|---|---|---|
| **Auth** | `/api/auth` | `POST /login`, `POST /refresh`, `POST /logout` |
| **Users** | `/api/users` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` |
| **Menu** | `/api/menu` | `GET /categories`, `POST /categories`, `GET /items`, `POST /items`, `PUT /items/:id` |
| **Tables** | `/api/tables` | `GET /`, `POST /`, `PUT /:id/status`, `DELETE /:id` |
| **Customers**| `/api/customers` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| **Orders** | `/api/orders` | `GET /`, `POST /`, `GET /ready`, `GET /kitchen/:kitchen`, `PUT /:id/status`, `PUT /:orderId/kitchen/:kitchen/status` |
| **Payments** | `/api/payments` | `GET /`, `POST /`, `GET /summary/today`, `GET /order/:orderId` |
| **Credit** | `/api/credit` | `GET /outstanding`, `GET /ledger`, `GET /customer/:customerId`, `POST /customer/:customerId/payment` |
| **Expenses** | `/api/expenses` | `GET /`, `POST /`, `GET /categories`, `POST /categories`, `GET /summary` |
| **Staff** | `/api/staff` | `GET /`, `POST /`, `PUT /:id`, `POST /:id/salary`, `GET /salary/history` |
| **Reports** | `/api/reports` | `GET /dashboard`, `GET /sales/daily`, `GET /sales/analytics`, `GET /expenses` |
| **Gateway** | WebSocket | Rooms: `ADMIN`, `CASHIER`, `KITCHEN1`, `KITCHEN2`, `WAITER` |

---

## 6. Seed Accounts & Credentials

When the database is seeded (`npm run db:seed`), the following test accounts are ready:

| Role | Username | Default Password | Initial Route |
|---|---|---|---|
| **Admin** | `admin` | `Admin@123` | `/dashboard/admin` |
| **Cashier** | `cashier` | `Cashier@123` | `/dashboard/cashier` |
| **Kitchen 1** | `kitchen1` | `Kitchen1@123` | `/dashboard/kitchen-1` |
| **Kitchen 2** | `kitchen2` | `Kitchen2@123` | `/dashboard/kitchen-2` |
| **Waiter** | `waiter` | `Waiter@123` | `/dashboard/waiter` |

---

## 7. Current Development Status & Recent Fixes

### Completed & Functional
1. **Frontend Architecture**:
   - All 5 role-specific dashboard interfaces built with glassmorphism UI.
   - POS cart system, Kitchen KDS interfaces, Table grid, Credit management screens.
   - Real-time updates on every screen via a shared Socket.IO connection.
   - Offline fallback that is clearly labelled, used only when the API is unreachable.
2. **Backend Architecture**:
   - NestJS 11 modular micro-architecture fully configured.
   - Prisma schema with 14 relational models, cascade deletes, and indexing.
   - Real-time Socket.IO gateway with station room separation.
   - PostgreSQL 16 installed, schema applied, seed data loaded.

### Resolved Issues (2026-08-23)
- **`Cannot GET /` 404**: the API root now returns a service/health payload pointing at the UI, and `/api/health` reports database status.
- **Kitchen screens**: infinite loading spinner, missing WebSocket wiring (`window.__socket` was never assigned), stale demo tickets shown when the live queue was empty, and READY tickets rendered as "PREPARING" — all fixed. Both stations now share one component with live updates, a new-order chime, ticking wait timers and urgency highlighting after 15 minutes.
- **Money fields**: Prisma `Decimal` columns serialized as strings, so `sum + order.total` concatenated and `.toFixed()` threw. A global serialize interceptor converts them to numbers (HTTP *and* socket payloads).
- **Dine-in tables were never released**: paying a served dine-in order now closes it and frees the table; the cashier has an explicit "Close & free table" action and admin can set any table's status by hand.
- **Login fallback**: a wrong password against a reachable server no longer logs you into demo mode.
- **Missing endpoints added**: `POST /api/auth/change-password`, `PATCH /api/auth/profile`, `GET /api/auth/me`, `PUT /api/tables/:id`.
- **Customer management**: `isActive` toggle accepted, inactive customers listable, duplicate mobile numbers return 409 with a readable message.
- **Delivery orders**: address/phone are stored even without a saved customer record (`delivery_info.customer_id` is now nullable).
- **Validation**: bad `status`/`kitchen` values return 400 with the allowed list instead of a 500.
- **Multi-device**: API base URL and CORS resolve automatically for LAN devices, so kitchen tablets work without extra configuration.

### Known Limitations
- `next lint` reports pre-existing `react-hooks/set-state-in-effect` warnings for the fetch-in-`useEffect` data pattern used across the screens. Harmless today; migrating to the already-installed `@tanstack/react-query` would clear them.
- Payments are one-per-order (no split payments) and the amount is not forced to equal the order total, which leaves room for discounts but also for mistakes.

---

## 8. Quick Start Guide

### 1. Database (already provisioned on this machine)
```bash
cd backend
npx prisma db push     # apply schema changes
npm run db:seed        # reload demo data (optional)
```

### 2. Run Both Development Servers
```bash
# Terminal 1 - Backend (Port 3001)
cd backend
npm run start:dev

# Terminal 2 - Frontend (Port 3000)
cd my-app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the app.
`http://localhost:3001` is the API — it answers with a status page, and `/api/health` reports the database connection.
