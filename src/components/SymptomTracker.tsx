"use client";

import { useState } from "react";
import { MealEntry, SymptomEntry, SymptomType } from "@/lib/types";
import { saveSymptom, generateId, getSymptomForMeal } from "@/lib/storage";

interface SymptomTrackerProps {
  meal: MealEntry;
  onSaved: () => void;
}

const SYMPTOM_OPTIONS: { type: SymptomType; label: string; emoji: string }[] = [
  { type: "bloating", label: "Bloating", emoji: "🫧" },
  { type: "gas", label: "Gas", emoji: "💨" },
  { type: "cramps", label: "Cramps", emoji: "😣" },
  { type: "diarrhea", label: "Diarrhea", emoji: "🚽" },
  { type: "nausea", label: "Nausea", emoji: "🤢" },
  { type: "other", label: "Other", emoji: "❓" },
];

export default function SymptomTracker({ meal, onSaved }: SymptomTrackerProps) {
  const existing = getSymptomForMeal(meal.id);
  const [hadSymptoms, setHadSymptoms] = useState<boolean | null>(
    existing ? existing.hadSymptoms : null
  );
  const [severity, setSeverity] = useState<0 | 1 | 2 | 3>(
    existing?.severity ?? 0
  );
  const [symptomTypes, setSymptomTypes] = useState<SymptomType[]>(
    existing?.symptomTypes ?? []
  );
  const [hoursAfter, setHoursAfter] = useState(
    existing?.hoursAfterMeal?.toString() ?? "2"
  );

  function toggleSymptom(type: SymptomType) {
    setSymptomTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function handleSave() {
    if (hadSymptoms === null) return;

    const symptom: SymptomEntry = {
      id: existing?.id ?? generateId(),
      mealId: meal.id,
      timestamp: Date.now(),
      hadSymptoms,
      severity: hadSymptoms ? severity : 0,
      symptomTypes: hadSymptoms ? symptomTypes : [],
      hoursAfterMeal: parseFloat(hoursAfter) || 2,
    };

    saveSymptom(symptom);
    onSaved();
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium text-sm">
            {meal.foods.map((f) => f.name).join(", ")}
          </p>
          <p className="text-white/50 text-xs">
            {meal.totalDairyGrams.toFixed(1)}g lactose · {meal.lactaidPills} pill
            {meal.lactaidPills !== 1 ? "s" : ""} ·{" "}
            {new Date(meal.timestamp).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Had symptoms? */}
      <div>
        <p className="text-white/70 text-sm mb-2">Did you have symptoms?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setHadSymptoms(false);
              setSeverity(0);
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              hadSymptoms === false
                ? "bg-green-500/30 border border-green-400/50 text-green-300"
                : "bg-white/10 border border-white/20 text-white/60 hover:bg-white/15"
            }`}
          >
            No symptoms ✓
          </button>
          <button
            onClick={() => {
              setHadSymptoms(true);
              if (severity === 0) setSeverity(1);
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              hadSymptoms === true
                ? "bg-red-500/30 border border-red-400/50 text-red-300"
                : "bg-white/10 border border-white/20 text-white/60 hover:bg-white/15"
            }`}
          >
            Had symptoms
          </button>
        </div>
      </div>

      {/* Symptom details */}
      {hadSymptoms && (
        <>
          <div>
            <p className="text-white/70 text-sm mb-2">Severity:</p>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSeverity(level)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    severity === level
                      ? level === 1
                        ? "bg-yellow-500/30 border border-yellow-400/50 text-yellow-300"
                        : level === 2
                          ? "bg-orange-500/30 border border-orange-400/50 text-orange-300"
                          : "bg-red-500/30 border border-red-400/50 text-red-300"
                      : "bg-white/10 border border-white/20 text-white/60 hover:bg-white/15"
                  }`}
                >
                  {level === 1 ? "Mild" : level === 2 ? "Moderate" : "Severe"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white/70 text-sm mb-2">What symptoms?</p>
            <div className="grid grid-cols-3 gap-2">
              {SYMPTOM_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => toggleSymptom(opt.type)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                    symptomTypes.includes(opt.type)
                      ? "bg-purple-500/30 border border-purple-400/50 text-purple-300"
                      : "bg-white/10 border border-white/20 text-white/60 hover:bg-white/15"
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white/70 text-sm mb-2">
              Hours after eating:
            </p>
            <input
              type="number"
              value={hoursAfter}
              onChange={(e) => setHoursAfter(e.target.value)}
              min="0"
              max="48"
              step="0.5"
              className="w-24 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>
        </>
      )}

      <button
        onClick={handleSave}
        disabled={hadSymptoms === null}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold hover:from-green-600 hover:to-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {existing ? "Update" : "Save"} Symptom Log
      </button>
    </div>
  );
}
