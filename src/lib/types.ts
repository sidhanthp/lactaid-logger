export interface DairyItem {
  name: string;
  category: DairyCategory;
  lactosePerServing: number; // grams of lactose per typical serving
  servingDescription: string;
}

export type DairyCategory =
  | "milk"
  | "cheese"
  | "yogurt"
  | "ice_cream"
  | "butter"
  | "cream"
  | "baked"
  | "other";

export const CATEGORY_LABELS: Record<DairyCategory, string> = {
  milk: "Milk & Drinks",
  cheese: "Cheese",
  yogurt: "Yogurt",
  ice_cream: "Ice Cream & Frozen",
  butter: "Butter & Spreads",
  cream: "Cream & Sauces",
  baked: "Baked Goods",
  other: "Other / Mixed",
};

export interface MealEntry {
  id: string;
  timestamp: number; // Unix ms
  foods: FoodLogItem[];
  totalLactoseEstimate: number; // grams
  lactaidPills: number;
  notes: string;
}

export interface FoodLogItem {
  id: string;
  name: string;
  servings: number;
  lactosePerServing: number;
  isCustom: boolean;
}

export interface SymptomEntry {
  id: string;
  mealId: string;
  timestamp: number;
  severity: SymptomSeverity;
  symptoms: SymptomType[];
  notes: string;
  hoursAfterMeal: number;
}

export type SymptomSeverity = "none" | "mild" | "moderate" | "severe";

export type SymptomType =
  | "bloating"
  | "gas"
  | "cramps"
  | "diarrhea"
  | "nausea"
  | "other";

export const SYMPTOM_LABELS: Record<SymptomType, string> = {
  bloating: "Bloating",
  gas: "Gas",
  cramps: "Cramps",
  diarrhea: "Diarrhea",
  nausea: "Nausea",
  other: "Other",
};

export const SEVERITY_LABELS: Record<SymptomSeverity, string> = {
  none: "No Symptoms",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
};

export interface Recommendation {
  estimatedLactose: number;
  recommendedPills: number;
  confidence: "low" | "medium" | "high";
  basedOnEntries: number;
  message: string;
}
