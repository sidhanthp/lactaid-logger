"use client";

import { useState, useRef, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { DairyItem, CATEGORY_LABELS, FoodLogItem, DairyCategory } from "@/lib/types";
import { searchFoods, getFoodsByCategory } from "@/lib/dairy-database";
import { v4 as uuidv4 } from "uuid";

interface FoodSearchProps {
  onAddFood: (food: FoodLogItem) => void;
}

export default function FoodSearch({ onAddFood }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [showBrowse, setShowBrowse] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customLactose, setCustomLactose] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (query.length > 0) return searchFoods(query);
    return [];
  }, [query]);

  function handleSelect(item: DairyItem) {
    onAddFood({
      id: uuidv4(),
      name: item.name,
      servings: 1,
      lactosePerServing: item.lactosePerServing,
      isCustom: false,
    });
    setQuery("");
    inputRef.current?.focus();
  }

  function handleAddCustom() {
    if (!customName.trim() || !customLactose) return;
    onAddFood({
      id: uuidv4(),
      name: customName.trim(),
      servings: 1,
      lactosePerServing: parseFloat(customLactose) || 0,
      isCustom: true,
    });
    setCustomName("");
    setCustomLactose("");
    setShowCustom(false);
  }

  const grouped = getFoodsByCategory();

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search foods (e.g. pizza, latte, ice cream...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
            placeholder:text-gray-400"
        />
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {results.map((item) => (
            <button
              key={item.name}
              onClick={() => handleSelect(item)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.servingDescription}</p>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {item.lactosePerServing}g lactose
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length > 0 && results.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-2">
          No matches found.{" "}
          <button onClick={() => { setShowCustom(true); setQuery(""); }} className="text-blue-600 underline">
            Add custom food
          </button>
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setShowBrowse(!showBrowse)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showBrowse ? "Hide categories" : "Browse by category"}
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showCustom ? "Cancel" : "Add custom food"}
        </button>
      </div>

      {showCustom && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Food name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            placeholder="Estimated lactose (grams)"
            value={customLactose}
            onChange={(e) => setCustomLactose(e.target.value)}
            min="0"
            step="0.5"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleAddCustom}
            disabled={!customName.trim() || !customLactose}
            className="w-full py-2 bg-blue-500 text-white text-sm font-medium rounded-lg
              hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add Custom Food
          </button>
        </div>
      )}

      {showBrowse && (
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {(Object.entries(grouped) as [string, DairyItem[]][]).map(([cat, items]) => (
            <div key={cat}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                {CATEGORY_LABELS[cat as DairyCategory] || cat}
              </h4>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {items.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleSelect(item)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-900">{item.name}</span>
                      <span className="text-xs text-gray-500">{item.lactosePerServing}g</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
