import { MealEntry, SymptomEntry } from "./types";

const MEALS_KEY = "lactaid_meals";
const SYMPTOMS_KEY = "lactaid_symptoms";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getMeals(): MealEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(MEALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMeal(meal: MealEntry): void {
  if (!isBrowser()) return;
  const meals = getMeals();
  meals.push(meal);
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
}

export function deleteMeal(mealId: string): void {
  if (!isBrowser()) return;
  const meals = getMeals().filter((m) => m.id !== mealId);
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  // Also delete associated symptoms
  const symptoms = getSymptoms().filter((s) => s.mealId !== mealId);
  localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(symptoms));
}

export function getSymptoms(): SymptomEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(SYMPTOMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSymptom(symptom: SymptomEntry): void {
  if (!isBrowser()) return;
  const symptoms = getSymptoms();
  symptoms.push(symptom);
  localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(symptoms));
}

export function updateSymptom(symptom: SymptomEntry): void {
  if (!isBrowser()) return;
  const symptoms = getSymptoms().map((s) =>
    s.id === symptom.id ? symptom : s
  );
  localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(symptoms));
}

export function deleteSymptom(symptomId: string): void {
  if (!isBrowser()) return;
  const symptoms = getSymptoms().filter((s) => s.id !== symptomId);
  localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(symptoms));
}

export function clearAllData(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(MEALS_KEY);
  localStorage.removeItem(SYMPTOMS_KEY);
}
