"use client";

import { useMemo, useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Pill, Clock } from "lucide-react";
import { SymptomEntry, SEVERITY_LABELS, SYMPTOM_LABELS, SymptomSeverity, SymptomType } from "@/lib/types";
import { getMeals, getSymptoms, deleteMeal } from "@/lib/storage";

interface HistoryProps {
  refreshKey: number;
}

export default function History({ refreshKey }: HistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState(0);

  const meals = useMemo(
    () => getMeals().sort((a, b) => b.timestamp - a.timestamp),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey, deleteKey]
  );
  const symptoms = useMemo(
    () => getSymptoms(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey, deleteKey]
  );

  function getMealSymptoms(mealId: string): SymptomEntry[] {
    return symptoms.filter((s) => s.mealId === mealId);
  }

  function handleDelete(mealId: string) {
    deleteMeal(mealId);
    setDeleteKey((k) => k + 1);
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function severityColor(s: SymptomSeverity): string {
    switch (s) {
      case "none": return "text-green-600 bg-green-50";
      case "mild": return "text-yellow-600 bg-yellow-50";
      case "moderate": return "text-orange-600 bg-orange-50";
      case "severe": return "text-red-600 bg-red-50";
    }
  }

  if (meals.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No meals logged yet. Start by logging a meal!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => {
        const mealSymptoms = getMealSymptoms(meal.id);
        const isExpanded = expandedId === meal.id;

        return (
          <div
            key={meal.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : meal.id)}
              className="w-full px-4 py-3 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {meal.foods.map((f) => f.name).join(", ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(meal.timestamp)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-medium text-blue-600">
                      {meal.totalLactoseEstimate.toFixed(1)}g
                    </p>
                    <p className="text-xs text-gray-500">
                      <Pill className="w-3 h-3 inline" /> {meal.lactaidPills}
                    </p>
                  </div>
                  {mealSymptoms.length > 0 ? (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColor(
                        mealSymptoms.reduce(
                          (worst, s) => {
                            const order: SymptomSeverity[] = ["none", "mild", "moderate", "severe"];
                            return order.indexOf(s.severity) > order.indexOf(worst)
                              ? s.severity
                              : worst;
                          },
                          "none" as SymptomSeverity
                        )
                      )}`}
                    >
                      {SEVERITY_LABELS[
                        mealSymptoms.reduce(
                          (worst, s) => {
                            const order: SymptomSeverity[] = ["none", "mild", "moderate", "severe"];
                            return order.indexOf(s.severity) > order.indexOf(worst)
                              ? s.severity
                              : worst;
                          },
                          "none" as SymptomSeverity
                        )
                      ]}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                      No log
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-3 space-y-3 border-t border-gray-100">
                {/* Food breakdown */}
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Foods
                  </p>
                  {meal.foods.map((food) => (
                    <div
                      key={food.id}
                      className="flex justify-between text-sm py-1"
                    >
                      <span className="text-gray-700">
                        {food.name}{" "}
                        {food.servings !== 1 && (
                          <span className="text-gray-400">
                            x{food.servings}
                          </span>
                        )}
                      </span>
                      <span className="text-gray-500">
                        {(food.lactosePerServing * food.servings).toFixed(1)}g
                      </span>
                    </div>
                  ))}
                </div>

                {meal.notes && (
                  <p className="text-xs text-gray-500 italic">{meal.notes}</p>
                )}

                {/* Symptoms */}
                {mealSymptoms.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Symptoms
                    </p>
                    {mealSymptoms.map((s) => (
                      <div key={s.id} className="text-sm text-gray-700 py-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${severityColor(s.severity)}`}
                        >
                          {SEVERITY_LABELS[s.severity]}
                        </span>
                        {s.symptoms.map((st) => SYMPTOM_LABELS[st as SymptomType]).join(", ")}
                        {s.notes && (
                          <span className="text-gray-400 ml-2">
                            &mdash; {s.notes}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-2">
                          ({s.hoursAfterMeal.toFixed(1)}h after)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleDelete(meal.id)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete meal
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
