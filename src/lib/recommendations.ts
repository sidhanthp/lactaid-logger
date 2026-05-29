import { DairyLevel, DosageRecommendation, MealEntry, RecommendationSource, SymptomLevel } from './types';

const DAIRY_LEVELS: DairyLevel[] = ['none', 'trace', 'low', 'medium', 'high', 'very_high'];

const SYMPTOM_SCORE: Record<SymptomLevel, number> = {
  none: 0,
  mild: 1,
  moderate: 2,
  severe: 3,
};

const DAIRY_LEVEL_INDEX: Record<DairyLevel, number> = {
  none: 0, trace: 1, low: 2, medium: 3, high: 4, very_high: 5,
};

const DEFAULT_PILLS: Record<DairyLevel, number> = {
  none: 0, trace: 0, low: 1, medium: 1, high: 2, very_high: 3,
};

const MINIMUM_FLOORS: Record<DairyLevel, number> = {
  none: 0, trace: 0, low: 0, medium: 1, high: 1, very_high: 2,
};

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function extrapolateFromAdjacent(meals: MealEntry[], targetLevel: DairyLevel): number | null {
  const targetIdx = DAIRY_LEVEL_INDEX[targetLevel];
  const tracked = meals.filter(m => m.symptoms !== null);

  let bestMatch: { pills: number; distance: number } | null = null;

  for (const level of DAIRY_LEVELS) {
    if (level === 'none' || level === targetLevel) continue;
    const levelIdx = DAIRY_LEVEL_INDEX[level];
    const successful = tracked.filter(
      m => m.dairyLevel === level && (m.symptoms === 'none' || m.symptoms === 'mild')
    );
    if (successful.length < 2) continue;

    const medianPills = median(successful.map(m => m.lactaidPills));
    const distance = Math.abs(targetIdx - levelIdx);

    if (!bestMatch || distance < bestMatch.distance) {
      const scaleFactor = targetIdx / levelIdx;
      const extrapolated = Math.round(medianPills * scaleFactor);
      bestMatch = { pills: extrapolated, distance };
    }
  }

  return bestMatch?.pills ?? null;
}

export function getRecommendations(meals: MealEntry[]): DosageRecommendation[] {
  return DAIRY_LEVELS.filter(level => level !== 'none').map(level => {
    const relevantMeals = meals.filter(m => m.dairyLevel === level && m.symptoms !== null);
    const successfulMeals = relevantMeals.filter(m => m.symptoms === 'none' || m.symptoms === 'mild');
    const floor = MINIMUM_FLOORS[level];
    const defaultPills = DEFAULT_PILLS[level];

    if (relevantMeals.length === 0) {
      const extrapolated = extrapolateFromAdjacent(meals, level);
      if (extrapolated !== null) {
        const pills = Math.max(extrapolated, floor);
        return makeRec(level, pills, 'low', 0, 0, 'extrapolated',
          'Estimated from your results at other dairy levels');
      }
      return makeRec(level, defaultPills, 'low', 0, 0, 'default',
        'Research-based default — log meals to personalize');
    }

    if (successfulMeals.length === 0) {
      const maxUsed = Math.max(...relevantMeals.map(m => m.lactaidPills));
      const pills = Math.max(maxUsed + 1, floor);
      return makeRec(level, pills, 'low', relevantMeals.length, 0, 'needs_more_data',
        `${relevantMeals.length} meal${relevantMeals.length !== 1 ? 's' : ''} tracked, all with symptoms — try ${pills} pills`);
    }

    const pillCounts = successfulMeals.map(m => m.lactaidPills);
    let pills: number;

    if (successfulMeals.length <= 2) {
      const medianPills = median(pillCounts);
      pills = Math.round((medianPills + defaultPills) / 2);
    } else {
      pills = median(pillCounts);
    }

    pills = Math.max(pills, floor);

    const confidence: 'low' | 'medium' | 'high' =
      successfulMeals.length >= 5 ? 'high' :
      successfulMeals.length >= 3 ? 'medium' : 'low';

    const reasoning = successfulMeals.length <= 2
      ? `Based on ${successfulMeals.length} successful meal${successfulMeals.length !== 1 ? 's' : ''}, blended with default`
      : `Based on ${successfulMeals.length} successful meals`;

    return makeRec(level, pills, confidence, relevantMeals.length, successfulMeals.length, 'personal', reasoning);
  });
}

function makeRec(
  dairyLevel: DairyLevel,
  recommendedPills: number,
  confidence: 'low' | 'medium' | 'high',
  dataPoints: number,
  successfulDataPoints: number,
  source: RecommendationSource,
  reasoning: string,
): DosageRecommendation {
  return { dairyLevel, recommendedPills, confidence, dataPoints, successfulDataPoints, source, reasoning };
}

