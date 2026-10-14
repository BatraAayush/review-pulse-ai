# ReviewPulse AI — Smart QR & NFC Google Review SaaS Platform

🌐 **Live Application:** [https://review-pulse-ai-ab.vercel.app](https://review-pulse-ai-ab.vercel.app)

ReviewPulse AI is a production-grade multi-tenant SaaS application that enables local brick-and-mortar storefronts (restaurants, clinics, salons, fitness studios, automotive shops) to capture authentic 5-star Google Reviews via high-resolution QR table stands and NFC tap plates, while intercepting negative reviews (1–3 stars) into a private resolution inbox.

---

## 🚀 Key Features

- **Real Database & Prisma ORM**: Type-safe SQLite database (swappable to PostgreSQL/MySQL via `DATABASE_URL`) with Prisma ORM.
- **Production Authentication & RBAC**:
  - Secure bcrypt password hashing.
  - JWT session management in HTTP-only, SameSite cookies (`jose`).
  - Roles: `SUPER_ADMIN` and `OWNER`.
- **Real Working QR Codes & Print Kit Studio**:
  - Automatically resolves real scan domain (`/r/[slug]`).
  - High-resolution SVG and PNG downloads with error correction.
  - Printable table stand / counter tent card template with fold and cut markers.
- **AI-Powered Customer Review Funnel**:
  - 4–5 Star flow: Category-tailored Smart Chips construct a natural, authentic review, copy it to the user's clipboard with confetti, and redirect directly to the business's Google Place Review URL.
  - 1–3 Star flow: Negative feedback shield collects complaint details privately and stores them in the business owner's inbox.
- **Real-Time Scan & Conversion Telemetry**: Captures IP addresses, device types (iOS, Android, Desktop), conversion rates, and review lengths.
- **Multi-Tenant Super Admin Command Center**: Platform-wide metrics, active tenants directory, user management, and calculated monthly recurring revenue (MRR).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **UI & Components**: React 19, Tailwind CSS v4, Lucide React
- **Database & ORM**: Prisma 6 + SQLite (`dev.db`)
- **Authentication**: `bcryptjs` + `jose` (HTTP-only cookies)
- **Utilities**: `qrcode`, `canvas-confetti`, `tsx`

---

## 🔑 Pre-Seeded Accounts

| Role | Email | Password | Business / Notes |
|---|---|---|---|
| **Super Admin** | `admin@reviewpulse.ai` | `Admin@123456` | Full access to `/admin` |
| **Restaurant Owner** | `owner@bellarestaurant.com` | `Owner@123456` | Bella Italia Trattoria (`/r/bella-italia`) |
| **Dental Clinic** | `contact@apexdental.com` | `Dental@123456` | Apex Modern Dentistry (`/r/apex-dentistry`) |
| **Salon & Spa** | `hello@luxesalon.com` | `Luxe@123456` | Luxe Studio & Spa (`/r/luxe-salon`) |

*You can also register a brand new business at `/register` to generate a live QR code immediately.*

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+ / v24+
- **npm** (or pnpm / yarn)

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize & Seed Database
```bash
npx prisma db push
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Application Routes

- **Marketing Website**: [`/`](http://localhost:3000/)
- **Sign In**: [`/login`](http://localhost:3000/login) (includes 1-click test login presets)
- **Create Account**: [`/register`](http://localhost:3000/register) (instant business slug provisioning)
- **Owner Dashboard**: [`/dashboard`](http://localhost:3000/dashboard) (analytics, QR studio, chips, inbox)
- **Super Admin Portal**: [`/admin`](http://localhost:3000/admin) (tenant overview, MRR metrics)
- **Live Customer Review Funnel**:
  - Restaurant: [`/r/bella-italia`](http://localhost:3000/r/bella-italia)
  - Dental Clinic: [`/r/apex-dentistry`](http://localhost:3000/r/apex-dentistry)
  - Salon: [`/r/luxe-salon`](http://localhost:3000/r/luxe-salon)

---

## 🚢 Production Build
To test or deploy the production bundle:
```bash
npm run build
npm run start
```
