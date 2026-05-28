import { MealEntry, DairyLevel } from './types';

const API_BASE = '/api/meals';

export async function fetchMeals(): Promise<MealEntry[]> {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return [];
  }
}

export async function createMeal(params: {
  food: string;
  dairyLevel: DairyLevel;
  estimatedLactoseGrams: number;
  lactaidPills: number;
}): Promise<MealEntry> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to create meal');
  return await res.json();
}

export async function updateMealApi(id: string, updates: Partial<MealEntry>): Promise<MealEntry> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update meal');
  return await res.json();
}

export async function deleteMealApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete meal');
}
