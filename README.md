# RazorGrow AI
### Agent-to-Agent Commerce for Smarter Buying and Merchant Growth

RazorGrow AI is an **AI Growth & Agentic Commerce** platform that turns Razorpay merchant storefronts into machine-transactable, revenue-generating entities for autonomous AI buyers.

By orchestrating structured negotiation between a **Customer-side Buyer Agent** and a **Merchant-side Sales Agent**, RazorGrow AI automates product discovery, bounded upsells, and policy validation—while keeping all monetary transactions gated behind explicit customer sign-off and cryptographically verified Razorpay webhooks.

> **Core Philosophy:** *AI negotiates and recommends. Rules constrain. Customers authorize. Razorpay executes. Every action is auditable.*

---

## 📍 Table of Contents
- [Features At A Glance](#features-at-a-glance)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Key / Unique Features](#key--unique-features)
- [How the System Works](#how-the-system-works)
- [Architecture](#architecture)
- [Agent-to-Agent Communication](#agent-to-agent-communication)
- [AI Safety & Financial Guardrails](#ai-safety--financial-guardrails)
- [Razorpay Webhook Integration](#razorpay-webhook-integration)
- [Tech Stack](#tech-stack)
- [Current Deployment](#current-deployment)
- [Run Locally](#run-locally)
- [Environment Variables](#environment-variables)
- [Recommended Demo Walkthrough](#recommended-demo-6-step-walkthrough-for-judges)
- [Project Structure](#project-structure)
- [Future Scope](#future-scope)
- [Links](#links)

---

## Features At A Glance

- **🤖 Two-Sided Agentic Commerce**: Autonomous negotiation between a Buyer Agent (representing customer constraints) and a Merchant Agent (representing product & pricing logic).
- **🛡️ Deterministic Financial Guardrails**: LLMs are never trusted for monetary authorization. Backend policy engines enforce max payment caps, upsell limits, discount thresholds, and inventory stock rules.
- **🔄 Agent Replanning**: If an initial upsell exceeds merchant policy caps (e.g. ₹899 upsell vs ₹500 policy limit), the Merchant Agent automatically replans to a policy-compliant alternative (₹199 packaging).
- **👤 Gated Customer Approval**: Neither agent can charge money without explicit user approval. Purchases require a signed Purchase Summary review before payment initialization.
- **💳 Razorpay Test Mode & HMAC Webhooks**: Complete payment lifecycle integration using Razorpay Test Mode and raw-body HMAC-SHA256 webhook signature verification with idempotency protection.
- **📊 Append-Only Audit Trail**: Every decision, policy block, customer approval, and payment status event is recorded in an immutable-by-convention audit ledger for merchant transparency.

---

## Problem Statement

### Theme: AI Growth & Agentic Commerce

As commerce transitions from human browser clicks to autonomous AI agents acting on behalf of shoppers, traditional storefronts face two critical open problems:

1. **Merchant Growth**: How can merchants automatically capture upsell/cross-sell opportunities and grow revenue without intrusive popups or manual sales outreach?
2. **AI Transactability**: How can a merchant make their product catalog, stock, and checkout capabilities machine-readable and transactable by external AI buyers?

Traditional storefronts rely on visual human layouts and manual checkout forms. In the emerging agent-driven economy (supported by industry efforts like NPCI's Universal Agentic Protocol (UAP) and global agent standards), merchants need a structured protocol layer that allows AI buyers to negotiate, validate policies, and execute transactions safely.

---

## Objectives

> **Two-Sided Value Statement:** *Enable two-sided agentic commerce by connecting a Buyer Agent representing the customer with a Merchant Agent representing the merchant, creating value through better product discovery for buyers and revenue growth for merchants.*

### Merchant-Side Objectives
- Increase revenue through AI-driven upsell and cross-sell recommendations.
- Provide a structured, agent-readable catalog with real-time stock and pricing metadata.
- Allow the Merchant Agent to evaluate and respond to Buyer Agent requests autonomously.
- Enforce strict, merchant-defined policy guardrails on all AI transactions.
- Automatically replan when an AI proposal violates a merchant constraint.
- Provide real-time visibility into AI activity, revenue attribution, and policy checks.
- Maintain an append-only audit trail of all AI actions and payment events.

### Buyer/Customer-Side Objectives
- Parse customer purchasing intent, category preferences, and budget ceilings.
- Enable a Buyer Agent to negotiate and shop on the customer's behalf.
- Communicate with the Merchant Agent using structured commerce JSON messages.
- Filter products and complementary add-ons strictly within customer budget constraints.
- Require explicit customer approval on an itemized summary before any money is moved.
- Provide transparent reasoning and evidence for every recommendation.
- Complete secure payment execution via Razorpay Test Mode.

---

## Key / Unique Features

### 1. Two-Sided Agentic Commerce
Orchestrates structured message exchanges between two distinct logical agent roles: the **Buyer Agent** (protecting customer budget and intent) and the **Merchant Agent** (maximizing revenue and matching inventory).

### 2. AI Buyer Mode
Customers can toggle into **AI Buyer Mode**, enter a natural-language intent (e.g. *"Tech gift under ₹3000 for my brother"*), and observe the multi-agent negotiation unfold live in an interactive protocol timeline.

### 3. Agent-Readable Catalog
Exposes structured product metadata from the backend database:
- `id`, `name`, `category`, `price`, `stock`, `rating`, `image`

### 4. AI Upsell / Cross-Sell & Agent Replanning
When a customer requests a product, the Merchant Agent analyzes catalog affinity to propose a complementary item. 

If the initial upsell exceeds the merchant's policy limit (e.g. ₹899 vs ₹500 cap), the **Policy Engine BLOCKS** the proposal, and the **Merchant Agent REPLANS** to suggest a policy-compliant ₹199 packaging option.

```
Initial Offer (₹899 Upsell) ──► Policy Engine (BLOCKED: > ₹500 cap) ──► Merchant Replan ──► Revised Offer (₹199 Packaging) ──► Policy Engine (ALLOWED)
```

### 5. Deterministic AI Constraints
LLMs are restricted to intent classification and natural language reasoning. Final authorization for prices, stock availability, discount calculations, and payment limits is governed by deterministic backend code (`PolicyEngine.evaluateCart()` and `PolicyEngine.evaluateUpsell()`).

### 6. Customer Approval Gate
No agent can execute a payment autonomously. After negotiation, the workflow pauses at a **Purchase Summary Card** detailing line items, budget comparison, policy checklist, and final total. Payment only proceeds when the user clicks `[ APPROVE & CONTINUE TO RAZORPAY ]`.

### 7. Secure Razorpay Webhook & Payment Verification
- Server-side Razorpay Order creation (`POST /api/checkout/create-order`).
- Official Razorpay Test Mode Checkout modal integration.
- Webhook listener (`POST /api/webhooks/razorpay`) with:
  - `X-Razorpay-Signature` validation
  - HMAC-SHA256 signature verification over raw request body (`req.rawBody`)
  - `crypto.timingSafeEqual()` protection against timing attacks
  - Idempotency protection via event ID tracking (`db.hasPaymentEvent()`)

### 8. Append-Only Audit Trail
An append-only evidence log tracking all AI actions, policy evaluation results, customer approvals, and payment events. Razorpay webhook events are cryptographically verified using HMAC-SHA256 before updating payment status or crediting revenue metrics.

### 9. Graceful Failure Handling
If payment fails or is cancelled in the Razorpay modal (`payment.failed` event):
- The failure is logged in the payment events table.
- AI-attributed revenue is strictly set to **₹0**.
- The cart and order state are preserved so the customer can retry.
- Duplicate successful revenue attribution is prevented.

---

## How the System Works

### End-to-End Workflow Diagram

```
Customer Input (Intent + Budget)
      │
      ▼
🤖 BUYER AGENT ──► Formulates COMMERCE_REQUEST
      │
      ▼
🏪 MERCHANT AGENT ──► Searches Real Catalog & Proposes Initial Offer
      │
      ▼
🛡️ POLICY ENGINE ──► Evaluates Max Upsell / Payment Caps
      ├───────────────────────┐
      │ (If BLOCKED)          │ (If ALLOWED)
      ▼                       ▼
🏪 MERCHANT REPLAN      🤖 BUYER EVALUATION
      │                       │
      └───────────────────────┼──► Verifies Budget Ceiling
                              │
                              ▼
                   👤 CUSTOMER APPROVAL GATE
                              │
                              ▼ [ APPROVE & CONTINUE TO RAZORPAY ]
                   💳 RAZORPAY ORDER CREATION
                              │
                              ▼
                   💳 RAZORPAY CHECKOUT MODAL
                              │
                              ▼
                   ✅ RAZORPAY WEBHOOK VERIFICATION (HMAC-SHA256)
                              │
                              ▼
                   📊 MERCHANT REVENUE ATTRIBUTION & AUDIT LEDGER
```

### Modes Comparison

| Mode | Target User | Interaction Style | Primary Purpose |
|---|---|---|---|
| **Shop with AI** | Human Shopper | Direct Chat Assistant | Product Q&A and browsing guidance |
| **AI Buyer Mode** | Autonomous Agent | Multi-Agent Protocol Timeline | Intent delegation, policy validation & gated purchase |

---

## Architecture

The project is structured as a two-tier architecture with application-level A2A protocol orchestration:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 / Vite)                      │
│  • Customer View (Shop with AI vs AI Buyer Mode)                      │
│  • Merchant Command Center (Overview, Policies, Audit Logs, A2A Tab)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API (Vite Proxy / VITE_API_URL)
┌───────────────────────────────────▼────────────────────────────────────┐
│                        BACKEND (Node.js / Express)                     │
│  • A2A Orchestrator (server/a2a-customer.js)                          │
│  • Policy Engine (server/policies.js) & Coupon Optimizer               │
│  • Gemini Reasoning Engine (server/gemini.js)                         │
│  • Razorpay Integration (server/razorpay.js) & Webhook Handler          │
│  • Append-Only Data Store (server/db.js -> database.json)             │
└────────────────────────────────────────────────────────────────────────┘
```

> *Note: The current A2A implementation consists of two logical agents communicating through structured application-level message passing and orchestration within the backend services.*

---

## Agent-to-Agent Communication

Agents communicate by exchanging structured, schema-validated JSON message objects:

- `COMMERCE_REQUEST`: Sent by Buyer Agent with customer intent and budget constraints.
- `COMMERCE_OFFER`: Sent by Merchant Agent proposing catalog product and initial upsell.
- `POLICY_RESULT`: Emitted by Policy Engine (`BLOCKED` or `ALLOWED`).
- `REVISED_OFFER`: Sent by Merchant Agent upon replanning (`action: 'REPLAN'`).
- `BUYER_EVALUATION`: Emitted by Buyer Agent (`verdict: 'ACCEPT'` or `'REJECT'`).

<details>
<summary>🔍 <b>View Example JSON Protocol Message Exchange</b></summary>

```json
// BUYER AGENT → MERCHANT AGENT
{
  "type": "COMMERCE_REQUEST",
  "from_agent": "BUYER_AGENT",
  "to_agent": "MERCHANT_AGENT",
  "customer_intent": "tech gift under ₹3000 for brother",
  "constraints": { "budget_max": 3000, "currency": "INR" }
}

// MERCHANT AGENT → BUYER AGENT (Initial Offer)
{
  "type": "COMMERCE_OFFER",
  "from_agent": "MERCHANT_AGENT",
  "to_agent": "BUYER_AGENT",
  "product": { "id": "prod_earbuds_02", "name": "Wireless Earbuds", "price": 1999 },
  "upsell": { "id": "prod_premiumpack_12", "name": "Premium Gift Box", "price": 899 }
}

// POLICY ENGINE → MERCHANT AGENT (Guardrail Check)
{
  "type": "POLICY_RESULT",
  "from_agent": "POLICY_ENGINE",
  "to_agent": "MERCHANT_AGENT",
  "result": "BLOCKED",
  "code": "EXCEEDS_MAX_UPSELL",
  "reason": "Upsell price (₹899) exceeds merchant maximum limit of ₹500."
}

// MERCHANT AGENT → BUYER AGENT (Replanned Offer)
{
  "type": "REVISED_OFFER",
  "from_agent": "MERCHANT_AGENT",
  "to_agent": "BUYER_AGENT",
  "action": "REPLAN",
  "product": { "id": "prod_earbuds_02", "name": "Wireless Earbuds", "price": 1999 },
  "upsell": { "id": "prod_giftbox_04", "name": "Gift Packaging", "price": 199 }
}

// BUYER AGENT → CUSTOMER (Verdict)
{
  "type": "BUYER_EVALUATION",
  "from_agent": "BUYER_AGENT",
  "to_agent": "CUSTOMER",
  "verdict": "ACCEPT",
  "reason": "Offer satisfies customer budget ceiling of ₹3,000. Total: ₹1,979."
}
```

</details>

---

## AI Safety & Financial Guardrails

The LLM is responsible for intent classification and natural language reasoning, **not** final financial authorization. 

The backend deterministically enforces the following hard constraints:

1. **Max Payment Ceiling**: Blocks any order exceeding `max_transaction_amount` (₹5,000 limit).
2. **Max Upsell Cap**: Triggers replanning if upsell exceeds `max_upsell_amount` (₹500 limit).
3. **Discount Ceiling**: Caps coupon discounts at `max_discount_percent` (10% limit).
4. **Stock Check**: Rejects out-of-stock items when backorders are disallowed.
5. **Customer Budget**: Buyer Agent rejects offers exceeding the user's specified budget ceiling.
6. **Customer Approval**: Payment cannot be initiated without explicit user authorization.

---

## Razorpay Webhook Integration

- **Webhook Endpoint**: `POST /api/webhooks/razorpay`
- **Health Endpoint**: `GET /api/webhooks/razorpay/health`
- **Supported Events**: `payment.captured`, `payment.failed`, `order.paid`

### Security Features
- **HMAC Verification**: Re-computes SHA256 digest using `RAZORPAY_WEBHOOK_SECRET` over raw body Buffer (`req.rawBody`).
- **Timing-Safe Comparison**: Uses `crypto.timingSafeEqual()` to prevent timing side-channel attacks.
- **Idempotency**: Prevents duplicate event processing using event ID lookup (`db.hasPaymentEvent()`).

---

## Tech Stack

- **Frontend**: React 19, Vite, Lucide React, CSS3
- **Backend**: Node.js, Express, Cors, Dotenv
- **AI Integration**: Google Gemini API (`@google/genai` / REST)
- **Payments**: Razorpay Test Mode API (`razorpay` SDK) & HMAC-SHA256 Webhooks
- **Backend Hosting**: Render
- **Database / Persistence**: Local JSON Store (`server/database.json`) managed via `server/db.js`

---

## Current Deployment

- **Backend API**: `https://razorgrow-ai-iez3.onrender.com`
- **Razorpay Webhook Endpoint**: `https://razorgrow-ai-iez3.onrender.com/api/webhooks/razorpay`
- **Webhook Health Check**: `https://razorgrow-ai-iez3.onrender.com/api/webhooks/razorpay/health`
- **Frontend**: Runs locally (via Vite) and proxies API requests directly to the deployed Render backend.

---

## Run Locally

### Option A — Run Frontend Locally (Connected to Deployed Render Backend) ⭐ Recommended for Quick Demo

Because the backend is already deployed on Render, you only need to run the frontend locally for testing or demoing.

```bash
# 1. Clone the repository
git clone https://github.com/HamsiniAavula/Razorgrow-AI.git
cd Razorgrow-AI

# 2. Install dependencies
npm install
npm run install --prefix client

# 3. Start the local frontend
npm run client
```

Open **`http://localhost:5173/`** in your browser. All `/api` requests are proxied directly to `https://razorgrow-ai-iez3.onrender.com`.

---

### Option B — Full Local Development (Local Frontend + Local Backend)

If you wish to run both the Node backend and React frontend locally:

**Terminal 1 (Backend Server on Port 5000):**
```bash
npm run server
```

**Terminal 2 (Frontend Dev Server on Port 5173):**
```bash
# Set VITE_BACKEND_URL to local server
$env:VITE_BACKEND_URL="http://localhost:5000"
npm run client
```

---

## Environment Variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

<details>
<summary>⚙️ <b>View Full Environment Variables Specification (.env.example)</b></summary>

```env
# Backend Server Port (Private/Backend)
PORT=5000

# Razorpay Test Mode API Credentials (Private/Backend)
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Razorpay Webhook Secret (Private/Backend)
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here

# Google Gemini API Key (Private/Backend)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Frontend Target URL (Public/Frontend)
VITE_BACKEND_URL=https://razorgrow-ai-iez3.onrender.com
```

> **Note:** Never commit your actual `.env` file containing secrets to Git.

</details>

---

## Recommended Demo (6-Step Walkthrough for Judges)

1. Open **`http://localhost:5173/`** in your browser.
2. In the left sidebar, click **`⚡ AI Buyer`** mode.
3. Click the sample intent chip: **"Tech gift for brother under ₹3000"** (or type it).
4. Click **"Run A2A Negotiation"** and observe the live protocol timeline showing the initial ₹899 upsell get **BLOCKED** by merchant policy.
5. Watch the Merchant Agent **REPLAN** to ₹199 packaging and the Buyer Agent **ACCEPT** the ₹1,979 final offer.
6. Click **`[ APPROVE & CONTINUE TO RAZORPAY — ₹1,979 ]`** to view the itemized purchase summary, generate a real Razorpay Order ID, complete Test Checkout, and observe the HMAC webhook verification event.

---

## Project Structure

<details>
<summary>📁 <b>View Full Project Directory Structure</b></summary>

```
Razorgrow-AI/
├── client/                      # React 19 / Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── customer/       # Customer Assistant, AI Buyer Mode, Cart, Checkout Modal
│   │   │   ├── merchant/       # Merchant Command Center, Overview, Policies, Audit Logs, A2A Tab
│   │   │   └── common/         # Navbar & UI elements
│   │   ├── App.jsx             # Main Application Shell & SPA Navigation
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js          # Vite Proxy target (Render / Local)
├── server/                      # Node.js / Express Backend
│   ├── a2a.js                  # A2A Protocol Endpoints & Manifest
│   ├── a2a-customer.js         # Customer-Side A2A Orchestrator
│   ├── db.js                   # JSON Database Access Layer
│   ├── database.json           # Persistent Data File
│   ├── gemini.js               # Gemini Reasoning & Catalog Search
│   ├── policies.js             # Deterministic Merchant Policy Engine
│   ├── coupons.js              # Coupon Optimizer Engine
│   ├── razorpay.js             # Razorpay Test Service & Webhook HMAC Handler
│   ├── seed.js                 # Initial Seed Data
│   └── server.js               # Main Express Server & Routes
├── .env.example                 # Environment Template
├── package.json                 # Root Scripts
└── README.md
```

</details>

---

## Future Scope

- **Protocol Standards Adoption**: Implement formal AP2 / ACP / x402 HTTP header bindings for cross-platform agent interoperability.
- **Multi-Merchant Architecture**: Expand from single-merchant sandbox to multi-tenant merchant networks.
- **Production SQL Storage**: Migrate from local JSON store (`database.json`) to PostgreSQL/Prisma for cloud scalability.
- **Advanced Identity**: Integrate OAuth2 / DID verifiable credentials for customer agent identity verification.

---

## Links

- **GitHub Repository**: [https://github.com/HamsiniAavula/Razorgrow-AI](https://github.com/HamsiniAavula/Razorgrow-AI)
- **Live Backend (Render)**: [https://razorgrow-ai-iez3.onrender.com](https://razorgrow-ai-iez3.onrender.com)
- **Razorpay Webhook Endpoint**: `https://razorgrow-ai-iez3.onrender.com/api/webhooks/razorpay`
- **Webhook Health Check**: `https://razorgrow-ai-iez3.onrender.com/api/webhooks/razorpay/health`
