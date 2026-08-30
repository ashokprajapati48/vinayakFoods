# VINAYAK FOODS — Architecture Guide

VINAYAK FOODS is a restaurant management and point-of-sale system. It supports
cashier orders, two kitchen stations, waiter handoff, payments, customer credit,
and an administrator portal.

## System at a glance

```text
Browser (Next.js / React)
        |
        | HTTP + JWT                 Socket.IO events
        v                                  |
NestJS API + WebSocket Gateway <-----------+
        |
        | Prisma ORM
        v
PostgreSQL
```

The frontend runs on port `3000` and the API normally runs on port `3001`.
All REST endpoints use the `/api` prefix.

## Repository layout

```text
.
├── my-app/                         # Next.js frontend
│   ├── app/                         # App Router pages and layouts
│   │   ├── page.tsx                 # Login screen
│   │   └── dashboard/               # Role-specific screens
│   ├── components/                  # Reusable UI, including KitchenDisplay
│   ├── contexts/AuthContext.tsx     # Login, token storage and session state
│   ├── lib/api.ts                   # Axios API client and token refresh
│   ├── lib/socket.ts                # Shared Socket.IO client
│   └── types/                       # Shared frontend TypeScript types
│
├── backend/                         # NestJS API
│   ├── src/auth/                    # JWT login, refresh and profile endpoints
│   ├── src/orders/                  # Order creation and kitchen routing
│   ├── src/gateway/                 # Socket.IO event gateway
│   ├── src/menu/, tables/, ...      # Domain modules
│   ├── src/common/                  # Guards, decorators, filters and CORS
│   └── prisma/schema.prisma          # PostgreSQL data model
│
└── SYSTEM_DOCUMENTATION.md           # Detailed product and operational notes
```

## Frontend architecture

The frontend is a Next.js App Router application built with React and TypeScript.

| Area | Responsibility |
| --- | --- |
| `app/page.tsx` | Authenticates a user and sends them to their role dashboard. |
| `app/dashboard/layout.tsx` | Restores the session, renders shared navigation and handles logout. |
| `app/dashboard/admin` | Reporting and system-management screens. |
| `app/dashboard/cashier` | POS, orders, customers, payments and credit. |
| `app/dashboard/kitchen-1`, `kitchen-2` | Kitchen display stations. |
| `app/dashboard/waiter` | Ready-order and serving workflow. |
| `contexts/AuthContext.tsx` | Stores access/refresh tokens in browser storage and manages the current user. |
| `lib/api.ts` | Adds `Authorization: Bearer <token>` and refreshes expired access tokens. |
| `lib/socket.ts` | Keeps one reconnecting Socket.IO connection per browser session. |

### API address resolution

`lib/config.ts` selects the backend address in this order:

1. `NEXT_PUBLIC_API_URL`, if configured.
2. The current browser host on port `3001` (useful for tablets on the LAN).
3. `http://localhost:3001` for local development.

## Backend architecture

NestJS is organized by business domain. Each module normally contains a
controller (HTTP routes), a service (business logic), DTOs (validation), and a
Nest module definition.

```text
Request
  -> Controller
  -> JwtAuthGuard / RolesGuard (where enabled)
  -> DTO validation (global ValidationPipe)
  -> Service
  -> PrismaService
  -> PostgreSQL
```

`main.ts` configures the `/api` prefix, CORS, strict DTO validation, error
handling, and JSON serialization of Prisma Decimal values.

### Core backend modules

| Module | Purpose |
| --- | --- |
| `auth` | Login, refresh-token rotation, logout, current profile and password changes. |
| `users` | Administrator-managed application accounts. |
| `menu` | Categories, menu items, availability and kitchen assignment. |
| `tables` | Dine-in tables, capacity and availability status. |
| `customers` | Customer directory and customer status. |
| `orders` | Creates orders, calculates totals, assigns kitchen stations and tracks progress. |
| `payments` | Records cash, online and credit payments. |
| `credit` | Customer outstanding balance and ledger entries. |
| `expenses` | Expense categories, expense entries and summaries. |
| `staff` | Staff records and salary payments. |
| `reports` | Dashboard metrics, sales analytics and expense reporting. |
| `gateway` | Publishes live changes to Socket.IO clients. |

## Authentication and roles

Users log in with a username and password. The backend verifies the bcrypt hash,
returns a short-lived access token and a refresh token, and stores only a hash of
the refresh token in the database.

