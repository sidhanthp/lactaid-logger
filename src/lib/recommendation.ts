import { MealEntry, SymptomEntry, Recommendation, UserStats } from "./types";
import { getMeals, getSymptoms } from "./storage";

/**
 * The recommendation engine learns from the user's history.
 *
 * Core logic:
 * - Each Lactaid pill handles ~5g of lactose for an average person
 * - But individual tolerance varies widely (2-8g per pill)
 * - We track which dairy/pill ratios resulted in no symptoms
 * - Over time, we narrow down the user's personal threshold
 */

const DEFAULT_LACTOSE_PER_PILL = 5; // grams of lactose one pill handles (starting assumption)

interface MealWithSymptom {
  meal: MealEntry;
  symptom: SymptomEntry;
}

function getPairedEntries(): MealWithSymptom[] {
  const meals = getMeals();
  const symptoms = getSymptoms();

  return meals
    .map((meal) => {
      const symptom = symptoms.find((s) => s.mealId === meal.id);
      if (!symptom) return null;
      return { meal, symptom };
    })
    .filter((entry): entry is MealWithSymptom => entry !== null);
}

export function getPersonalThreshold(): number | null {
  const paired = getPairedEntries();
  const successfulEntries = paired.filter(
    (e) => !e.symptom.hadSymptoms && e.meal.lactaidPills > 0 && e.meal.totalDairyGrams > 0
  );

  if (successfulEntries.length < 3) return null;

  // Calculate lactose-per-pill ratio for each successful entry
  const ratios = successfulEntries.map(
    (e) => e.meal.totalDairyGrams / e.meal.lactaidPills
  );

  // Use the minimum successful ratio as the safe threshold
  // (most conservative estimate of what one pill can handle)
  const minRatio = Math.min(...ratios);
  const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;

  // Blend: 70% conservative (min), 30% average for a practical threshold
  return minRatio * 0.7 + avgRatio * 0.3;
}

export function getRecommendation(dairyGrams: number): Recommendation {
  const paired = getPairedEntries();
  const threshold = getPersonalThreshold();

  if (paired.length < 3 || threshold === null) {
    // Not enough data - use default
    const pills = Math.ceil(dairyGrams / DEFAULT_LACTOSE_PER_PILL);
    return {
      dairyGrams,
      recommendedPills: Math.max(1, pills),
      confidence: "low",
      basedOnEntries: paired.length,
      message:
        paired.length === 0
          ? "Using general guidelines. Log more meals to get personalized recommendations!"
          : `Based on ${paired.length} logged meal(s). Need at least 3 complete entries for personalized advice.`,
    };
  }

  const recommendedPills = Math.ceil(dairyGrams / threshold);

  // Determine confidence based on how much data we have
  let confidence: "low" | "medium" | "high";
  if (paired.length >= 10) {
    confidence = "high";
  } else if (paired.length >= 5) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  // Check for recent failures at this dosage level
  const recentFailures = paired
    .filter((e) => e.symptom.hadSymptoms)
    .filter((e) => {
      const ratio = e.meal.totalDairyGrams / Math.max(1, e.meal.lactaidPills);
      return ratio <= threshold * 1.2; // failures near the threshold
    });

  let message = `Based on your ${paired.length} logged meals, your body handles ~${threshold.toFixed(1)}g of lactose per pill.`;

  if (recentFailures.length > 0) {
    message += " Being conservative due to some recent discomfort at similar levels.";
    return {
      dairyGrams,
      recommendedPills: recommendedPills + 1,
      confidence,
      basedOnEntries: paired.length,
      message,
    };
  }

  return {
    dairyGrams,
    recommendedPills: Math.max(1, recommendedPills),
    confidence,
    basedOnEntries: paired.length,
    message,
  };
}

export function getUserStats(): UserStats {
  const meals = getMeals();
  const paired = getPairedEntries();

  if (meals.length === 0) {
    return {
      totalMeals: 0,
      avgDairyPerMeal: 0,
      avgPillsPerMeal: 0,
      symptomFreeRate: 0,
      personalThreshold: null,
      successfulPairedCount: 0,
    };
  }

  const avgDairy =
    meals.reduce((sum, m) => sum + m.totalDairyGrams, 0) / meals.length;
  const avgPills =
    meals.reduce((sum, m) => sum + m.lactaidPills, 0) / meals.length;
  const symptomFree = paired.filter((e) => !e.symptom.hadSymptoms).length;
  const symptomFreeRate =
    paired.length > 0 ? symptomFree / paired.length : 0;

  const successfulPairedCount = paired.filter(
    (e) => !e.symptom.hadSymptoms && e.meal.lactaidPills > 0 && e.meal.totalDairyGrams > 0
  ).length;

  return {
    totalMeals: meals.length,
    avgDairyPerMeal: avgDairy,
    avgPillsPerMeal: avgPills,
    symptomFreeRate,
    personalThreshold: getPersonalThreshold(),
    successfulPairedCount,
  };
}
