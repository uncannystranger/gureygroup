<div align="center">

  <img width="1440" height="702" alt="Screenshot 2026-08-03 at 22 01 55" src="https://github.com/user-attachments/assets/fdb58673-d993-4cf6-a2b8-32d10442f9f0" />

  # ◈ GUREY GROUP // OPERATING SYSTEM FOR MODERN COMMERCE

  <p>
    <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=16&duration=2600&pause=900&color=00F0FF&center=true&vCenter=true&width=720&lines=POINT+OF+SALE+%2B+INVENTORY+%2B+ANALYTICS;MULTI-TENANT+COMMERCE+INFRASTRUCTURE;BUILT+WITH+MOTION%2C+SIGNALS%2C+AND+PRECISION" alt="Animated project description" />
  </p>

  <p>
    <a href="#-system-capabilities">CAPABILITIES</a> ·
    <a href="#-interface-protocol">INTERFACE</a> ·
    <a href="#-architecture-grid">ARCHITECTURE</a> ·
    <a href="#-launch-sequence">LAUNCH</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/STATUS-ONLINE-00ff9d?style=for-the-badge&labelColor=090b16" alt="Status online" />
    <img src="https://img.shields.io/badge/REACT-18.3.1-00f0ff?style=for-the-badge&logo=react&logoColor=00f0ff&labelColor=090b16" alt="React 18.3.1" />
    <img src="https://img.shields.io/badge/NODE-EXPRESS-ff2bd6?style=for-the-badge&logo=nodedotjs&logoColor=ff2bd6&labelColor=090b16" alt="Node Express" />
    <img src="https://img.shields.io/badge/MONGO-ATLAS-00ff9d?style=for-the-badge&logo=mongodb&logoColor=00ff9d&labelColor=090b16" alt="MongoDB Atlas" />
  </p>

  <sub>Made with 🧡 by <strong>uncannystranger</strong></sub>
</div>

<br />

> **/// SYSTEM BRIEF**
> Gurey Group is a multi-tenant SaaS command layer for retail teams: fast POS operations, live inventory, branch control, financial reporting, and secure collaboration in one responsive workspace.

<div align="center">

`[ SIGNAL: LIQUID GLASS ]`　`[ MOTION: ENABLED ]`　`[ TENANCY: ISOLATED ]`　`[ ACCESS: RBAC ]`

</div>

## ◈ System Capabilities

| Module | Runtime behavior |
| --- | --- |
| **POS / Checkout** | Barcode and SKU lookup, held carts, discounts, change calculation, thermal receipts, tax invoices, and mobile-money QR flows for EVC Plus, Zaad, and Sahal. |
| **Inventory Grid** | Stock thresholds, batch expiry tracking, adjustments, SKU management, and multi-warehouse allocation. |
| **Tenant Core** | Organization-scoped data, branch assignment, tenant headers, and JWT tenancy binding. |
| **People + Access** | Owner, Admin, Manager, and Cashier roles with granular permissions, invitations, attendance, sessions, and audit trails. |
| **AI Operations** | Workspace-aware assistant surfaces and monthly reporting workflows. |

## ⟡ Interface Protocol

The interface is styled like a calm cyberpunk control deck: luminous signals, translucent surfaces, and feedback that arrives in milliseconds.

```text
┌──────────────────────────────────────────────────────────────┐
│  GUREY GROUP // COMMAND DECK                                 │
│  ────────────────────────────────────────────────────────────  │
│  [01] GLASS PANELS      depth without visual noise            │
│  [02] SIGNAL MOTION     350ms route transitions               │
│  [03] TACTILE INPUT     hover, press, focus, confirmation     │
│  [04] RESPONSIVE GRID   320px mobile → 4K desktop             │
└──────────────────────────────────────────────────────────────┘
```

### Motion language

- **Page transitions:** compact fade-and-rise movement keeps route changes legible.
- **Micro-interactions:** controls use subtle scale, glow, and color feedback.
- **Living surfaces:** glass panels, mesh gradients, shimmer loaders, and floating assistant states create depth.
- **Responsive continuity:** mobile drawers and desktop navigation share the same interaction vocabulary.

## ⌁ Architecture Grid

```mermaid
flowchart LR
    U["Customer / Cashier / Owner"] --> F["React + Vite command deck"]
    F -->|Bearer JWT + x-company-id| A["Express API gateway"]
    A --> S["Security middleware"]
    S --> I["Firebase identity"]
    S --> D["MongoDB Atlas"]
    F --> Q["USSD QR generator"]
```

### Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18.3, Vite, Tailwind CSS, Lucide React |
| API | Node.js, Express 4, Mongoose |
| Data | MongoDB Atlas with tenant-isolated collections |
| Identity | Firebase Auth and RTDB |
| Security | JWT, Helmet, rate limiting, strict CORS |
| Payments | `qrcode.react` with mobile-money USSD payloads |

## 🚀 Launch Sequence

### Requirements

- Node.js `18.x` or newer
- npm `9.x` or newer
- MongoDB Atlas URI
- Firebase Web project configuration

### 1. Clone and configure

```bash
git clone https://github.com/uncannystranger/gureygroup.git
cd gureygroup
cp .env.example .env
```

Fill `.env` locally with your MongoDB, JWT, and Firebase values. Never commit `.env`.

### 2. Install dependencies

```bash
npm install
cd backend && npm install && cd ..
```

### 3. Start the local grid

```bash
# Terminal 1 — API server (default: http://127.0.0.1:5050)
cd backend && npm run dev

# Terminal 2 — Vite frontend (default: http://127.0.0.1:3000)
npm run dev:frontend
```

The root `npm run dev` command starts both processes together.

## 🛡 Security Signal

- Secrets load from environment variables and are excluded by `.gitignore`.
- JWT verification and tenant binding protect organization-scoped API access.
- Helmet, rate limiting, strict CORS, and defensive error responses harden the API edge.
- Backend migrations run during startup against the configured database.

## ◇ Project Status

This repository is the active Gurey Group SaaS workspace. Build the frontend with:

```bash
npm run build
```

<div align="center">

  <br />
  <sub>Made with 🧡 by <strong>uncannystranger</strong></sub>

</div>
