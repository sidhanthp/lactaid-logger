"use client";

import { useMemo, useState } from "react";
import { Heart, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import {
  SymptomEntry,
  SymptomSeverity,
  SymptomType,
  SYMPTOM_LABELS,
  SEVERITY_LABELS,
} from "@/lib/types";
import { getMeals, getSymptoms, saveSymptom } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

interface SymptomLoggerProps {
  onSymptomSaved: () => void;
}

export default function SymptomLogger({ onSymptomSaved }: SymptomLoggerProps) {
  const [selectedMealId, setSelectedMealId] = useState<string>("");
  const [severity, setSeverity] = useState<SymptomSeverity>("none");
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [nowMs] = useState(() => Date.now());

  const meals = useMemo(() => {
    const allMeals = getMeals().sort((a, b) => b.timestamp - a.timestamp);
    if (allMeals.length > 0 && !selectedMealId) {
      // Defer the state update to avoid setting state during render
      queueMicrotask(() => setSelectedMealId(allMeals[0].id));
    }
    return allMeals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  const existingSymptoms = useMemo(
    () => getSymptoms(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataVersion]
  );

  function toggleSymptom(type: SymptomType) {
    setSelectedSymptoms((prev) =>
      prev.includes(type) ? prev.filter((s) => s !== type) : [...prev, type]
    );
  }

  function getHoursAgo(timestamp: number): string {
    const hours = (nowMs - timestamp) / (1000 * 60 * 60);
    if (hours < 1) return "< 1 hour ago";
    if (hours < 24) return `${Math.round(hours)} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function hasSymptomLog(mealId: string): boolean {
    return existingSymptoms.some((s) => s.mealId === mealId);
  }

  function handleSave() {
    if (!selectedMealId) return;

    const meal = meals.find((m) => m.id === selectedMealId);
    if (!meal) return;

    const now = performance.timeOrigin + performance.now();
    const symptom: SymptomEntry = {
      id: uuidv4(),
      mealId: selectedMealId,
      timestamp: now,
      severity,
      symptoms: severity === "none" ? [] : selectedSymptoms,
      notes,
      hoursAfterMeal: (now - meal.timestamp) / (1000 * 60 * 60),
    };

    saveSymptom(symptom);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSeverity("none");
      setSelectedSymptoms([]);
      setNotes("");
      setDataVersion((v) => v + 1);
      onSymptomSaved();
    }, 1500);
  }

  if (meals.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          No meals logged yet. Log a meal first, then come back to track
          symptoms.
        </p>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-green-700 font-medium">Symptom log saved!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Select Meal */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          <Clock className="w-4 h-4 inline mr-1" />
          Which meal are you logging symptoms for?
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {meals.slice(0, 10).map((meal) => (
            <button
              key={meal.id}
              onClick={() => setSelectedMealId(meal.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                selectedMealId === meal.id
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {meal.foods.map((f) => f.name).join(", ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(meal.timestamp)} · {getHoursAgo(meal.timestamp)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs text-gray-500">
                    {meal.totalLactoseEstimate.toFixed(1)}g · {meal.lactaidPills}{" "}
                    pill{meal.lactaidPills !== 1 ? "s" : ""}
                  </p>
                  {hasSymptomLog(meal.id) && (
                    <span className="text-xs text-green-600 font-medium">
                      logged
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          How do you feel?
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(SEVERITY_LABELS) as [SymptomSeverity, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setSeverity(key)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  severity === key
                    ? key === "none"
                      ? "border-green-400 bg-green-50 text-green-700"
                      : key === "mild"
                      ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                      : key === "moderate"
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-red-400 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {key === "none" && "😊 "}
                {key === "mild" && "😐 "}
                {key === "moderate" && "😣 "}
                {key === "severe" && "😫 "}
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Symptom Types */}
      {severity !== "none" && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            What symptoms?
          </h3>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SYMPTOM_LABELS) as [SymptomType, string][]).map(
              ([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleSymptom(key)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedSymptoms.includes(key)
                      ? "bg-red-100 text-red-700 border border-red-300"
                      : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Notes (optional)
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="When did symptoms start, how long did they last..."
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none
            placeholder:text-gray-400"
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl
          hover:bg-blue-700 transition-colors shadow-sm"
      >
        Log Symptoms
      </button>
    </div>
  );
}
