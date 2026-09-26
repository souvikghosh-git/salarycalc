# 💰 SalaryCalc.ai — AI-Powered Indian Salary Calculator

> Calculate your exact take-home salary from CTC/Fixed Component with FY 2026-27 tax slabs, AI chatbot, and zero cost.

🔗 **Live:** [salarycalc.ghosh-krisnen.workers.dev](https://salarycalc.ghosh-krisnen.workers.dev)

---

## ✨ Features

### ⚡ Salary Calculator
- **CTC → Take-Home** conversion with complete salary breakdown
- **Both Tax Regimes** — New (default) & Old for FY 2026-27 (AY 2027-28)
- All salary components: Basic, HRA, LTA, Special Allowance, EPF, Gratuity
- EPF options: 12% of Basic or 12% of ₹15,000 (capped)
- Metro/Non-Metro city selection for HRA calculation
- Old regime deductions: Rent (HRA exemption), 80C, 80D, NPS

### 📊 Tax Engine
- **New Regime:** 7 slabs, ₹75,000 standard deduction, Section 87A rebate (zero tax ≤ ₹12.75L), marginal relief
- **Old Regime:** 4 slabs, HRA exemption (min-of-three rule), 80C/80D/NPS deductions
- Surcharge (10%/15%/25%) & 4% Health & Education Cess
- **Side-by-side regime comparison** with savings recommendation

### 🤖 AI Salary Advisor
- Conversational chatbot powered by **Meta Llama 3.1 8B** via Cloudflare Workers AI (free tier)
- Pre-prompted with comprehensive Indian salary/tax knowledge
- Offline rule-based fallback for common questions

### 🎨 Premium UI
- Dark theme with animated gradient orbs & glassmorphism
- Animated number count-up on results
- Interactive SVG donut chart showing CTC distribution
- Smooth FAQ accordion with 10 curated questions
- Tax slabs reference tables (both regimes)
- Fully responsive — mobile, tablet, desktop

---

## 🏗️ Architecture

```
salary-calculator/
├── index.html              # Main UI — hero, calculator, results, FAQ
├── styles.css              # Premium dark-theme design system
├── app.js                  # Calculator engine + UI logic (client-side)
├── src/
│   └── worker.js           # Cloudflare Worker — handles /api/chat (LLM)
├── functions/
│   └── api/
│       └── chat.js         # Pages Functions version (legacy)
├── wrangler.toml           # Cloudflare Workers config + AI binding
├── package.json            # Build & deploy scripts
└── dist/                   # Build output (auto-generated, gitignored)
```

### How It Works

```
┌──────────────────────────────────────────────────┐
│            Cloudflare Workers (Free)              │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │  src/worker.js (Worker Entry Point)         │  │
│  │  • Serves static assets from dist/          │  │
│  │  • Handles POST /api/chat → Workers AI      │  │
│  │  • Model: @cf/meta/llama-3.1-8b-instruct   │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │index.html│  │styles.css│  │  app.js        │   │
│  │  UI      │  │  Styling │  │  Calculator    │   │
│  └──────────┘  └──────────┘  └───────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Cloudflare account](https://dash.cloudflare.com) (free)

### Local Development

```bash
# Install dependencies
npm install

# Build & start dev server
npm run build
npx wrangler dev
```

The app will be available at `http://localhost:8787`.

> **Note:** The AI chatbot requires Cloudflare authentication locally. Run `npx wrangler login` first. The calculator works fully offline — only the chat needs the AI binding.

### Deploy to Cloudflare

```bash
# One command — builds and deploys
npm run deploy
```

Your app will be live at `https://<worker-name>.<subdomain>.workers.dev`.

---

## 💰 Cost

| Service | Cost |
|---------|------|
| Cloudflare Workers (hosting + compute) | **Free** |
| Cloudflare Workers AI (Llama 3.1 8B) | **Free** (10K neurons/day) |
| Global CDN & SSL | **Free** |
| **Total** | **₹0/month** |

---

## 📐 Salary Calculation Formula

```
Gross Salary     = CTC − Employer EPF − Gratuity
Gratuity         = (15/26) × Monthly Basic × 1
Taxable Income   = Gross − Standard Deduction − Exemptions
Take-Home Salary = Gross − Income Tax − Employee EPF − Professional Tax
```

### Tax Slabs — New Regime (FY 2026-27)

| Income Slab | Rate |
|-------------|------|
| Up to ₹4,00,000 | Nil |
| ₹4,00,001 – ₹8,00,000 | 5% |
| ₹8,00,001 – ₹12,00,000 | 10% |
| ₹12,00,001 – ₹16,00,000 | 15% |
| ₹16,00,001 – ₹20,00,000 | 20% |
| ₹20,00,001 – ₹24,00,000 | 25% |
| Above ₹24,00,000 | 30% |

**Standard Deduction:** ₹75,000 · **87A Rebate:** Zero tax up to ₹12.75L · **Cess:** 4%

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (zero dependencies)
- **Backend:** Cloudflare Workers (serverless)
- **AI:** Cloudflare Workers AI — Meta Llama 3.1 8B Instruct
- **Hosting:** Cloudflare global edge network
- **Fonts:** [Inter](https://fonts.google.com/specimen/Inter), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---

## 📄 License

MIT

---

<p align="center">
  Built with ⚡ by <a href="https://github.com/souvikghosh-git">Souvik Ghosh</a>
</p>
