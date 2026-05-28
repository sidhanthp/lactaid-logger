import { DairyEstimate } from "./types";

// Lactose content estimates per typical serving
// Sources: USDA FoodData Central, general nutritional references
export const DAIRY_DATABASE: DairyEstimate[] = [
  // Milk products
  {
    food: "Whole milk (1 cup)",
    category: "milk",
    lactosePerServing: 12,
    servingDescription: "8 oz / 240ml",
  },
  {
    food: "Skim milk (1 cup)",
    category: "milk",
    lactosePerServing: 13,
    servingDescription: "8 oz / 240ml",
  },
  {
    food: "Chocolate milk (1 cup)",
    category: "milk",
    lactosePerServing: 10,
    servingDescription: "8 oz / 240ml",
  },
  // Cream
  {
    food: "Heavy cream (2 tbsp)",
    category: "cream",
    lactosePerServing: 1,
    servingDescription: "2 tablespoons",
  },
  {
    food: "Half and half (2 tbsp)",
    category: "cream",
    lactosePerServing: 1.5,
    servingDescription: "2 tablespoons",
  },
  {
    food: "Whipped cream (2 tbsp)",
    category: "cream",
    lactosePerServing: 0.5,
    servingDescription: "2 tablespoons",
  },
  {
    food: "Coffee creamer (1 tbsp)",
    category: "cream",
    lactosePerServing: 0.5,
    servingDescription: "1 tablespoon",
  },
  // Ice cream
  {
    food: "Ice cream (1/2 cup)",
    category: "ice_cream",
    lactosePerServing: 6,
    servingDescription: "1/2 cup scoop",
  },
  {
    food: "Gelato (1/2 cup)",
    category: "ice_cream",
    lactosePerServing: 4,
    servingDescription: "1/2 cup",
  },
  {
    food: "Frozen yogurt (1/2 cup)",
    category: "ice_cream",
    lactosePerServing: 5,
    servingDescription: "1/2 cup",
  },
  {
    food: "Milkshake (12 oz)",
    category: "ice_cream",
    lactosePerServing: 15,
    servingDescription: "12 oz / 350ml",
  },
  // High-lactose cheeses
  {
    food: "Ricotta (1/2 cup)",
    category: "cheese_high",
    lactosePerServing: 6,
    servingDescription: "1/2 cup",
  },
  {
    food: "Cottage cheese (1/2 cup)",
    category: "cheese_high",
    lactosePerServing: 3,
    servingDescription: "1/2 cup",
  },
  {
    food: "Cream cheese (2 tbsp)",
    category: "cheese_high",
    lactosePerServing: 1.5,
    servingDescription: "2 tablespoons",
  },
  {
    food: "American cheese (1 slice)",
    category: "cheese_high",
    lactosePerServing: 2,
    servingDescription: "1 slice",
  },
  {
    food: "Mozzarella (1 oz)",
    category: "cheese_high",
    lactosePerServing: 0.5,
    servingDescription: "1 oz / 28g",
  },
  // Low-lactose cheeses (aged)
  {
    food: "Cheddar (1 oz)",
    category: "cheese_low",
    lactosePerServing: 0.1,
    servingDescription: "1 oz / 28g",
  },
  {
    food: "Parmesan (1 oz)",
    category: "cheese_low",
    lactosePerServing: 0.1,
    servingDescription: "1 oz / 28g",
  },
  {
    food: "Swiss (1 oz)",
    category: "cheese_low",
    lactosePerServing: 0.1,
    servingDescription: "1 oz / 28g",
  },
  {
    food: "Gouda (1 oz)",
    category: "cheese_low",
    lactosePerServing: 0.1,
    servingDescription: "1 oz / 28g",
  },
  // Yogurt
  {
    food: "Regular yogurt (6 oz)",
    category: "yogurt",
    lactosePerServing: 8,
    servingDescription: "6 oz container",
  },
  {
    food: "Greek yogurt (6 oz)",
    category: "yogurt",
    lactosePerServing: 4,
    servingDescription: "6 oz container",
  },
  // Butter
  {
    food: "Butter (1 tbsp)",
    category: "butter",
    lactosePerServing: 0.1,
    servingDescription: "1 tablespoon",
  },
  // Baked goods & common foods
  {
    food: "Pizza slice (cheese)",
    category: "baked",
    lactosePerServing: 4,
    servingDescription: "1 large slice",
  },
  {
    food: "Mac and cheese (1 cup)",
    category: "baked",
    lactosePerServing: 8,
    servingDescription: "1 cup",
  },
  {
    food: "Grilled cheese sandwich",
    category: "baked",
    lactosePerServing: 5,
    servingDescription: "1 sandwich",
  },
  {
    food: "Cream-based pasta (1 cup)",
    category: "baked",
    lactosePerServing: 6,
    servingDescription: "1 cup / entrée",
  },
  {
    food: "Pancakes (2 medium)",
    category: "baked",
    lactosePerServing: 3,
    servingDescription: "2 medium pancakes",
  },
  {
    food: "Muffin (1 medium)",
    category: "baked",
    lactosePerServing: 2,
    servingDescription: "1 medium muffin",
  },
  {
    food: "Cheesecake (1 slice)",
    category: "baked",
    lactosePerServing: 5,
    servingDescription: "1 slice",
  },
  {
    food: "Chocolate (1 bar)",
    category: "other",
    lactosePerServing: 3,
    servingDescription: "1 standard bar",
  },
  {
    food: "Latte (12 oz)",
    category: "milk",
    lactosePerServing: 9,
    servingDescription: "12 oz / tall",
  },
  {
    food: "Cappuccino (8 oz)",
    category: "milk",
    lactosePerServing: 6,
    servingDescription: "8 oz",
  },
  {
    food: "Cream soup (1 cup)",
    category: "cream",
    lactosePerServing: 5,
    servingDescription: "1 cup",
  },
  {
    food: "Queso dip (1/4 cup)",
    category: "cheese_high",
    lactosePerServing: 3,
    servingDescription: "1/4 cup",
  },
  {
    food: "Nachos with cheese",
    category: "cheese_high",
    lactosePerServing: 5,
    servingDescription: "1 plate",
  },
  {
    food: "Burrito with cheese & sour cream",
    category: "other",
    lactosePerServing: 4,
    servingDescription: "1 burrito",
  },
];

export function searchFoods(query: string): DairyEstimate[] {
  const lower = query.toLowerCase();
  return DAIRY_DATABASE.filter(
    (item) =>
      item.food.toLowerCase().includes(lower) ||
      item.category.toLowerCase().includes(lower)
  );
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    milk: "Milk & Milk Drinks",
    cheese_high: "Soft/Fresh Cheese",
    cheese_low: "Aged Cheese (low lactose)",
    yogurt: "Yogurt",
    ice_cream: "Ice Cream & Frozen",
    butter: "Butter",
    cream: "Cream & Creamers",
    baked: "Baked & Prepared Foods",
    other: "Other Dairy Foods",
  };
  return labels[category] || category;
}
