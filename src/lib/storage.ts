import { MealEntry, SymptomEntry } from "./types";

const MEALS_KEY = "lactaid_meals";
const SYMPTOMS_KEY = "lactaid_symptoms";

export function getMeals(): MealEntry[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(MEALS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveMeal(meal: MealEntry): void {
  const meals = getMeals();
  meals.push(meal);
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
}

export function deleteMeal(id: string): void {
  const meals = getMeals().filter((m) => m.id !== id);
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  // Also delete associated symptoms
  const symptoms = getSymptoms().filter((s) => s.mealId !== id);
  localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(symptoms));
}

export function getSymptoms(): SymptomEntry[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(SYMPTOMS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveSymptom(symptom: SymptomEntry): void {
  const symptoms = getSymptoms();
  // Replace existing symptom for same meal if exists
  const idx = symptoms.findIndex((s) => s.mealId === symptom.mealId);
  if (idx >= 0) {
    symptoms[idx] = symptom;
  } else {
    symptoms.push(symptom);
  }
  localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(symptoms));
}

export function getSymptomForMeal(mealId: string): SymptomEntry | undefined {
  return getSymptoms().find((s) => s.mealId === mealId);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
