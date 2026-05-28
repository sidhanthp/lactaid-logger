import { MealEntry, SymptomEntry, Recommendation } from "./types";

/**
 * Each Lactaid pill contains ~9000 FCC units of lactase enzyme,
 * which roughly handles ~5g of lactose for most people.
 * This ratio is the starting default — the engine adjusts per user.
 */
const DEFAULT_LACTOSE_PER_PILL = 5; // grams

interface MealOutcome {
  lactose: number;
  pills: number;
  pillsPerGram: number;
  hadSymptoms: boolean;
  severity: number; // 0-3
}

function severityToNumber(s: string): number {
  switch (s) {
    case "none": return 0;
    case "mild": return 1;
    case "moderate": return 2;
    case "severe": return 3;
    default: return 0;
  }
}

function buildOutcomes(
  meals: MealEntry[],
  symptoms: SymptomEntry[]
): MealOutcome[] {
  const symptomByMeal = new Map<string, SymptomEntry[]>();
  for (const s of symptoms) {
    const arr = symptomByMeal.get(s.mealId) || [];
    arr.push(s);
    symptomByMeal.set(s.mealId, arr);
  }

  return meals
    .filter((m) => m.totalLactoseEstimate > 0)
    .map((m) => {
      const mealSymptoms = symptomByMeal.get(m.id) || [];
      const worstSeverity = mealSymptoms.reduce(
        (max, s) => Math.max(max, severityToNumber(s.severity)),
        0
      );
      return {
        lactose: m.totalLactoseEstimate,
        pills: m.lactaidPills,
        pillsPerGram: m.lactaidPills / m.totalLactoseEstimate,
        hadSymptoms: worstSeverity > 0,
        severity: worstSeverity,
      };
    });
}

/**
 * Learn the user's personal lactose-per-pill ratio from their history.
 * We weight symptom-free meals more heavily as "successful" data points.
 */
function learnPersonalRatio(outcomes: MealOutcome[]): number {
  if (outcomes.length === 0) return DEFAULT_LACTOSE_PER_PILL;

  const successfulMeals = outcomes.filter(
    (o) => !o.hadSymptoms && o.pills > 0
  );

  if (successfulMeals.length < 2) return DEFAULT_LACTOSE_PER_PILL;

  // Weighted average: successful meals tell us the minimum effective ratio
  const totalLactose = successfulMeals.reduce((s, o) => s + o.lactose, 0);
  const totalPills = successfulMeals.reduce((s, o) => s + o.pills, 0);

  if (totalPills === 0) return DEFAULT_LACTOSE_PER_PILL;

  const learnedRatio = totalLactose / totalPills;

  // Blend learned ratio with default, weighted by sample size
  const confidence = Math.min(successfulMeals.length / 10, 1);
  return learnedRatio * confidence + DEFAULT_LACTOSE_PER_PILL * (1 - confidence);
}

export function getRecommendation(
  estimatedLactose: number,
  meals: MealEntry[],
  symptoms: SymptomEntry[]
): Recommendation {
  const outcomes = buildOutcomes(meals, symptoms);
  const personalRatio = learnPersonalRatio(outcomes);

  const rawPills = estimatedLactose / personalRatio;
  const recommendedPills = Math.max(1, Math.ceil(rawPills));

  const successCount = outcomes.filter((o) => !o.hadSymptoms).length;
  const totalRelevant = outcomes.length;

  let confidence: "low" | "medium" | "high";
  let message: string;

  if (totalRelevant < 3) {
    confidence = "low";
    message = `Based on general guidelines (~${DEFAULT_LACTOSE_PER_PILL}g lactose per pill). Log more meals to get personalized recommendations!`;
  } else if (totalRelevant < 8 || successCount < 3) {
    confidence = "medium";
    message = `Based on ${totalRelevant} logged meals. Your personal tolerance is becoming clearer — keep logging!`;
  } else {
    confidence = "high";
    message = `Personalized recommendation based on ${totalRelevant} meals (${successCount} symptom-free). Your body handles ~${personalRatio.toFixed(1)}g lactose per pill.`;
  }

  return {
    estimatedLactose,
    recommendedPills,
    confidence,
    basedOnEntries: totalRelevant,
    message,
  };
}

export interface InsightStats {
  totalMeals: number;
  symptomFreeMeals: number;
  symptomRate: number;
  avgPillsPerMeal: number;
  avgLactosePerMeal: number;
  personalRatio: number;
  worstFoods: { name: string; avgSeverity: number }[];
}

export function getInsights(
  meals: MealEntry[],
  symptoms: SymptomEntry[]
): InsightStats {
  const outcomes = buildOutcomes(meals, symptoms);
  const totalMeals = outcomes.length;

  if (totalMeals === 0) {
    return {
      totalMeals: 0,
      symptomFreeMeals: 0,
      symptomRate: 0,
      avgPillsPerMeal: 0,
      avgLactosePerMeal: 0,
      personalRatio: DEFAULT_LACTOSE_PER_PILL,
      worstFoods: [],
    };
  }

  const symptomFreeMeals = outcomes.filter((o) => !o.hadSymptoms).length;

  // Track food-level severity
  const symptomByMeal = new Map<string, number>();
  for (const s of symptoms) {
    const current = symptomByMeal.get(s.mealId) || 0;
    symptomByMeal.set(s.mealId, Math.max(current, severityToNumber(s.severity)));
  }

  const foodSeverities = new Map<string, number[]>();
  for (const meal of meals) {
    const sev = symptomByMeal.get(meal.id) || 0;
    for (const food of meal.foods) {
      const arr = foodSeverities.get(food.name) || [];
      arr.push(sev);
      foodSeverities.set(food.name, arr);
    }
  }

  const worstFoods = Array.from(foodSeverities.entries())
    .map(([name, sevs]) => ({
      name,
      avgSeverity: sevs.reduce((a, b) => a + b, 0) / sevs.length,
    }))
    .filter((f) => f.avgSeverity > 0.5)
    .sort((a, b) => b.avgSeverity - a.avgSeverity)
    .slice(0, 5);

  return {
    totalMeals,
    symptomFreeMeals,
    symptomRate: ((totalMeals - symptomFreeMeals) / totalMeals) * 100,
    avgPillsPerMeal:
      outcomes.reduce((s, o) => s + o.pills, 0) / totalMeals,
    avgLactosePerMeal:
      outcomes.reduce((s, o) => s + o.lactose, 0) / totalMeals,
    personalRatio: learnPersonalRatio(outcomes),
    worstFoods,
  };
}
