import { MealEntry, DairyLevel } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'lactaid-logger-meals';

export function getMeals(): MealEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function createAndSaveMeal(params: {
  food: string;
  dairyLevel: DairyLevel;
  estimatedLactoseGrams: number;
  lactaidPills: number;
}): void {
  const meal: MealEntry = {
    id: uuidv4(),
    timestamp: Date.now(),
    food: params.food,
    dairyLevel: params.dairyLevel,
    estimatedLactoseGrams: params.estimatedLactoseGrams,
    lactaidPills: params.lactaidPills,
    symptoms: null,
    symptomNotes: '',
  };
  const meals = getMeals();
  meals.unshift(meal);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
}

export function saveMeal(meal: MealEntry): void {
  const meals = getMeals();
  meals.unshift(meal);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
}

export function updateMeal(id: string, updates: Partial<MealEntry>): void {
  const meals = getMeals();
  const index = meals.findIndex(m => m.id === id);
  if (index !== -1) {
    meals[index] = { ...meals[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
  }
}

export function deleteMeal(id: string): void {
  const meals = getMeals().filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
}