export function getStats(meals: MealEntry[]) {
  const mealsWithSymptoms = meals.filter(m => m.symptoms !== null);
  const totalMeals = meals.length;
  const trackedMeals = mealsWithSymptoms.length;

  if (trackedMeals === 0) {
    const avgPills = totalMeals > 0 ? Number((meals.reduce((sum, m) => sum + m.lactaidPills, 0) / totalMeals).toFixed(1)) : 0;
    const foodCounts: Record<string, number> = {};
    meals.forEach(m => { foodCounts[m.food] = (foodCounts[m.food] || 0) + 1; });
    const mostCommonFood = Object.entries(foodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
    return {
      totalMeals,
      trackedMeals,
      successRate: 0,
      avgPills,
      avgSymptomScore: 0,
      mostCommonFood,
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

export interface PatternInsight {
  emoji: string;
  text: string;
  type: 'success' | 'warning' | 'info';
}

export function getPatternInsights(meals: MealEntry[]): PatternInsight[] {
  const insights: PatternInsight[] = [];
  const tracked = meals.filter(m => m.symptoms !== null);
  if (tracked.length < 3) return insights;

  // Find foods that always work with specific pill counts
  const foodResults: Record<string, { successes: number; failures: number; bestPills: number }> = {};
  tracked.forEach(m => {
    if (!foodResults[m.food]) foodResults[m.food] = { successes: 0, failures: 0, bestPills: Infinity };
    const ok = m.symptoms === 'none' || m.symptoms === 'mild';
    if (ok) {
      foodResults[m.food].successes++;
      foodResults[m.food].bestPills = Math.min(foodResults[m.food].bestPills, m.lactaidPills);
    } else {
      foodResults[m.food].failures++;
    }
  });

  Object.entries(foodResults).forEach(([food, r]) => {
    if (r.successes >= 2 && r.failures === 0) {
      insights.push({
        emoji: '🎯',
        text: `${food} + ${r.bestPills} pill${r.bestPills !== 1 ? 's' : ''} = always works for you`,
        type: 'success',
      });
    }
    if (r.failures >= 2 && r.successes === 0) {
      insights.push({
        emoji: '⚠️',
        text: `${food} causes symptoms every time — try more pills`,
        type: 'warning',
      });
    }
  });

  // Time-of-day pattern
  const evening = tracked.filter(m => {
    const h = new Date(m.timestamp).getHours();
    return h >= 18;
  });
  const daytime = tracked.filter(m => {
    const h = new Date(m.timestamp).getHours();
    return h >= 6 && h < 18;
  });
  if (evening.length >= 2 && daytime.length >= 2) {
    const eveningBad = evening.filter(m => m.symptoms === 'moderate' || m.symptoms === 'severe').length / evening.length;
    const daytimeBad = daytime.filter(m => m.symptoms === 'moderate' || m.symptoms === 'severe').length / daytime.length;
    if (eveningBad > daytimeBad + 0.3) {
      insights.push({ emoji: '🌙', text: 'You tend to have worse symptoms with evening meals', type: 'warning' });
    }
  }

  // Improving over time
  if (tracked.length >= 4) {
    const half = Math.floor(tracked.length / 2);
    const sorted = [...tracked].sort((a, b) => a.timestamp - b.timestamp);
    const olderHalf = sorted.slice(0, half);
    const newerHalf = sorted.slice(half);
    const olderAvg = olderHalf.reduce((s, m) => s + SYMPTOM_SCORE[m.symptoms!], 0) / olderHalf.length;
    const newerAvg = newerHalf.reduce((s, m) => s + SYMPTOM_SCORE[m.symptoms!], 0) / newerHalf.length;
    if (newerAvg < olderAvg - 0.5) {
      insights.push({ emoji: '📈', text: 'Your symptoms are improving over time — great job!', type: 'success' });
    }
  }

  // Zero-pill successes
  const zeroPillSuccesses = tracked.filter(m => m.lactaidPills === 0 && (m.symptoms === 'none' || m.symptoms === 'mild'));
  if (zeroPillSuccesses.length >= 2) {
    const foods = [...new Set(zeroPillSuccesses.map(m => m.food))].slice(0, 3).join(', ');
    insights.push({ emoji: '🆓', text: `You tolerate ${foods} without pills`, type: 'info' });
  }

  return insights.slice(0, 5);
}

export function exportMealsToCsv(meals: MealEntry[]): string {
  const headers = ['Date', 'Time', 'Food', 'Dairy Level', 'Lactose (g)', 'Pills', 'Symptoms', 'Notes'];
  const rows = meals.map(m => {
    const d = new Date(m.timestamp);
    return [
      d.toLocaleDateString(),
      d.toLocaleTimeString(),
      m.food,
      m.dairyLevel,
      String(m.estimatedLactoseGrams),
      String(m.lactaidPills),
      m.symptoms ?? 'pending',
      m.symptomNotes || '',
    ].map(v => `"${v.replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}
