"use client";

import { useMemo, useState } from "react";
import { Pill, Trash2, Minus, Plus, Sparkles } from "lucide-react";
import { FoodLogItem, MealEntry } from "@/lib/types";
import { getRecommendation } from "@/lib/recommendation";
import { getMeals, getSymptoms, saveMeal } from "@/lib/storage";
import FoodSearch from "./FoodSearch";
import { v4 as uuidv4 } from "uuid";

interface MealLoggerProps {
  onMealSaved: () => void;
}

export default function MealLogger({ onMealSaved }: MealLoggerProps) {
  const [foods, setFoods] = useState<FoodLogItem[]>([]);
  const [pills, setPills] = useState(0);
  const [notes, setNotes] = useState("");

  const totalLactose = foods.reduce(
    (sum, f) => sum + f.lactosePerServing * f.servings,
    0
  );

  const recommendation = useMemo(() => {
    if (totalLactose <= 0) return null;
    return getRecommendation(totalLactose, getMeals(), getSymptoms());
  }, [totalLactose]);

  function handleAddFood(food: FoodLogItem) {
    setFoods((prev) => [...prev, food]);
  }

  function handleRemoveFood(id: string) {
    setFoods((prev) => prev.filter((f) => f.id !== id));
  }

  function handleServingsChange(id: string, delta: number) {
    setFoods((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, servings: Math.max(0.5, f.servings + delta) }
          : f
      )
    );
  }

  function handleSave() {
    if (foods.length === 0) return;

    const now = performance.timeOrigin + performance.now();
    const meal: MealEntry = {
      id: uuidv4(),
      timestamp: now,
      foods,
      totalLactoseEstimate: totalLactose,
      lactaidPills: pills,
      notes,
    };

    saveMeal(meal);
    setFoods([]);
    setPills(0);
    setNotes("");
    onMealSaved();
  }

  return (
    <div className="space-y-6">
      {/* Food Search */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          What did you eat?
        </h3>
        <FoodSearch onAddFood={handleAddFood} />
      </div>

      {/* Selected Foods */}
      {foods.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Your meal</h3>
          {foods.map((food) => (
            <div
              key={food.id}
              className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {food.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(food.lactosePerServing * food.servings).toFixed(1)}g lactose
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => handleServingsChange(food.id, -0.5)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-medium w-8 text-center">
                  {food.servings}
                </span>
                <button
                  onClick={() => handleServingsChange(food.id, 0.5)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleRemoveFood(food.id)}
                  className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors ml-1"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            </div>
          ))}

          {/* Total Lactose */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">
                Estimated Total Lactose
              </span>
              <span className="text-lg font-bold text-blue-700">
                {totalLactose.toFixed(1)}g
              </span>
            </div>
          </div>

          {/* AI Recommendation */}
          {recommendation && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl px-4 py-3 border border-purple-100">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-purple-800">
                      Suggested: {recommendation.recommendedPills} pill
                      {recommendation.recommendedPills !== 1 ? "s" : ""}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        recommendation.confidence === "high"
                          ? "bg-green-100 text-green-700"
                          : recommendation.confidence === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {recommendation.confidence} confidence
                    </span>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    {recommendation.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lactaid Pills */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          <Pill className="w-4 h-4 inline mr-1" />
          How many Lactaid pills did you take?
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPills(Math.max(0, pills - 1))}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-lg font-medium"
          >
            -
          </button>
          <span className="text-2xl font-bold text-gray-900 w-12 text-center">
            {pills}
          </span>
          <button
            onClick={() => setPills(pills + 1)}
            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors text-lg font-medium text-blue-700"
          >
            +
          </button>
          <span className="text-sm text-gray-500">pills</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Notes (optional)
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any extra details about this meal..."
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none
            placeholder:text-gray-400"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={foods.length === 0}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl
          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors shadow-sm"
      >
        Log Meal
      </button>
    </div>
  );
}
