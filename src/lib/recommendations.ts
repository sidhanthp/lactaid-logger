import { DairyLevel, DosageRecommendation, MealEntry, SymptomLevel } from './types';

const DAIRY_LEVELS: DairyLevel[] = ['none', 'trace', 'low', 'medium', 'high', 'very_high'];

const SYMPTOM_SCORE: Record<SymptomLevel, number> = {
  none: 0,
  mild: 1,
  moderate: 2,
  severe: 3,
};

export function getRecommendations(meals: MealEntry[]): DosageRecommendation[] {
  return DAIRY_LEVELS.filter(level => level !== 'none').map(level => {
    const relevantMeals = meals.filter(m => m.dairyLevel === level && m.symptoms !== null);
    if (relevantMeals.length === 0) {
      return {
        dairyLevel: level,
        recommendedPills: getDefaultRecommendation(level),
        confidence: 'low' as const,
        dataPoints: 0,
      };
    }

    const successfulMeals = relevantMeals.filter(m => m.symptoms === 'none' || m.symptoms === 'mild');
    let recommendedPills: number;

    if (successfulMeals.length > 0) {
      const pillCounts = successfulMeals.map(m => m.lactaidPills);
      recommendedPills = Math.min(...pillCounts);
    } else {
      const maxUsed = Math.max(...relevantMeals.map(m => m.lactaidPills));
      recommendedPills = maxUsed + 1;
    }

    const confidence = relevantMeals.length >= 5 ? 'high' : relevantMeals.length >= 2 ? 'medium' : 'low';

    return {
      dairyLevel: level,
      recommendedPills: Math.max(0, recommendedPills),
      confidence,
      dataPoints: relevantMeals.length,
    };
  });
}

function getDefaultRecommendation(level: DairyLevel): number {
  switch (level) {
    case 'trace': return 0;
    case 'low': return 1;
    case 'medium': return 1;
    case 'high': return 2;
    case 'very_high': return 3;
    default: return 0;
  }
}

export function getStats(meals: MealEntry[]) {
  const mealsWithSymptoms = meals.filter(m => m.symptoms !== null);
  const totalMeals = meals.length;
  const trackedMeals = mealsWithSymptoms.length;

  if (trackedMeals === 0) {
    return {
      totalMeals,
      trackedMeals,
      successRate: 0,
      avgPills: 0,
      avgSymptomScore: 0,
      mostCommonFood: 'N/A',
      weeklyTrend: [] as { week: string; avgScore: number }[],
    };
  }

  const symptomFreeMeals = mealsWithSymptoms.filter(m => m.symptoms === 'none');
  const successRate = Math.round((symptomFreeMeals.length / trackedMeals) * 100);
  const avgPills = Number((meals.reduce((sum, m) => sum + m.lactaidPills, 0) / totalMeals).toFixed(1));
  const avgSymptomScore = Number(
    (mealsWithSymptoms.reduce((sum, m) => sum + SYMPTOM_SCORE[m.symptoms!], 0) / trackedMeals).toFixed(1)
  );

  const foodCounts: Record<string, number> = {};
  meals.forEach(m => {
    foodCounts[m.food] = (foodCounts[m.food] || 0) + 1;
  });
  const mostCommonFood = Object.entries(foodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weeklyTrend: { week: string; avgScore: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = now - (i + 1) * weekMs;
    const weekEnd = now - i * weekMs;
    const weekMeals = mealsWithSymptoms.filter(m => m.timestamp >= weekStart && m.timestamp < weekEnd);
    if (weekMeals.length > 0) {
      const avg = weekMeals.reduce((sum, m) => sum + SYMPTOM_SCORE[m.symptoms!], 0) / weekMeals.length;
      weeklyTrend.push({ week: `Week ${4 - i}`, avgScore: Number(avg.toFixed(1)) });
    }
  }

  return { totalMeals, trackedMeals, successRate, avgPills, avgSymptomScore, mostCommonFood, weeklyTrend };
}
