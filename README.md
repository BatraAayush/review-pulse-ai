# ReviewPulse AI — Smart QR & NFC Google Review SaaS Platform

[![Live App](https://img.shields.io/badge/Live%20Demo-Vercel%20Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://review-pulse-ai-ab.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3%20(Turbopack)-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Google Gemini AI](https://img.shields.io/badge/Google%20Gemini-GenAI%20SDK-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

🌐 **Live Production Application:** [https://review-pulse-ai-ab.vercel.app](https://review-pulse-ai-ab.vercel.app)  
📂 **Source Code Repository:** [https://github.com/BatraAayush/review-pulse-ai](https://github.com/BatraAayush/review-pulse-ai)

---

## 📌 Problem & Solution

* **The Problem:** Over 90% of satisfied customers in local brick-and-mortar storefronts (restaurants, clinics, salons, fitness studios, automotive shops) leave without submitting a Google review due to mobile typing friction, difficult search navigation, or lack of inspiration. Conversely, dissatisfied customers actively seek out public forums to leave damaging 1-star reviews.
* **The Solution:** ReviewPulse AI creates a seamless physical-to-digital bridge via custom table standee QR codes and NFC tap plates. Happy patrons (4–5★) build keyword-rich, authentic reviews in under 15 seconds through interactive Smart Chips and Google Gemini AI persona synthesis, then post with one click to Google Maps. Dissatisfied patrons (1–3★) are automatically routed into a private resolution inbox.

---

## 🏗️ Architecture & Review Funnel Flow

```
   [Customer Scans QR Code / Taps NFC Plate]
                      │
                      ▼
             [/r/:slug Review Portal]
                      │
            Customer Selects Rating
           ┌──────────┴──────────┐
           ▼                     ▼
     [4–5 Stars: Positive]   [1–3 Stars: Shield]
           │                     │
   Select Smart Chips            Private Grievance Form
           │                     (Customer Name, Contact, Issue)
   Google Gemini AI Engine       │
   (Anti-Spam Persona Synthesis)  ▼
           │               Stored in Merchant Inbox
   1-Click Copy + Confetti (Telemetry Logged, 0 Public Exposure)
           │
           ▼
[Google Maps Write-Review Scheme]
```

---

## 🚀 Key Features & Engineering Highlights

### 1. Anti-Spam AI Review Synthesis (Google Gemini)
- **Persona Diversity**: Employs distinct customer styles (*Direct & Punchy*, *Enthusiastic Regular*, *Specific Shoutout*) to avoid repetitive linguistic structures.
- **Strict Anti-Spam Lexicon**: Explicitly filters floral AI adjectives and marketing buzzwords (*delight*, *haven*, *culinary journey*, *testament*, *game-changer*) that trigger Google Maps fake-engagement and spam algorithms.
- **Deterministic Offline Fallbacks**: Gracefully generates natural reviews from curated template banks if API quotas are reached or devices are offline.

### 2. Healthcare Ethics & Claim Compliance Guard
- Automatically detects medical and dental tenants (`clinic`, `dental`, `healthcare`).
- Blocks and flags non-compliant review chip phrases containing medical guarantees, diagnostic claims, or cure promises (*cure*, *guarantee*, *diagnose*, *prescribe*) to safeguard practices from HIPAA and regulatory review policy violations.

### 3. In-Browser QR Code & Standee Print Kit Studio
- Dynamic vector SVG rendering and high-resolution PNG generation with QR error-correction levels.
- Printable counter tent cards and table stands with cut and fold guidelines.
- Live brand theme color customization studio with instant hex palettes and preview swatches.

### 4. Multi-Tenant Role-Based Access Control (RBAC)
- Multi-tenancy with `SUPER_ADMIN` and `OWNER` roles.
- Secure session tokens using JWTs (`jose`) stored in HTTP-only, `SameSite=Lax` cookies with `bcryptjs` password hashing.
- Super Admin portal tracking platform-wide MRR, active tenants directory, and scan telemetry.

### 5. Conversion Telemetry & Scan Analytics
- Real-time event tracking: IP hashing, device profiling (iOS, Android, Desktop), time-to-conversion, and action outcomes (`copied_to_google`, `private_feedback`, `bounced`).

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 16.3 (Turbopack) | App Router, Server Actions, Dynamic Route Handlers |
| **Frontend** | React 19, Tailwind CSS v4 | Lucide Icons, Canvas Confetti, Responsive Dark Mode |
| **Database & ORM** | Neon PostgreSQL + Prisma 6 | Serverless connection pooling with `@prisma/client` |
| **Artificial Intelligence** | `@google/genai` (Google Gemini) | Gemini 2.5 Flash with custom anti-spam system prompts |
| **Authentication** | `jose` + `bcryptjs` | Stateless JWT sessions in encrypted HTTP-only cookies |
| **Payments** | Razorpay SDK | Monthly / Annual recurring subscription checkout flows |
| **Utilities** | `qrcode`, `canvas-confetti` | High-res QR canvas and print-ready tent layouts |

---

## 🔑 Pre-Seeded Sandbox Demo Accounts

For quick evaluation without registering a new store, use the 1-click test presets on the [`/login`](https://review-pulse-ai-ab.vercel.app/login) page:

| Role | Email | Password | Demo Business |
|---|---|---|---|
| **Super Admin** | `admin@reviewpulse.ai` | `Admin@123456` | Platform Overview (`/admin`) |
| **Restaurant Owner** | `owner@bellarestaurant.com` | `Owner@123456` | Bella Italia Trattoria (`/r/bella-italia`) |
| **Dental Practice** | `contact@apexdental.com` | `Dental@123456` | Apex Modern Dentistry (`/r/apex-dentistry`) |
| **Salon & Spa** | `hello@luxesalon.com` | `Luxe@123456` | Luxe Studio & Spa (`/r/luxe-salon`) |

*You can also create a new business tenant at [`/register`](https://review-pulse-ai-ab.vercel.app/register) with instant slug provisioning.*

---

## 🌐 Application Routes

- **Marketing Landing Page**: [`/`](https://review-pulse-ai-ab.vercel.app/) (includes interactive ROI calculator and review simulator)
- **Authentication**: [`/login`](https://review-pulse-ai-ab.vercel.app/login) and [`/register`](https://review-pulse-ai-ab.vercel.app/register)
- **Tenant Dashboard**: [`/dashboard`](https://review-pulse-ai-ab.vercel.app/dashboard) (telemetry, QR studio, chips manager, inbox, settings)
- **Super Admin Portal**: [`/admin`](https://review-pulse-ai-ab.vercel.app/admin) (global MRR, active business directory, real-time scan feed)
- **Customer Review Funnels**:
  - Dining: [`/r/bella-italia`](https://review-pulse-ai-ab.vercel.app/r/bella-italia)
  - Medical: [`/r/apex-dentistry`](https://review-pulse-ai-ab.vercel.app/r/apex-dentistry)
  - Salon: [`/r/luxe-salon`](https://review-pulse-ai-ab.vercel.app/r/luxe-salon)

---

## 📦 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.18+, v20+, or v22+
- **npm** / pnpm / yarn
- A Neon PostgreSQL or local PostgreSQL database

### 2. Installation
```bash
git clone https://github.com/BatraAayush/review-pulse-ai.git
cd review-pulse-ai
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
DATABASE_URL="postgresql://user:password@ep-host.region.neon.tech/dbname?sslmode=require"
JWT_SECRET="your_secure_random_32_character_jwt_secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GEMINI_API_KEY="your-google-gemini-api-key"
```

### 4. Database Initialization & Seeding
```bash
npx prisma db push
npx prisma db seed
```

### 5. Run the Application
```bash
# Start development server
npm run dev

# Run ESLint validation
npm run lint

# Build production bundle
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
