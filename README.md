# Lactaid Logger

Track your dairy intake, Lactaid dosage, and symptoms — then get personalized recommendations for how many pills you need.

## Features

- **Meal Logging** — Search from 50+ common dairy foods with pre-estimated lactose content, or add custom entries
- **Smart Recommendations** — Get personalized Lactaid pill suggestions that improve as you log more meals
- **Symptom Tracking** — Log how you feel after each meal (severity + specific symptoms)
- **Insights Dashboard** — See your personal lactose tolerance, symptom rate, and problem foods
- **Learning Engine** — The app learns your personal lactose-per-pill ratio from your history

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- localStorage for data persistence
- Deployed on Railway

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Log a meal** — Search for foods you ate and the app estimates total lactose
2. **Enter Lactaid taken** — Record how many pills you took
3. **Log symptoms later** — Come back after a few hours and record how you feel
4. **Get smarter recommendations** — The app builds a personal model of your tolerance

The recommendation engine starts with a general guideline (~5g lactose per pill) and adjusts based on your symptom-free meals to learn your personal ratio.
