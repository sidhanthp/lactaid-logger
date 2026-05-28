'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronRight, ChevronLeft, Minus, Plus, Check, Pill, Zap } from 'lucide-react';
import { DairyLevel, MealEntry } from '@/lib/types';
import { DAIRY_FOODS, DAIRY_LEVEL_INFO, searchFoods, estimateDairyLevel } from '@/lib/dairy';
import { createMeal } from '@/lib/storage';

interface LogMealProps {
  meals: MealEntry[];
  onMealSaved: () => void;
  onMealLogged: () => void;
}

type Step = 'food' | 'dairy' | 'lactaid' | 'done';

export default function LogMeal({ meals, onMealSaved, onMealLogged }: LogMealProps) {
  const [step, setStep] = useState<Step>('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍽');
  const [lactoseGrams, setLactoseGrams] = useState(0);
  const [dairyLevel, setDairyLevel] = useState<DairyLevel>('none');
  const [lactaidPills, setLactaidPills] = useState(0);
  const [customFood, setCustomFood] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const frequentFoods = useMemo(() => {
    const counts: Record<string, { count: number; lastPills: number; food: string }> = {};
    meals.forEach(m => {
      if (!counts[m.food]) counts[m.food] = { count: 0, lastPills: m.lactaidPills, food: m.food };
      counts[m.food].count++;
      counts[m.food].lastPills = m.lactaidPills;
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [meals]);

  const filteredFoods = useMemo(() => searchFoods(searchQuery), [searchQuery]);

  const categories = useMemo(() => {
    const cats: Record<string, typeof DAIRY_FOODS> = {};
    filteredFoods.forEach(f => {
      if (!cats[f.category]) cats[f.category] = [];
      cats[f.category].push(f);
    });
    return cats;
  }, [filteredFoods]);

  function selectFood(name: string, lactose: number, emoji: string, level: DairyLevel) {
    setSelectedFood(name);
    setSelectedEmoji(emoji);
    setLactoseGrams(lactose);
    setDairyLevel(level);
    setStep('dairy');
  }

  function handleQuickLog(food: string, lastPills: number) {
    const known = DAIRY_FOODS.find(f => f.name === food);
    if (known) {
      selectFood(known.name, known.lactoseGrams, known.emoji, known.dairyLevel);
    } else {
      setSelectedFood(food);
      setSelectedEmoji('🍽');
      setLactoseGrams(3);
      setDairyLevel('medium');
      setStep('dairy');
    }
    setLactaidPills(lastPills);
  }

  function handleCustomFood() {
    if (!customFood.trim()) return;
    setSelectedFood(customFood.trim());
    setSelectedEmoji('🍽');
    setLactoseGrams(3);
    setDairyLevel('medium');
    setStep('dairy');
  }

  async function handleSave() {
    await createMeal({
      food: selectedFood,
      dairyLevel,
      estimatedLactoseGrams: lactoseGrams,
      lactaidPills,
    });
    onMealSaved();
    setStep('done');
    timeoutRef.current = setTimeout(() => {
      onMealLogged();
      resetForm();
    }, 1500);
  }

  function resetForm() {
    setStep('food');
    setSearchQuery('');
    setSelectedFood('');
    setSelectedEmoji('🍽');
    setLactoseGrams(0);
    setDairyLevel('none');
    setLactaidPills(0);
    setCustomFood('');
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="text-6xl mb-4 animate-bounce-in">✅</div>
        <h2 className="text-2xl font-bold text-gray-800">Meal Logged!</h2>
        <p className="text-gray-500 mt-2">Don&apos;t forget to log symptoms later</p>
      </div>
    );
  }

  if (step === 'food') {
    return (
      <div className="flex flex-col gap-4 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800">What did you eat?</h2>

        {frequentFoods.length > 0 && !searchQuery && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Log</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {frequentFoods.map(f => {
                const known = DAIRY_FOODS.find(d => d.name === f.food);
                return (
                  <button
                    key={f.food}
                    onClick={() => handleQuickLog(f.food, f.lastPills)}
                    className="flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 hover:border-amber-300 transition-all active:scale-[0.97] text-left"
                  >
                    <span className="text-lg">{known?.emoji ?? '🍽'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{f.food}</p>
                      <p className="text-[10px] text-gray-500">{f.lastPills} pill{f.lastPills !== 1 ? 's' : ''} last time</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/70 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800 placeholder:text-gray-400"
          />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Or type a custom food..."
            value={customFood}
            onChange={e => setCustomFood(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustomFood()}
            className="flex-1 px-4 py-3 rounded-2xl bg-white/70 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder:text-gray-400"
          />
          <button
            onClick={handleCustomFood}
            disabled={!customFood.trim()}
            className="px-4 py-3 rounded-2xl bg-blue-500 text-white font-medium disabled:opacity-40 hover:bg-blue-600 active:scale-95 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pb-4">
          {Object.entries(categories).map(([category, foods]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">{category}</h3>
              <div className="grid grid-cols-1 gap-2">
                {foods.map(food => (
                  <button
                    key={food.name}
                    onClick={() => selectFood(food.name, food.lactoseGrams, food.emoji, food.dairyLevel)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 hover:bg-white/90 border border-gray-100 hover:border-gray-200 transition-all active:scale-[0.98] text-left"
                  >
                    <span className="text-2xl">{food.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{food.name}</p>
                      <p className="text-xs text-gray-500">{food.lactoseGrams}g lactose</p>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: DAIRY_LEVEL_INFO[food.dairyLevel].color + '20', color: DAIRY_LEVEL_INFO[food.dairyLevel].color }}
                    >
                      {DAIRY_LEVEL_INFO[food.dairyLevel].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'dairy') {
    const levelInfo = DAIRY_LEVEL_INFO[dairyLevel];
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <button onClick={() => setStep('food')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 w-fit">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center">
          <span className="text-5xl">{selectedEmoji}</span>
          <h2 className="text-xl font-bold text-gray-800 mt-3">{selectedFood}</h2>
        </div>

        <div className="bg-white/60 rounded-3xl p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Estimated Dairy Content</h3>

          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold text-gray-800">{lactoseGrams}g</span>
            <span
              className="text-sm font-semibold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: levelInfo.color + '20', color: levelInfo.color }}
            >
              {levelInfo.emoji} {levelInfo.label}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-4">{levelInfo.description}</p>

          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={lactoseGrams}
            onChange={e => {
              const val = parseFloat(e.target.value);
              setLactoseGrams(val);
              setDairyLevel(estimateDairyLevel(val));
            }}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0g</span>
            <span>20g</span>
          </div>
        </div>

        <button
          onClick={() => setStep('lactaid')}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Next <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (step === 'lactaid') {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <button onClick={() => setStep('dairy')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 w-fit">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
            <Pill className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">How many Lactaid pills?</h2>
          <p className="text-gray-500 mt-1 text-sm">
            For <span className="font-medium">{selectedFood}</span> ({lactoseGrams}g lactose)
          </p>
        </div>

        <div className="bg-white/60 rounded-3xl p-8 border border-gray-100">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setLactaidPills(Math.max(0, lactaidPills - 1))}
              className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center active:scale-90 transition-all"
            >
              <Minus className="w-6 h-6 text-gray-600" />
            </button>
            <div className="text-center">
              <span className="text-6xl font-bold text-gray-800">{lactaidPills}</span>
              <p className="text-sm text-gray-500 mt-1">pill{lactaidPills !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setLactaidPills(lactaidPills + 1)}
              className="w-14 h-14 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center active:scale-90 transition-all"
            >
              <Plus className="w-6 h-6 text-blue-600" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setLactaidPills(n)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                  lactaidPills === n
                    ? 'bg-blue-500 text-white scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold text-lg hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" /> Save Meal
        </button>
      </div>
    );
  }

  return null;
}
