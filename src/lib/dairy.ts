import { DairyFood, DairyLevel } from './types';

export const DAIRY_FOODS: DairyFood[] = [
  // Very High Dairy
  { name: 'Glass of Milk', category: 'Drinks', dairyLevel: 'very_high', lactoseGrams: 12, emoji: '🥛' },
  { name: 'Milkshake', category: 'Drinks', dairyLevel: 'very_high', lactoseGrams: 14, emoji: '🥤' },
  { name: 'Hot Chocolate (with milk)', category: 'Drinks', dairyLevel: 'very_high', lactoseGrams: 10, emoji: '☕' },
  { name: 'Ice Cream (1 cup)', category: 'Desserts', dairyLevel: 'very_high', lactoseGrams: 9, emoji: '🍦' },
  { name: 'Frozen Yogurt', category: 'Desserts', dairyLevel: 'very_high', lactoseGrams: 8, emoji: '🍧' },
  { name: 'Cheesecake', category: 'Desserts', dairyLevel: 'very_high', lactoseGrams: 10, emoji: '🍰' },
  { name: 'Cream Soup', category: 'Soups', dairyLevel: 'very_high', lactoseGrams: 9, emoji: '🍲' },

  // High Dairy
  { name: 'Pizza (2 slices)', category: 'Meals', dairyLevel: 'high', lactoseGrams: 6, emoji: '🍕' },
  { name: 'Mac & Cheese', category: 'Meals', dairyLevel: 'high', lactoseGrams: 8, emoji: '🧀' },
  { name: 'Grilled Cheese Sandwich', category: 'Meals', dairyLevel: 'high', lactoseGrams: 5, emoji: '🥪' },
  { name: 'Alfredo Pasta', category: 'Meals', dairyLevel: 'high', lactoseGrams: 7, emoji: '🍝' },
  { name: 'Yogurt (1 cup)', category: 'Snacks', dairyLevel: 'high', lactoseGrams: 6, emoji: '🥣' },
  { name: 'Cream Cheese Bagel', category: 'Breakfast', dairyLevel: 'high', lactoseGrams: 5, emoji: '🥯' },
  { name: 'Quesadilla', category: 'Meals', dairyLevel: 'high', lactoseGrams: 5, emoji: '🌮' },
  { name: 'Lasagna', category: 'Meals', dairyLevel: 'high', lactoseGrams: 7, emoji: '🍝' },
  { name: 'Nachos with Cheese', category: 'Snacks', dairyLevel: 'high', lactoseGrams: 5, emoji: '🧀' },
  { name: 'Cheese Omelette', category: 'Breakfast', dairyLevel: 'high', lactoseGrams: 4, emoji: '🍳' },

  // Medium Dairy
  { name: 'Cheeseburger', category: 'Meals', dairyLevel: 'medium', lactoseGrams: 3, emoji: '🍔' },
  { name: 'Buttered Toast', category: 'Breakfast', dairyLevel: 'medium', lactoseGrams: 2, emoji: '🍞' },
  { name: 'Mashed Potatoes', category: 'Sides', dairyLevel: 'medium', lactoseGrams: 3, emoji: '🥔' },
  { name: 'Pancakes', category: 'Breakfast', dairyLevel: 'medium', lactoseGrams: 3, emoji: '🥞' },
  { name: 'Caesar Salad', category: 'Meals', dairyLevel: 'medium', lactoseGrams: 2, emoji: '🥗' },
  { name: 'Chocolate Bar', category: 'Snacks', dairyLevel: 'medium', lactoseGrams: 3, emoji: '🍫' },
  { name: 'Creamy Dressing/Dip', category: 'Sides', dairyLevel: 'medium', lactoseGrams: 2, emoji: '🥣' },
  { name: 'Scrambled Eggs (with butter)', category: 'Breakfast', dairyLevel: 'medium', lactoseGrams: 2, emoji: '🍳' },

  // Low Dairy
  { name: 'Coffee with Cream', category: 'Drinks', dairyLevel: 'low', lactoseGrams: 1, emoji: '☕' },
  { name: 'Latte', category: 'Drinks', dairyLevel: 'low', lactoseGrams: 2, emoji: '☕' },
  { name: 'Bread/Baked Goods', category: 'Snacks', dairyLevel: 'low', lactoseGrams: 1, emoji: '🍞' },
  { name: 'Cookie', category: 'Desserts', dairyLevel: 'low', lactoseGrams: 1, emoji: '🍪' },
  { name: 'Dark Chocolate', category: 'Snacks', dairyLevel: 'low', lactoseGrams: 1, emoji: '🍫' },
  { name: 'Aged Cheese (small)', category: 'Snacks', dairyLevel: 'low', lactoseGrams: 0.5, emoji: '🧀' },

  // Trace
  { name: 'Hard Cheese (Parmesan)', category: 'Toppings', dairyLevel: 'trace', lactoseGrams: 0.2, emoji: '🧀' },
  { name: 'Butter (small amount)', category: 'Toppings', dairyLevel: 'trace', lactoseGrams: 0.1, emoji: '🧈' },
  { name: 'Whey Protein', category: 'Supplements', dairyLevel: 'trace', lactoseGrams: 0.3, emoji: '💪' },

  // No Dairy
  { name: 'Salad (no dressing)', category: 'Meals', dairyLevel: 'none', lactoseGrams: 0, emoji: '🥗' },
  { name: 'Grilled Chicken', category: 'Meals', dairyLevel: 'none', lactoseGrams: 0, emoji: '🍗' },
  { name: 'Rice & Beans', category: 'Meals', dairyLevel: 'none', lactoseGrams: 0, emoji: '🍚' },
  { name: 'Fruit', category: 'Snacks', dairyLevel: 'none', lactoseGrams: 0, emoji: '🍎' },
  { name: 'Sushi', category: 'Meals', dairyLevel: 'none', lactoseGrams: 0, emoji: '🍣' },
  { name: 'Stir Fry', category: 'Meals', dairyLevel: 'none', lactoseGrams: 0, emoji: '🥘' },
];

export const DAIRY_LEVEL_INFO: Record<DairyLevel, { label: string; color: string; emoji: string; description: string }> = {
  none: { label: 'No Dairy', color: '#10b981', emoji: '🟢', description: 'No lactose' },
  trace: { label: 'Trace', color: '#6ee7b7', emoji: '🔵', description: '<0.5g lactose' },
  low: { label: 'Low', color: '#fbbf24', emoji: '🟡', description: '0.5-2g lactose' },
  medium: { label: 'Medium', color: '#f97316', emoji: '🟠', description: '2-4g lactose' },
  high: { label: 'High', color: '#ef4444', emoji: '🔴', description: '4-8g lactose' },
  very_high: { label: 'Very High', color: '#dc2626', emoji: '🔴🔴', description: '8g+ lactose' },
};

export function searchFoods(query: string): DairyFood[] {
  if (!query.trim()) return DAIRY_FOODS;
  const lower = query.toLowerCase();
  return DAIRY_FOODS.filter(
    f => f.name.toLowerCase().includes(lower) || f.category.toLowerCase().includes(lower)
  );
}

export function estimateDairyLevel(lactoseGrams: number): DairyLevel {
  if (lactoseGrams <= 0) return 'none';
  if (lactoseGrams <= 0.5) return 'trace';
  if (lactoseGrams <= 2) return 'low';
  if (lactoseGrams <= 4) return 'medium';
  if (lactoseGrams <= 8) return 'high';
  return 'very_high';
}
