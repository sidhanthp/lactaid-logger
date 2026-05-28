export interface FoodItem {
  name: string;
  dairyGrams: number; // estimated grams of lactose
}

export interface MealEntry {
  id: string;
  timestamp: number;
  foods: FoodItem[];
  totalDairyGrams: number;
  lactaidPills: number; // number of Lactaid pills taken (each ~9000 FCC units)
  notes: string;
}

export interface SymptomEntry {
  id: string;
  mealId: string;
  timestamp: number;
  hadSymptoms: boolean;
  severity: 0 | 1 | 2 | 3; // 0=none, 1=mild, 2=moderate, 3=severe
  symptomTypes: SymptomType[];
  hoursAfterMeal: number;
}

export type SymptomType =
  | "bloating"
  | "gas"
  | "cramps"
  | "diarrhea"
  | "nausea"
  | "other";

export interface DairyEstimate {
  food: string;
  category: DairyCategory;
  lactosePerServing: number; // grams of lactose per typical serving
  servingDescription: string;
}

export type DairyCategory =
  | "milk"
  | "cheese_high"
  | "cheese_low"
  | "yogurt"
  | "ice_cream"
  | "butter"
  | "cream"
  | "baked"
  | "other";

export interface Recommendation {
  dairyGrams: number;
  recommendedPills: number;
  confidence: "low" | "medium" | "high";
  basedOnEntries: number;
  message: string;
}

export interface UserStats {
  totalMeals: number;
  avgDairyPerMeal: number;
  avgPillsPerMeal: number;
  symptomFreeRate: number;
  personalThreshold: number | null; // lactose grams per pill that works for this person
  successfulPairedCount: number; // meals with symptom follow-up where no symptoms, pills>0, dairy>0
}
