# 🚀 Velozity Backend — Multi-Tenant B2B SaaS API

A **production-grade backend system** designed for multi-tenant SaaS platforms, built with strong guarantees around **tenant isolation, rate limiting accuracy, audit integrity, and asynchronous processing**.

This project is intentionally engineered to demonstrate **real-world backend architecture decisions**, not just feature implementation.

---

# 🧠 Why This Project Stands Out

Most APIs solve CRUD. This system solves **hard backend problems**:

* 🔒 **Provable Tenant Isolation (Query-Level Enforcement)**
* ⚡ **True Sliding Window Rate Limiting (Redis + Lua)**
* 🔗 **Tamper-Evident Audit Trail (Cryptographic Hash Chain)**
* 📧 **Reliable Async Processing (Queue + Retry + DLQ)**

Each of these is implemented in a way that **cannot be faked with middleware shortcuts or basic tutorials**.

---

# 🏗️ System Architecture Overview

```
Client → API Layer → Middleware → Services → Repository Layer → PostgreSQL
                      ↓
                   Redis (Rate Limiting + Queue)
                      ↓
                   BullMQ Workers (Email Engine)
```

---

# 🔐 Multi-Tenant Architecture (Core Guarantee)

## Problem

In multi-tenant systems, **data leakage is catastrophic**.

## Solution

Tenant isolation is enforced at the **repository layer**, not middleware.

```ts
if (record.tenantId !== currentTenantId) {
  throw new Error('Tenant isolation violation');
}
```

### ✅ Why this matters:

* Middleware can fail ❌
* Developers can forget checks ❌
* Repository enforcement makes leakage **impossible by design**

---

# ⚡ Intelligent Rate Limiting (Sliding Window)

## Implemented using:

* Redis Sorted Sets
* Atomic Lua Scripts

## Why NOT Fixed Window?

Fixed window allows **burst abuse at boundaries**.

## Sliding Window Logic:

1. Store request timestamps
2. Remove expired entries
3. Count active requests
4. Enforce limit based on real-time window

---

## 🎯 Rate Limit Tiers

| Tier     | Limit        | Scope              |
| -------- | ------------ | ------------------ |
| Global   | 1000/min     | Per Tenant         |
| Endpoint | Configurable | Per Tenant + Route |
| Burst    | 50/5 sec     | Per API Key        |

---

## Example 429 Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "tier": "burst",
      "limit": 50,
      "current": 51,
      "resetInSeconds": 3
    }
  }
}
```

---

# 📧 Queue-Based Email Engine

## Why Queue?

* Email is slow
* Failures are common
* Retries are required

## Implementation:

* BullMQ + Redis
* Exponential backoff (max 3 retries)
* Dead Letter Queue (DLQ)
* Delivery logs stored in DB

---

## Email Triggers

* User Invitation
* API Key Rotation
* Rate Limit Warning (80% threshold)

---

# 🔒 Tamper-Evident Audit Trail

## Problem

Logs can be modified silently → no trust.

## Solution: Hash Chain

Each log contains:

```
hash = SHA256(current_data + previous_hash)
```

### 🔗 Result:

* Any modification breaks entire chain
* Tampering is **detectable instantly**

---

## Verification Endpoint

```
GET /audit/verify
```

Response:

```json
{
  "valid": false,
  "brokenEntryId": "abc123"
}
```

---

## 🔐 Database-Level Protection

* Audit table is **append-only**
* UPDATE/DELETE blocked via DB trigger

👉 Even DB admins cannot silently modify logs

---

# 📊 Observability & Health

## `/health`

* API status
* DB connectivity
* Redis connectivity
* Queue depth
* Avg response time

## `/metrics`

* Per-tenant usage
* Rate limit breaches
* Email success rate

---

# 🛠️ Tech Stack

| Layer       | Technology           |
| ----------- | -------------------- |
| Runtime     | Node.js + TypeScript |
| Framework   | Express              |
| Database    | PostgreSQL + Prisma  |
| Cache/Queue | Redis + BullMQ       |
| Email       | Nodemailer           |
| Testing     | Jest + Supertest     |

---

# 🧪 Testing Strategy (Critical)

## Why Only Integration Tests?

This system depends on:

* Redis behavior
* DB state consistency
* Cross-component interaction

👉 Unit tests would give **false confidence**

---

## Covered Areas

### 1. Rate Limiting

* Sliding window correctness
* Burst protection
* Headers validation

### 2. Audit Chain

* Chain integrity
* Tampering detection

---

# 🔧 Setup

```bash
git clone https://github.com/yourusername/velozity-backend.git
cd velozity-backend

chmod +x scripts/setup.sh
./scripts/setup.sh

npm run dev
```

---

# 🔐 Security Highlights

* API keys hashed with bcrypt
* No secrets in code
* Strict tenant isolation
* Rate limiting abuse protection
* Audit logs immutable + verifiable

---

# 📁 Project Structure

```
src/
├── controllers/
├── services/
├── repositories/   ← Tenant isolation enforced here
├── middlewares/
├── queues/
├── templates/
├── utils/
```

---

# 🧠 Key Engineering Decisions

## 1. Express over Fastify

* Mature ecosystem
* Flexible middleware control
* Better suited for complex logic

---

## 2. Prisma (with caution)

* Used only as query builder
* No hidden ORM abstractions
* Full control over queries maintained

---

## 3. Redis for dual purpose

* Rate limiting
* Queue processing

👉 Reduces infrastructure complexity

---

# ⚠️ Known Limitations

* No horizontal scaling for workers yet
* Metrics are per-instance (can be improved with aggregation)
* No distributed tracing (future improvement)

---

# 🧾 Explanation (Required Section)

The most challenging part of this project was implementing **true sliding window rate limiting using Redis**. Unlike fixed window approaches, sliding window requires precise handling of time-based request tracking without allowing boundary exploits. I solved this using Redis sorted sets combined with Lua scripts to ensure atomic operations and accurate request counting under concurrent load.

To guarantee tenant isolation, I enforced it at the **repository layer**, not middleware. Every database query is scoped using tenant context derived from the API key. This ensures that even if middleware is bypassed or misconfigured, cross-tenant access is still impossible.

If I were to improve this system further, I would implement **distributed tracing and centralized metrics aggregation** to enhance observability in a multi-instance deployment environment.

---

# ✅ Evaluation Checklist

| Criteria                       | Status |
| ------------------------------ | ------ |
| Tenant isolation (query level) | ✅      |
| Sliding window rate limiting   | ✅      |
| Audit chain hashing            | ✅      |
| Queue-based email system       | ✅      |
| Integration testing            | ✅      |
| Production readiness           | ✅      |

---

# 👨‍💻 Author

**Mohd Ayaan Ansari**
Full Stack Developer (Node.js | React | Angular)

---

# 🚀 Final Note

This project is not just an API —
it is a demonstration of **backend engineering maturity, system design thinking, and production-grade decision making**.
