"use client";

import { useState } from "react";
import { FoodItem, DairyEstimate } from "@/lib/types";
import { searchFoods, DAIRY_DATABASE, getCategoryLabel } from "@/lib/dairy-database";

interface FoodSearchProps {
  onAddFood: (food: FoodItem) => void;
}

export default function FoodSearch({ onAddFood }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DairyEstimate[]>([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDairy, setCustomDairy] = useState("");

  function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length > 0) {
      setResults(searchFoods(value));
      setShowBrowser(false);
    } else {
      setResults([]);
    }
  }

  function selectFood(item: DairyEstimate) {
    onAddFood({
      name: item.food,
      dairyGrams: item.lactosePerServing,
    });
    setQuery("");
    setResults([]);
  }

  function addCustomFood() {
    if (!customName.trim()) return;
    onAddFood({
      name: customName.trim(),
      dairyGrams: parseFloat(customDairy) || 0,
    });
    setCustomName("");
    setCustomDairy("");
  }

  // Group database by category for browsing
  const grouped = DAIRY_DATABASE.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, DairyEstimate[]>
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search foods (e.g. pizza, latte, ice cream...)"
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-slate-800 rounded-xl border border-white/20 shadow-xl max-h-60 overflow-y-auto">
            {results.map((item, i) => (
              <button
                key={i}
                onClick={() => selectFood(item)}
                className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/10 last:border-0 transition-colors"
              >
                <div className="text-white font-medium">{item.food}</div>
                <div className="text-white/60 text-sm">
                  ~{item.lactosePerServing}g lactose · {item.servingDescription}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowBrowser(!showBrowser)}
          className="text-sm px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
        >
          {showBrowser ? "Hide" : "Browse"} all foods
        </button>
      </div>

      {showBrowser && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-3 max-h-64 overflow-y-auto space-y-4">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">
                {getCategoryLabel(category)}
              </h4>
              <div className="space-y-1">
                {items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => selectFood(item)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="text-white text-sm">{item.food}</span>
                    <span className="text-white/50 text-xs ml-2">
                      {item.lactosePerServing}g
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom food entry */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-3">
        <p className="text-white/60 text-xs mb-2">
          Can&apos;t find your food? Add it manually:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Food name"
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
          <input
            type="number"
            value={customDairy}
            onChange={(e) => setCustomDairy(e.target.value)}
            placeholder="Lactose (g)"
            className="w-24 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
          <button
            onClick={addCustomFood}
            disabled={!customName.trim()}
            className="px-3 py-2 rounded-lg bg-blue-500/80 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
