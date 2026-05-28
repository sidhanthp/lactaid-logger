"use client";

import { useState } from "react";
import { MealEntry } from "@/lib/types";
import { getMeals, deleteMeal, getSymptomForMeal } from "@/lib/storage";
import SymptomTracker from "./SymptomTracker";

interface HistoryProps {
  refreshKey: number;
  onUpdate: () => void;
}

export default function History({ refreshKey, onUpdate }: HistoryProps) {
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const meals = getMeals().sort((a, b) => b.timestamp - a.timestamp);

  // Force re-render when refreshKey changes
  void refreshKey;

  if (meals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40 text-lg">No meals logged yet</p>
        <p className="text-white/30 text-sm mt-1">
          Start by logging what you ate!
        </p>
      </div>
    );
  }

  function handleDelete(id: string) {
    if (confirm("Delete this meal entry?")) {
      deleteMeal(id);
      onUpdate();
    }
  }

  function getStatusBadge(meal: MealEntry) {
    const symptom = getSymptomForMeal(meal.id);
    if (!symptom) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
          Needs follow-up
        </span>
      );
    }
    if (!symptom.hadSymptoms) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">
          No symptoms
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
        {symptom.severity === 1
          ? "Mild"
          : symptom.severity === 2
            ? "Moderate"
            : "Severe"}{" "}
        symptoms
      </span>
    );
  }

  // Group meals by date
  const groupedByDate = meals.reduce(
    (acc, meal) => {
      const dateKey = new Date(meal.timestamp).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(meal);
      return acc;
    },
    {} as Record<string, MealEntry[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, dateMeals]) => (
        <div key={date}>
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">
            {date}
          </h3>
          <div className="space-y-3">
            {dateMeals.map((meal) => (
              <div key={meal.id} className="space-y-2">
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">
                          {meal.foods.map((f) => f.name).join(", ")}
                        </span>
                        {getStatusBadge(meal)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-white/50 text-xs">
                        <span>
                          {new Date(meal.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>{meal.totalDairyGrams.toFixed(1)}g lactose</span>
                        <span>
                          {meal.lactaidPills} pill
                          {meal.lactaidPills !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {meal.notes && (
                        <p className="text-white/40 text-xs mt-1 italic">
                          {meal.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          setExpandedMeal(
                            expandedMeal === meal.id ? null : meal.id
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white text-xs transition-colors"
                        title="Log symptoms"
                      >
                        {getSymptomForMeal(meal.id)
                          ? "Edit"
                          : "Log symptoms"}
                      </button>
                      <button
                        onClick={() => handleDelete(meal.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 text-xs transition-colors"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                {expandedMeal === meal.id && (
                  <SymptomTracker
                    meal={meal}
                    onSaved={() => {
                      setExpandedMeal(null);
                      onUpdate();
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
