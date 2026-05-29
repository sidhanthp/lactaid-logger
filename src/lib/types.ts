export type DairyLevel = 'none' | 'trace' | 'low' | 'medium' | 'high' | 'very_high';
export type SymptomLevel = 'none' | 'mild' | 'moderate' | 'severe';

export interface MealEntry {
  id: string;
  timestamp: number;
  food: string;
  dairyLevel: DairyLevel;
  estimatedLactoseGrams: number;
  lactaidPills: number;
  symptoms: SymptomLevel | null;
  symptomNotes: string;
}

export interface DairyFood {
  name: string;
  category: string;
  dairyLevel: DairyLevel;
  lactoseGrams: number;
  emoji: string;
}

export type RecommendationSource = 'personal' | 'default' | 'extrapolated' | 'needs_more_data';

export interface DosageRecommendation {
  dairyLevel: DairyLevel;
  recommendedPills: number;
  confidence: 'low' | 'medium' | 'high';
  dataPoints: number;
  successfulDataPoints: number;
  source: RecommendationSource;
  reasoning: string;
}

export type TabType = 'log' | 'history' | 'insights';
