"use client";

import { useMemo } from "react";
import { TrendingUp, AlertTriangle, Award, BarChart3 } from "lucide-react";
import { getInsights } from "@/lib/recommendation";
import { getMeals, getSymptoms } from "@/lib/storage";

interface InsightsProps {
  refreshKey: number;
}

export default function Insights({ refreshKey }: InsightsProps) {
  const stats = useMemo(() => {
    const meals = getMeals();
    const symptoms = getSymptoms();
    return getInsights(meals, symptoms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (stats.totalMeals === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          Log some meals and symptoms to see your insights!
        </p>
        <p className="text-gray-400 text-xs mt-1">
          The more you log, the smarter the recommendations get.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Meals Logged</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalMeals}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Symptom-Free</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.symptomFreeMeals}
            <span className="text-sm font-normal text-gray-400">
              /{stats.totalMeals}
            </span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Avg Pills/Meal</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.avgPillsPerMeal.toFixed(1)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Avg Lactose/Meal</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.avgLactosePerMeal.toFixed(1)}g
          </p>
        </div>
      </div>

      {/* Personal Tolerance */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">
              Your Personal Tolerance
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Each Lactaid pill covers ~
              <span className="font-bold">
                {stats.personalRatio.toFixed(1)}g
              </span>{" "}
              of lactose for you.
            </p>
            <p className="text-xs text-blue-500 mt-1">
              (General population average: ~5g per pill)
            </p>
          </div>
        </div>
      </div>

      {/* Symptom Rate */}
      <div className={`rounded-xl border p-4 ${
        stats.symptomRate < 20
          ? "bg-green-50 border-green-200"
          : stats.symptomRate < 50
          ? "bg-yellow-50 border-yellow-200"
          : "bg-red-50 border-red-200"
      }`}>
        <div className="flex items-start gap-3">
          <Award className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            stats.symptomRate < 20
              ? "text-green-600"
              : stats.symptomRate < 50
              ? "text-yellow-600"
              : "text-red-600"
          }`} />
          <div>
            <h4 className={`text-sm font-semibold ${
              stats.symptomRate < 20
                ? "text-green-800"
                : stats.symptomRate < 50
                ? "text-yellow-800"
                : "text-red-800"
            }`}>
              Symptom Rate: {stats.symptomRate.toFixed(0)}%
            </h4>
            <p className={`text-xs mt-1 ${
              stats.symptomRate < 20
                ? "text-green-600"
                : stats.symptomRate < 50
                ? "text-yellow-600"
                : "text-red-600"
            }`}>
              {stats.symptomRate < 20
                ? "Great job! Your Lactaid dosing seems to be working well."
                : stats.symptomRate < 50
                ? "Getting there! Try adjusting your Lactaid amounts based on the recommendations."
                : "Consider increasing your Lactaid dose, especially for high-lactose meals."}
            </p>
          </div>
        </div>
      </div>

      {/* Worst Foods */}
      {stats.worstFoods.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h4 className="text-sm font-semibold text-gray-700">
              Foods That Cause You Trouble
            </h4>
          </div>
          <div className="space-y-2">
            {stats.worstFoods.map((food) => (
              <div
                key={food.name}
                className="flex justify-between items-center"
              >
                <span className="text-sm text-gray-700">{food.name}</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`w-3 h-3 rounded-full ${
                        food.avgSeverity >= level
                          ? level === 1
                            ? "bg-yellow-400"
                            : level === 2
                            ? "bg-orange-400"
                            : "bg-red-400"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
