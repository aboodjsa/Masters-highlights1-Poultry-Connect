# PoultryConnect

A full-stack cloud web application that lets poultry farmers list stock directly and lets wholesale buyers discover and order it in real time — with no middlemen and no broker fees. This document covers system architecture, technology justifications, database design, API specification, security model, cloud deployment, and local development setup.

**PS: Fill in your live links below once deployed.**

### Project Links
- Frontend: `your-app.vercel.app`
- Backend API: `your-api.onrender.com`
- Repository: `https://masters-highlights1-poultry-connect.vercel.app/`

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack & Justifications](#3-technology-stack--justifications)
4. [Database Design](#4-database-design)
5. [API Reference](#5-api-reference)
6. [Security Design](#6-security-design)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Cloud Deployment](#8-cloud-deployment)
9. [Local Development](#9-local-development)
10. [Environment Variables](#10-environment-variables)
11. [Architectural Decisions — Summary](#11-architectural-decisions--summary)
12. [Screenshots](#12-screenshots)

---

## 1. Project Overview

Smallholder poultry farmers commonly sell through one or more intermediaries before their stock reaches an actual wholesale buyer — a hotel, distributor, or market trader — which compresses the farmer's margin and leaves the buyer with little visibility into supply or price. PoultryConnect removes that layer: farmers publish live listings, buyers browse and order directly, and the whole transaction — discovery, ordering, and status tracking — happens in a single authenticated web session.

### Core User Flows

| User type | Primary actions |
|---|---|
| **Guest** | Browse the public marketplace, filter listings by poultry type and location |
| **Farmer** (authenticated) | Create, edit, delete, and toggle the status of listings; view and act on incoming orders (accept / reject / mark completed) |
| **Buyer** (authenticated) | All guest actions + place an order on a listing, track order status on a personal dashboard |

### Key Features
- Role-based accounts (farmer / buyer) enforced at both the API and the client route level
- Live marketplace with server-side filtering by poultry type and location
- Server-side stock validation — an order cannot exceed a listing's available quantity
- Explicit order lifecycle: `pending → accepted / rejected → completed`, tracked independently of listing availability
- JWT-based, stateless authentication with ownership checks on every write (a farmer can only modify their own listings and act on orders placed against them)
- Auth-aware navigation: guests see **Log in / Get started**; logged-in users see role-specific dashboard links and a logout control

---

## 2. System Architecture

### High-Level Diagram

![System architecture](./docs/screenshots/architecture_diagram.png)

### Request Lifecycle
1. The React SPA sends a request (e.g. "place an order") to the Express API as JSON over HTTPS.
2. If the route is protected, the `protect` middleware verifies the JWT from the `Authorization: Bearer` header and attaches the authenticated user to the request.
3. If the route is role-restricted, `restrictTo(role)` rejects the request with `403` if the user's role doesn't match.
4. The controller performs any ownership/business-rule checks (e.g. "does this listing belong to this farmer?", "does the order quantity exceed stock?") before touching the database.
5. Mongoose reads or writes the relevant MongoDB Atlas collection and the controller returns a JSON response.
6. The SPA updates its local state and re-renders — there is no server-rendered HTML and no server-side session.

### Repository Structure
```
poultryconnect/
├── backend/                     Express API
│   ├── config/                  db.js (MongoDB Atlas connection)
│   ├── controllers/             authController · listingController · orderController
│   ├── middleware/              auth.js (protect · restrictTo)
│   ├── models/                  User.js · Listing.js · Order.js
│   ├── routes/                  authRoutes · listingRoutes · orderRoutes
│   └── server.js
└── frontend/                    React (Vite) application
    └── src/
        ├── api/                 axios.js (JWT-attaching instance)
        ├── context/             AuthContext.jsx
        ├── components/          Navbar · ProtectedRoute
        ├── pages/                Home · Login · Register · Listings · ListingDetail ·
        │                         FarmerDashboard · BuyerDashboard
        └── styles/              index.css (design tokens)
```

---

## 3. Technology Stack & Justifications

### Backend

| Technology | Role | Why |
|---|---|---|
| **Node.js + Express 4** | REST API runtime/framework | Lightweight and unopinionated, so the project's own layering (routes → controllers → models) stays explicit rather than framework-imposed; one JavaScript runtime across the whole stack for a solo developer. |
| **MongoDB Atlas + Mongoose 8** | Data persistence + ODM | Listings have optional, variable fields (description, unit type); a document store maps directly onto that shape without a rigid migration step. Atlas's free M0 tier removes all database-administration overhead. Mongoose adds schema validation, pre-save hooks (used for password hashing), and `.populate()` for referenced documents. |
| **jsonwebtoken** | Authentication | Stateless tokens let the API scale horizontally with no shared session store; the token's payload (`user id`) is re-verified against the database on every request so a deactivated or deleted user is rejected immediately. |
| **bcryptjs** | Password hashing | Industry-standard salted, adaptive hashing; the schema marks `password` as `select: false` so it is never returned by a normal query. |
| **cors** | Cross-origin control | Restricts API access to the known frontend origin (`CLIENT_URL`) rather than accepting requests from any origin. |
| **dotenv** | Configuration | Keeps all secrets and connection strings out of source control, loaded from environment variables at runtime. |

### Frontend

| Technology | Role | Why |
|---|---|---|
| **React 18 + Vite** | UI framework / build tool | Component-based UI suits two distinct, role-specific dashboards; Vite's dev server and build are fast enough for a tight, single-developer timeline. |
| **React Router 6** | Client-side routing | Enables protected, role-aware routes (e.g. `/farmer/dashboard`) without a full page reload, mirroring the API's own role restrictions on the client. |
| **Axios** | HTTP client | A single configured instance with a request interceptor attaches the JWT to every call, so page components never handle the auth header directly. |
| **Context API** | Global auth state | `AuthContext` holds the logged-in user and exposes `login` / `register` / `logout` to any component without prop drilling — no external state library needed at this scale. |
| Plain CSS (custom design tokens) | Styling | CSS variables (`:root`) define the palette and spacing once; no styling framework overhead for a UI this size. |

### Database Choice: MongoDB over SQL
A listing's shape varies slightly by poultry type and is expected to grow additional optional attributes over time; a relational schema would require either sparse nullable columns or a separate attributes table for the same flexibility MongoDB gives natively. Orders and listings are also updated far more frequently, and independently, of user records, which is why they are modelled as separate collections linked by referenced `ObjectId`s rather than embedded sub-documents — each is queried and paginated on its own.

---

## 4. Database Design

### User
```
users
├── _id          ObjectId (PK)
├── name         String  required
├── email        String  unique  lowercase  required
├── password     String  bcrypt-hashed  select: false
├── role         Enum { farmer | buyer }  required
├── phone        String?
├── location     String?
└── timestamps   createdAt · updatedAt
```
Indexes: `email` (unique)

### Listing
```
listings
├── _id            ObjectId (PK)
├── farmer         ObjectId → users  required
├── title          String  required
├── poultryType    Enum { Broiler Chicken | Layer Chicken | Eggs | Turkey | Duck | Other }
├── description    String?
├── quantity       Number  required  min 1
├── unit           Enum { birds | crates | kg }  default: birds
├── pricePerUnit   Number  required  min 0
├── location       String  required
├── status         Enum { available | sold out }  default: available
└── timestamps     createdAt · updatedAt
```
Recommended indexes as data volume grows: `{ poultryType: 1 }`, `{ location: 1 }`, `{ farmer: 1 }` — not yet added in the current implementation, which relies on collection scans appropriate for coursework-scale data.

### Order
```
orders
├── _id              ObjectId (PK)
├── listing          ObjectId → listings  required
├── buyer            ObjectId → users  required
├── farmer           ObjectId → users  required
├── quantityOrdered  Number  required  min 1
├── totalPrice       Number  required        (quantityOrdered × listing.pricePerUnit, computed server-side)
├── status           Enum { pending | accepted | rejected | completed }  default: pending
└── timestamps       createdAt · updatedAt
```

### Entity Relationship Diagram
![Data model](./docs/screenshots/er_diagram.png)

---

## 5. API Reference

Base URL: `/api`

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Create a farmer or buyer account; returns a JWT |
| POST | `/login` | Public | Authenticate; returns a JWT |
| GET | `/me` | Bearer token | Return the authenticated user's profile |

### Listings — `/api/listings`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List all listings; optional `?poultryType=` and `?location=` filters |
| GET | `/:id` | Public | Get a single listing with populated farmer contact details |
| GET | `/my/listings` | Farmer | List the authenticated farmer's own listings |
| POST | `/` | Farmer | Create a new listing |
| PUT | `/:id` | Farmer (owner only) | Update a listing (including toggling `status`) |
| DELETE | `/:id` | Farmer (owner only) | Delete a listing |

### Orders — `/api/orders`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Buyer | Place an order on a listing (validated against available quantity) |
| GET | `/my` | Buyer | List orders the authenticated buyer has placed |
| GET | `/received` | Farmer | List orders placed against the authenticated farmer's listings |
| PUT | `/:id/status` | Farmer (owner only) | Update an order's status: `accepted` \| `rejected` \| `completed` |

All error responses share the shape `{ "message": "..." }`.

---

## 6. Security Design

### Authentication & Authorisation
Tokens are signed JWTs (`JWT_SECRET` from environment variables, never committed) with a configurable expiry (`JWT_EXPIRES_IN`, default 7 days). The `protect` middleware extracts the token from the `Authorization: Bearer` header, verifies it, and re-fetches the user from the database on every request, so a deleted account is rejected immediately rather than trusting a stale token payload.

Role enforcement is layered:
1. `restrictTo(role)` middleware rejects the wrong role with `403` before the controller runs.
2. The controller re-checks **ownership** (e.g. `listing.farmer.toString() === req.user._id.toString()`) so that two accounts of the same role cannot modify each other's records.

### Password Storage
Passwords are hashed with bcrypt via a Mongoose `pre('save')` hook before the document is ever written, and the schema marks the field `select: false` so it is excluded from query results by default.

### Data Validation
Mongoose schema validation (`required`, `enum`, `min`) rejects malformed documents at the model layer. Controllers add business-rule checks on top — for example, an order is rejected with `400` if the requested quantity exceeds the listing's remaining stock.

### Cross-Origin Resource Sharing
The API's CORS configuration is restricted to `CLIENT_URL` rather than left open (`*`), so only the known deployed frontend (or local dev server) can call it directly from a browser.

### Hardening Roadmap (not yet implemented)
The current build covers the essentials above; a production deployment beyond coursework scope would add: request rate-limiting on auth routes (e.g. `express-rate-limit`), the `helmet` middleware for standard security headers, and centralised input validation (e.g. `express-validator`) ahead of the controller layer.

---

## 7. Frontend Architecture

### Page Map
| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page — problem statement and call to action |
| `/login`, `/register` | Public | Auth forms; register lets the user pick farmer or buyer |
| `/listings` | Public | Marketplace with poultry-type and location filters |
| `/listings/:id` | Public (order form for logged-in buyers) | Listing detail + place-order form |
| `/farmer/dashboard` | Farmer only | Tabbed view: manage listings / manage received orders |
| `/buyer/dashboard` | Buyer only | List of the buyer's own orders and their status |

### Route Guarding
`ProtectedRoute` wraps any page that requires login and optionally a specific role; it redirects to `/login` if there's no authenticated user, or to `/` if the user's role doesn't match the route — mirroring the API's own `restrictTo` checks on the client so an unauthorised page never renders, even briefly.

### Auth State
`AuthContext` (React Context) holds the current user (persisted to `localStorage` as `pc_user`/`pc_token`) and exposes `login`, `register`, and `logout`. An Axios request interceptor reads `pc_token` and attaches it as a Bearer header to every outgoing API call, so individual pages never touch the token directly.

### Design Tokens
All colours and spacing live as CSS custom properties at the top of `styles/index.css`:
```css
--paper, --charcoal, --charcoal-soft, --wheat, --clay, --green, --white
```
giving the marketplace a distinct "farm ledger" visual identity (warm paper background, hairline rules, a single accent colour) rather than a generic default template look.

---

## 8. Cloud Deployment

### Infrastructure Overview
```
React SPA (Vercel) ──HTTPS/JSON──▶ Express API (Render) ──Mongoose──▶ MongoDB Atlas
```

### Backend — Render
1. Create a **Web Service** in the Render dashboard.
2. Connect your GitHub repository; set the **Root Directory** to `backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables from Section 10 below.
6. Render assigns a public URL such as `https://poultryconnect-api.onrender.com`.

### Frontend — Vercel
1. Import the repository into Vercel.
2. Set the **Root Directory** to `frontend`.
3. Framework preset: Vite (auto-detected).
4. Add `VITE_API_URL=https://poultryconnect-api.onrender.com/api` as an environment variable.
5. Deploy — Vercel assigns a URL such as `https://poultryconnect.vercel.app`.

### Database — MongoDB Atlas
1. Create a free **M0** cluster at cloud.mongodb.com.
2. Add a database user with read/write privileges (separate from your Atlas login).
3. Whitelist `0.0.0.0/0` under Network Access so Render's dynamic egress IPs can connect.
4. Copy the connection string into `MONGO_URI` on Render.

### CORS Configuration
After both are deployed, set `CLIENT_URL` on Render to the live Vercel URL (e.g. `https://poultryconnect.vercel.app`) so the API accepts requests from the deployed frontend, not just `localhost`.

> Note: Render's free web-service tier sleeps after 15 minutes of inactivity, so the first request after a break can take 30–50 seconds to wake up. This is a known, disclosed limitation of the free tier, not a bug.

---

## 9. Local Development

### Prerequisites
- Node.js 18+
- A free MongoDB Atlas cluster (see Section 8)
- Git

### 1 — Clone and install
```
git clone https://github.com/<your-username>/poultryconnect.git
cd poultryconnect

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2 — Configure environment
```
# backend/.env
cp backend/.env.example backend/.env
# then edit backend/.env and fill in MONGO_URI and JWT_SECRET

# frontend/.env
cp frontend/.env.example frontend/.env
# default VITE_API_URL=http://localhost:5000/api is correct for local use
```

### 3 — Start both servers
```
# Terminal 1 — API (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```
Open `http://localhost:5173`.

### Project Scripts
| Directory | Script | What it does |
|---|---|---|
| backend | `npm run dev` | nodemon — hot-reload on file change |
| backend | `npm start` | Production start (used by Render) |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Production build |

---

## 10. Environment Variables

### Backend (`backend/.env`)
| Variable | Example | Required | Description |
|---|---|---|---|
| `PORT` | `5000` | no | API server port (default 5000) |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/poultryconnect` | yes | Atlas connection string |
| `JWT_SECRET` | 32+ random characters | yes | HMAC signing key — never commit |
| `JWT_EXPIRES_IN` | `7d` | no | Token lifetime (default 7 days) |
| `CLIENT_URL` | `http://localhost:5173` | yes | Allowed CORS origin |

### Frontend (`frontend/.env`)
| Variable | Example | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Base URL for all API calls |

---

## 11. Architectural Decisions — Summary

| Decision | Chosen | Considered | Reason |
|---|---|---|---|
| Frontend framework | React 18 + Vite | Next.js, Create React App | No need for server rendering or edge middleware at this scale; Vite's dev loop is fastest for a solo, time-boxed build |
| Backend framework | Express 4 | Fastify, NestJS | Minimal footprint keeps the routes → controllers → models layering explicit and easy to explain/defend |
| Database | MongoDB Atlas | PostgreSQL, Firebase | Flexible document schema fits variable listing attributes; managed free tier removes all DB-ops work |
| Auth strategy | JWT (stateless) | Session + server-side store | No shared session state required; simpler to reason about across two independently-deployed tiers |
| Styling | Plain CSS with custom properties | Tailwind, styled-components | A small, fixed set of pages doesn't need a full utility framework; custom tokens give a distinctive look with zero extra dependency |
| Deployment | Vercel + Render | AWS EC2, Railway | Free tier for coursework; git-push continuous deployment on both without hand-building a CI pipeline |

---

## 12. Screenshots

> Save each screenshot into a `docs/screenshots/` folder in the repo with the filename shown, then these links will render automatically on GitHub. Swap in your own if you name them differently.

**Home page**
![Home page](./docs/screenshots/homepage.png)

**Register**
![Register page](./docs/screenshots/register.png)

**Marketplace / listings**
![Marketplace](./docs/screenshots/marketplace-listings.png)

**Farmer dashboard — managing listings**
![Farmer dashboard](./docs/screenshots/famersdahsboard.png)

**Listing detail — placing an order**
![Listing detail](./docs/screenshots/Screenshot%20order-listings.png)

**Farmer dashboard — orders received**
![Orders received](./docs/screenshots/Screenshot%20orderplace%20by%20buyer.png)

**Buyer dashboard — order status**
![Buyer dashboard](./docs/screenshots/Screenshot%20buyer%20order%20updated.png)

**Live deployment (Vercel)**
![Deployed site](./docs/screenshots/Screenshot%20poutryconnect%20deployment%20vercel.png)

---

*PoultryConnect — built with React, Express, and MongoDB Atlas.*
