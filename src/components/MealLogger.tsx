"use client";

import React, { useState } from "react";
import { FoodItem, MealEntry } from "@/lib/types";
import { saveMeal, generateId } from "@/lib/storage";
import { getRecommendation } from "@/lib/recommendation";
import FoodSearch from "./FoodSearch";

interface MealLoggerProps {
  onMealSaved: () => void;
}

export default function MealLogger({ onMealSaved }: MealLoggerProps) {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [pills, setPills] = useState(0);
  const [notes, setNotes] = useState("");

  const totalDairy = foods.reduce((sum, f) => sum + f.dairyGrams, 0);
  const recommendation = totalDairy > 0 ? getRecommendation(totalDairy) : null;

  function addFood(food: FoodItem) {
    setFoods([...foods, food]);
  }

  function removeFood(index: number) {
    setFoods(foods.filter((_, i) => i !== index));
  }

  const handleSave = React.useCallback(() => {
    if (foods.length === 0) return;

    const now = Date.now();
    const meal: MealEntry = {
      id: generateId(),
      timestamp: now,
      foods,
      totalDairyGrams: totalDairy,
      lactaidPills: pills,
      notes,
    };

    saveMeal(meal);
    setFoods([]);
    setPills(0);
    setNotes("");
    onMealSaved();
  }, [foods, totalDairy, pills, notes, onMealSaved]);

  return (
    <div className="space-y-6">
      {/* Food Search */}
      <div>
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <span className="text-lg">🍕</span> What did you eat?
        </h3>
        <FoodSearch onAddFood={addFood} />
      </div>

      {/* Selected Foods */}
      {foods.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white/70 text-sm font-medium">Your meal:</h4>
          {foods.map((food, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2"
            >
              <div>
                <span className="text-white text-sm">{food.name}</span>
                <span className="text-white/50 text-xs ml-2">
                  {food.dairyGrams}g lactose
                </span>
              </div>
              <button
                onClick={() => removeFood(i)}
                className="text-red-400/70 hover:text-red-400 text-sm"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-white/70 text-sm">Total lactose:</span>
            <span className="text-white font-bold">
              {totalDairy.toFixed(1)}g
            </span>
          </div>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💊</span>
            <span className="text-white font-semibold">Recommendation</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                recommendation.confidence === "high"
                  ? "bg-green-500/30 text-green-300"
                  : recommendation.confidence === "medium"
                    ? "bg-yellow-500/30 text-yellow-300"
                    : "bg-white/20 text-white/60"
              }`}
            >
              {recommendation.confidence} confidence
            </span>
          </div>
          <p className="text-white text-2xl font-bold">
            {recommendation.recommendedPills} pill
            {recommendation.recommendedPills !== 1 ? "s" : ""}
          </p>
          <p className="text-white/60 text-sm mt-1">
            {recommendation.message}
          </p>
        </div>
      )}

      {/* Lactaid Pills Taken */}
      <div>
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <span className="text-lg">💊</span> Lactaid pills taken
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPills(Math.max(0, pills - 1))}
            className="w-10 h-10 rounded-full bg-white/10 text-white text-xl hover:bg-white/20 transition-colors"
          >
            −
          </button>
          <span className="text-white text-3xl font-bold w-12 text-center">
            {pills}
          </span>
          <button
            onClick={() => setPills(pills + 1)}
            className="w-10 h-10 rounded-full bg-white/10 text-white text-xl hover:bg-white/20 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <span className="text-lg">📝</span> Notes (optional)
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about this meal..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={foods.length === 0}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
      >
        Log Meal
      </button>
    </div>
  );
}