| Role | Main responsibility | Default dashboard |
| --- | --- | --- |
| `ADMIN` | Menu, tables, staff, financials, reports and user management. | `/dashboard/admin` |
| `CASHIER` | Create orders, collect payments and manage customers. | `/dashboard/cashier` |
| `KITCHEN1` | Prepare items assigned to Kitchen 1. | `/dashboard/kitchen-1` |
| `KITCHEN2` | Prepare items assigned to Kitchen 2. | `/dashboard/kitchen-2` |
| `WAITER` | Collect and serve orders when all stations are ready. | `/dashboard/waiter` |

Protected API routes use `JwtAuthGuard`. The `users` module additionally applies
`RolesGuard` and restricts its routes to administrators.

## Order lifecycle

```text
Cashier creates order
        |
        v
Order + OrderItems are saved in one database transaction
        |
        +--> Items are grouped by KITCHEN_1 / KITCHEN_2
        +--> One KitchenOrder is created for each required station
        +--> Dine-in table becomes OCCUPIED
        |
        v
Kitchen station changes NEW -> PREPARING -> READY
        |
        v
Every required station ready?
        |
        +-- no --> order remains NEW or PREPARING
        |
        +-- yes -> Order becomes READY -> waiter is notified
        |
        v
Waiter marks it collected; cashier records payment
        |
        v
Completed dine-in order is closed and its table is released
```

Order totals are calculated by the server from current menu prices. An order
records the menu item, quantity, price at ordering time, assigned kitchen, and
kitchen status for each item.

## Data model

The complete Prisma definition is in `backend/prisma/schema.prisma`.

```text
User ──< Order ──< OrderItem >── MenuItem >── Category
          |  \\
          |   \\──< KitchenOrder
          |    \\── Payment
          |     \\── DeliveryInfo
          |      \\── CreditLedger >── Customer
          \\── Table

Customer ──< CreditLedger
ExpenseCategory ──< Expense
Staff ──< SalaryPayment
```

Important entities:

- `Order` is the central ticket, with `DINE_IN` or `DELIVERY` type.
- `OrderItem` stores a snapshot of item price and kitchen routing.
- `KitchenOrder` stores each station's aggregate status for an order.
- `Payment` is currently one-to-one with an order.
- `CreditLedger` preserves debits and repayments and stores the balance after each entry.
- `Table` is marked `AVAILABLE`, `OCCUPIED`, or `RESERVED`.

## Real-time events

The Socket.IO gateway broadcasts updates after order, kitchen, payment, and table
changes. The browser client reconnects automatically.

| Event | Meaning |
| --- | --- |
| `order:new` | A new order was created. |
| `order:statusUpdate` | An order changed overall status. |
| `kitchen:statusUpdate` | Kitchen-specific status changed. |
| `payment:recorded` | A payment was recorded. |
| `table:statusUpdate` | A table status changed. |

## REST API groups

| Prefix | Domain |
| --- | --- |
| `/api/auth` | Authentication and profile. |
| `/api/users` | User administration. |
| `/api/menu` | Categories and menu items. |
| `/api/tables` | Table management. |
| `/api/customers` | Customer directory. |
| `/api/orders` | Orders, ready queue and kitchen queue. |
| `/api/payments` | Payments and daily summary. |
| `/api/credit` | Outstanding credit and ledger operations. |
| `/api/expenses` | Expense entries and summaries. |
| `/api/staff` | Staff and salaries. |
| `/api/reports` | Dashboard and reporting data. |

## Run locally

Prerequisites: Node.js, npm, and a PostgreSQL database with a configured
`DATABASE_URL` in `backend/.env`.

```powershell
# Terminal 1: database schema and backend
cd backend
npx prisma db push
npm run db:seed
npm run start:dev

# Terminal 2: frontend
cd my-app
npm run dev
```

Open `http://localhost:3000`. The API health endpoint is
`http://localhost:3001/api/health`.

## Production checklist

- Set unique, strong `JWT_SECRET` and `JWT_REFRESH_SECRET` values.
- Set an explicit `CORS_ORIGIN`; do not rely on development LAN defaults.
- Use HTTPS and configure `NEXT_PUBLIC_API_URL` for the deployed API.
- Apply role checks to every sensitive backend route, not only the user module.
- Authenticate Socket.IO connections with a JWT; do not trust a client-supplied role.
- Validate payment amounts against totals or introduce an explicit discount/adjustment model.
- Add audit-log writes for payments, cancellations, credit changes and account changes.
- Disable the offline demo-login path in a production build.
#   V i n a y a k F o o d s W i f i S e t u p  
 