import { DairyItem } from "./types";

/**
 * Database of common dairy-containing foods with estimated lactose per serving.
 * Lactose values are approximate grams per typical serving.
 * Source: USDA / general nutrition references.
 */
export const DAIRY_DATABASE: DairyItem[] = [
  // Milk & Drinks
  { name: "Whole Milk (1 cup)", category: "milk", lactosePerServing: 12, servingDescription: "1 cup (240ml)" },
  { name: "Skim Milk (1 cup)", category: "milk", lactosePerServing: 13, servingDescription: "1 cup (240ml)" },
  { name: "2% Milk (1 cup)", category: "milk", lactosePerServing: 12, servingDescription: "1 cup (240ml)" },
  { name: "Chocolate Milk (1 cup)", category: "milk", lactosePerServing: 10, servingDescription: "1 cup (240ml)" },
  { name: "Hot Chocolate", category: "milk", lactosePerServing: 8, servingDescription: "1 cup" },
  { name: "Latte / Cappuccino", category: "milk", lactosePerServing: 9, servingDescription: "12 oz" },
  { name: "Milk in Coffee/Tea", category: "milk", lactosePerServing: 3, servingDescription: "2 tbsp" },

  // Cheese
  { name: "Cheddar Cheese", category: "cheese", lactosePerServing: 0.5, servingDescription: "1 oz (28g)" },
  { name: "Mozzarella Cheese", category: "cheese", lactosePerServing: 0.7, servingDescription: "1 oz (28g)" },
  { name: "Swiss Cheese", category: "cheese", lactosePerServing: 0.4, servingDescription: "1 oz (28g)" },
  { name: "Parmesan Cheese", category: "cheese", lactosePerServing: 0.2, servingDescription: "1 tbsp grated" },
  { name: "Cream Cheese", category: "cheese", lactosePerServing: 1.5, servingDescription: "1 oz (28g)" },
  { name: "Cottage Cheese", category: "cheese", lactosePerServing: 3, servingDescription: "1/2 cup" },
  { name: "Ricotta Cheese", category: "cheese", lactosePerServing: 3.5, servingDescription: "1/4 cup" },
  { name: "American Cheese", category: "cheese", lactosePerServing: 1.5, servingDescription: "1 slice" },
  { name: "Brie / Camembert", category: "cheese", lactosePerServing: 0.5, servingDescription: "1 oz (28g)" },
  { name: "Feta Cheese", category: "cheese", lactosePerServing: 1, servingDescription: "1 oz (28g)" },
  { name: "Grilled Cheese Sandwich", category: "cheese", lactosePerServing: 3, servingDescription: "1 sandwich" },
  { name: "Mac and Cheese", category: "cheese", lactosePerServing: 8, servingDescription: "1 cup" },
  { name: "Cheese Pizza (1 slice)", category: "cheese", lactosePerServing: 4, servingDescription: "1 large slice" },
  { name: "Quesadilla", category: "cheese", lactosePerServing: 5, servingDescription: "1 quesadilla" },
  { name: "Nachos with Cheese", category: "cheese", lactosePerServing: 5, servingDescription: "1 plate" },
  { name: "Cheeseburger", category: "cheese", lactosePerServing: 3, servingDescription: "1 burger" },

  // Yogurt
  { name: "Regular Yogurt", category: "yogurt", lactosePerServing: 5, servingDescription: "6 oz container" },
  { name: "Greek Yogurt", category: "yogurt", lactosePerServing: 4, servingDescription: "6 oz container" },
  { name: "Frozen Yogurt", category: "yogurt", lactosePerServing: 6, servingDescription: "1/2 cup" },

  // Ice Cream & Frozen
  { name: "Ice Cream", category: "ice_cream", lactosePerServing: 6, servingDescription: "1/2 cup" },
  { name: "Ice Cream Sundae", category: "ice_cream", lactosePerServing: 10, servingDescription: "1 sundae" },
  { name: "Milkshake", category: "ice_cream", lactosePerServing: 15, servingDescription: "16 oz" },
  { name: "Ice Cream Cone", category: "ice_cream", lactosePerServing: 8, servingDescription: "1 cone (2 scoops)" },
  { name: "Ice Cream Sandwich", category: "ice_cream", lactosePerServing: 4, servingDescription: "1 sandwich" },

  // Butter & Spreads
  { name: "Butter (1 tbsp)", category: "butter", lactosePerServing: 0.1, servingDescription: "1 tbsp" },
  { name: "Whipped Butter", category: "butter", lactosePerServing: 0.1, servingDescription: "1 tbsp" },

  // Cream & Sauces
  { name: "Heavy Cream", category: "cream", lactosePerServing: 0.5, servingDescription: "1 tbsp" },
  { name: "Whipped Cream", category: "cream", lactosePerServing: 0.4, servingDescription: "2 tbsp" },
  { name: "Sour Cream", category: "cream", lactosePerServing: 0.5, servingDescription: "2 tbsp" },
  { name: "Alfredo Sauce", category: "cream", lactosePerServing: 6, servingDescription: "1/2 cup" },
  { name: "Cream of Mushroom Soup", category: "cream", lactosePerServing: 4, servingDescription: "1 cup" },
  { name: "Clam Chowder", category: "cream", lactosePerServing: 5, servingDescription: "1 cup" },
  { name: "Creamy Pasta", category: "cream", lactosePerServing: 7, servingDescription: "1 plate" },
  { name: "Ranch Dressing", category: "cream", lactosePerServing: 1, servingDescription: "2 tbsp" },

  // Baked Goods
  { name: "Pancakes / Waffles", category: "baked", lactosePerServing: 4, servingDescription: "2 pancakes" },
  { name: "Muffin", category: "baked", lactosePerServing: 2, servingDescription: "1 muffin" },
  { name: "Croissant", category: "baked", lactosePerServing: 3, servingDescription: "1 croissant" },
  { name: "Cake (slice)", category: "baked", lactosePerServing: 4, servingDescription: "1 slice" },
  { name: "Cheesecake", category: "baked", lactosePerServing: 8, servingDescription: "1 slice" },
  { name: "Cookie", category: "baked", lactosePerServing: 1, servingDescription: "1 large cookie" },
  { name: "Chocolate Brownie", category: "baked", lactosePerServing: 2, servingDescription: "1 brownie" },
  { name: "Donut (glazed)", category: "baked", lactosePerServing: 2, servingDescription: "1 donut" },

  // Other / Mixed
  { name: "Protein Shake (whey)", category: "other", lactosePerServing: 3, servingDescription: "1 scoop in water" },
  { name: "Butter Chicken / Tikka Masala", category: "other", lactosePerServing: 5, servingDescription: "1 serving" },
  { name: "Fettuccine Alfredo", category: "other", lactosePerServing: 10, servingDescription: "1 plate" },
  { name: "Lasagna", category: "other", lactosePerServing: 8, servingDescription: "1 piece" },
  { name: "Cream-based Curry", category: "other", lactosePerServing: 5, servingDescription: "1 serving" },
  { name: "Chocolate Bar (milk)", category: "other", lactosePerServing: 3, servingDescription: "1 bar" },
];

export function searchFoods(query: string): DairyItem[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  const terms = lower.split(/\s+/).filter(Boolean);
  return DAIRY_DATABASE.filter((item) =>
    terms.every(
      (term) =>
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
    )
  ).slice(0, 10);
}

export function getFoodsByCategory(): Record<string, DairyItem[]> {
  const grouped: Record<string, DairyItem[]> = {};
  for (const item of DAIRY_DATABASE) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  return grouped;
}
