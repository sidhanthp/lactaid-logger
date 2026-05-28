'use client';

import { useState } from 'react';
import { Clock, Trash2, MessageCircle, X } from 'lucide-react';
import { MealEntry, SymptomLevel } from '@/lib/types';
import { DAIRY_LEVEL_INFO } from '@/lib/dairy';
import { updateMeal, deleteMeal } from '@/lib/storage';

interface HistoryProps {
  meals: MealEntry[];
  onUpdate: () => void;
}

export default function History({ meals, onUpdate }: HistoryProps) {
  const [symptomModalId, setSymptomModalId] = useState<string | null>(null);
  const [symptomNotes, setSymptomNotes] = useState('');

  function handleSymptomSelect(mealId: string, symptom: SymptomLevel) {
    updateMeal(mealId, { symptoms: symptom, symptomNotes });
    setSymptomModalId(null);
    setSymptomNotes('');
    onUpdate();
  }

  function handleDelete(id: string) {
    deleteMeal(id);
    onUpdate();
  }

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatFullDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-xl font-bold text-gray-800">No meals logged yet</h2>
        <p className="text-gray-500 mt-2">Start by logging your first meal!</p>
      </div>
    );
  }

  const needsSymptoms = meals.filter(m => m.symptoms === null);
  const hasSymptoms = meals.filter(m => m.symptoms !== null);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800">History</h2>

      {needsSymptoms.length > 0 && (
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
            <MessageCircle className="w-4 h-4" /> Needs Symptom Update ({needsSymptoms.length})
          </h3>
          <div className="space-y-2">
            {needsSymptoms.map(meal => (
              <MealCard
                key={meal.id}
                meal={meal}
                formatTime={formatTime}
                formatFullDate={formatFullDate}
                onSymptomClick={() => setSymptomModalId(meal.id)}
                onDelete={() => handleDelete(meal.id)}
                highlight
              />
            ))}
          </div>
        </div>
      )}

      {hasSymptoms.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Completed</h3>
          <div className="space-y-2">
            {hasSymptoms.map(meal => (
              <MealCard
                key={meal.id}
                meal={meal}
                formatTime={formatTime}
                formatFullDate={formatFullDate}
                onSymptomClick={() => setSymptomModalId(meal.id)}
                onDelete={() => handleDelete(meal.id)}
              />
            ))}
          </div>
        </div>
      )}

      {symptomModalId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">How did you feel?</h3>
              <button
                onClick={() => { setSymptomModalId(null); setSymptomNotes(''); }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {SYMPTOM_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSymptomSelect(symptomModalId, opt.value)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-300 active:scale-95 transition-all"
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="text-sm font-medium" style={{ color: opt.color }}>{opt.label}</span>
                </button>
              ))}
            </div>

            <textarea
              placeholder="Any notes? (optional)"
              value={symptomNotes}
              onChange={e => setSymptomNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder:text-gray-400 text-sm resize-none"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MealCard({
  meal,
  formatTime,
  formatFullDate,
  onSymptomClick,
  onDelete,
  highlight,
}: {
  meal: MealEntry;
  formatTime: (t: number) => string;
  formatFullDate: (t: number) => string;
  onSymptomClick: () => void;
  onDelete: () => void;
  highlight?: boolean;
}) {
  const levelInfo = DAIRY_LEVEL_INFO[meal.dairyLevel];
  const symptomInfo = meal.symptoms
    ? SYMPTOM_OPTIONS.find(s => s.value === meal.symptoms)
    : null;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        highlight
          ? 'bg-amber-50/80 border-amber-200 hover:border-amber-300'
          : 'bg-white/60 border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-800 truncate">{meal.food}</h4>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: levelInfo.color + '20', color: levelInfo.color }}
            >
              {levelInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTime(meal.timestamp)}
            </span>
            <span>{meal.estimatedLactoseGrams}g lactose</span>
            <span>{meal.lactaidPills} pill{meal.lactaidPills !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">{formatFullDate(meal.timestamp)}</p>
        </div>

        <div className="flex items-center gap-1 ml-2">
          {meal.symptoms === null ? (
            <button
              onClick={onSymptomClick}
              className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium hover:bg-amber-200 active:scale-95 transition-all"
            >
              + Symptoms
            </button>
          ) : (
            <button
              onClick={onSymptomClick}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: symptomInfo!.color + '15', color: symptomInfo!.color }}
            >
              {symptomInfo!.emoji} {symptomInfo!.label}
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>
      {meal.symptomNotes && (
        <p className="text-xs text-gray-500 mt-2 italic">&quot;{meal.symptomNotes}&quot;</p>
      )}
    </div>
  );
}

const SYMPTOM_OPTIONS: { value: SymptomLevel; label: string; emoji: string; color: string }[] = [
  { value: 'none', label: 'No symptoms', emoji: '😊', color: '#10b981' },
  { value: 'mild', label: 'Mild', emoji: '😐', color: '#fbbf24' },
  { value: 'moderate', label: 'Moderate', emoji: '😣', color: '#f97316' },
  { value: 'severe', label: 'Severe', emoji: '😫', color: '#ef4444' },
];
