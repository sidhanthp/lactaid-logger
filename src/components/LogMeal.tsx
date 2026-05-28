'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronRight, ChevronLeft, Minus, Plus, Check, Pill, Zap, Sparkles, Loader2, Camera, X } from 'lucide-react';
import { DairyLevel, MealEntry } from '@/lib/types';
import { DAIRY_FOODS, DAIRY_LEVEL_INFO, searchFoods, estimateDairyLevel } from '@/lib/dairy';
import { createMeal } from '@/lib/storage';

interface AiParsedMeal {
  food: string;
  dairyLevel: DairyLevel;
  estimatedLactoseGrams: number;
}

interface PhotoAnalysisResult {
  items: { food: string; dairyLevel: string; estimatedLactoseGrams: number; hasDairy: boolean }[];
  totalLactoseGrams: number;
  recommendedPills: number;
  summary: string;
}

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
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AiParsedMeal[] | null>(null);
  const [aiError, setAiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoResult, setPhotoResult] = useState<PhotoAnalysisResult | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (isSaving) return;
    setIsSaving(true);
    setSaveError('');
    try {
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
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save meal');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAiParse() {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiResults(null);
    try {
      const res = await fetch('/api/parse-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (!data.meals?.length) throw new Error('No foods found');
      setAiResults(data.meals);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to parse');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAiSave(meal: AiParsedMeal) {
    setSelectedFood(meal.food);
    setLactoseGrams(meal.estimatedLactoseGrams);
    setDairyLevel(meal.dairyLevel);
    const known = DAIRY_FOODS.find(f => f.name === meal.food);
    setSelectedEmoji(known?.emoji ?? '🍽');
    setAiResults(null);
    setAiInput('');
    setStep('lactaid');
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    setPhotoError('');
    setPhotoResult(null);
    setPhotoPreview(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('meals', JSON.stringify(meals));
      const res = await fetch('/api/analyze-photo', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPhotoResult(data);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to analyze photo');
    } finally {
      setPhotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handlePhotoItemSelect(item: PhotoAnalysisResult['items'][0]) {
    setSelectedFood(item.food);
    setLactoseGrams(item.estimatedLactoseGrams);
    setDairyLevel(item.dairyLevel as DairyLevel);
    const known = DAIRY_FOODS.find(f => f.name === item.food);
    setSelectedEmoji(known?.emoji ?? '🍽');
    setPhotoResult(null);
    setPhotoPreview(null);
    setStep('lactaid');
  }

  function dismissPhoto() {
    setPhotoResult(null);
    setPhotoPreview(null);
    setPhotoError('');
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
    setAiInput('');
    setAiResults(null);
    setAiError('');
    setPhotoResult(null);
    setPhotoPreview(null);
    setPhotoError('');
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

        {/* Photo Analysis Result Overlay */}
        {(photoPreview || photoResult) && (
          <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl p-3 border border-sky-200/60">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Photo Analysis</span>
              </div>
              <button onClick={dismissPhoto} className="p-1 rounded-full hover:bg-sky-100 transition-colors">
                <X className="w-3.5 h-3.5 text-sky-400" />
              </button>
            </div>
            {photoPreview && (
              <div className="rounded-xl overflow-hidden mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Meal" className="w-full h-32 object-cover" />
              </div>
            )}
            {photoLoading && (
              <div className="flex items-center gap-2 p-3">
                <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                <span className="text-sm text-sky-600">Analyzing your meal...</span>
              </div>
            )}
            {photoError && <p className="text-xs text-red-500 px-1">{photoError}</p>}
            {photoResult && (
              <div>
                <p className="text-xs text-gray-600 px-1 mb-2">{photoResult.summary}</p>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-xs font-medium text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                    {photoResult.totalLactoseGrams}g total lactose
                  </span>
                  <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {photoResult.recommendedPills} pill{photoResult.recommendedPills !== 1 ? 's' : ''} recommended
                  </span>
                </div>
                <div className="space-y-1.5">
                  {photoResult.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handlePhotoItemSelect(item)}
                      className="flex items-center justify-between w-full p-2.5 rounded-xl bg-white/80 border border-sky-100 hover:border-sky-300 transition-all active:scale-[0.98] text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{item.food}</p>
                        <p className="text-[10px] text-gray-500">
                          {item.estimatedLactoseGrams}g lactose · {item.hasDairy ? DAIRY_LEVEL_INFO[item.dairyLevel as DairyLevel]?.label ?? item.dairyLevel : 'Dairy free'}
                        </p>
                      </div>
                      {item.hasDairy && <span className="text-xs text-sky-500 font-medium">+ Log</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Input + Camera */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-3 border border-violet-200/60">
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">AI Input</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder='"latte and pizza for lunch"'
              value={aiInput}
              onChange={e => { setAiInput(e.target.value); setAiError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAiParse()}
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/80 border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm text-gray-800 placeholder:text-gray-400"
            />
            <button
              onClick={handleAiParse}
              disabled={!aiInput.trim() || aiLoading}
              className="px-3 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-violet-600 active:scale-95 transition-all flex items-center"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoLoading}
              className="px-3 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-sky-600 active:scale-95 transition-all flex items-center"
            >
              {photoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
          </div>
          {aiError && <p className="text-xs text-red-500 mt-1.5 px-1">{aiError}</p>}
          {aiResults && (
            <div className="mt-2 space-y-1.5">
              {aiResults.map((m, i) => (
                <button
                  key={i}
                  onClick={() => handleAiSave(m)}
                  className="flex items-center justify-between w-full p-2.5 rounded-xl bg-white/80 border border-violet-100 hover:border-violet-300 transition-all active:scale-[0.98] text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{m.food}</p>
                    <p className="text-[10px] text-gray-500">{m.estimatedLactoseGrams}g lactose · {DAIRY_LEVEL_INFO[m.dairyLevel].label}</p>
                  </div>
                  <span className="text-xs text-violet-500 font-medium">+ Add</span>
                </button>
              ))}
            </div>
          )}
        </div>

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
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/70 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 placeholder:text-gray-400"
          />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Or type a custom food..."
            value={customFood}
            onChange={e => setCustomFood(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustomFood()}
            className="flex-1 px-4 py-3 rounded-2xl bg-white/70 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder:text-gray-400"
          />
          <button
            onClick={handleCustomFood}
            disabled={!customFood.trim()}
            className="px-4 py-3 rounded-2xl bg-indigo-500 text-white font-medium disabled:opacity-40 hover:bg-indigo-600 active:scale-95 transition-all"
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
          className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-semibold text-lg hover:bg-indigo-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 mb-4">
            <Pill className="w-10 h-10 text-indigo-500" />
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
              className="w-14 h-14 rounded-full bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center active:scale-90 transition-all"
            >
              <Plus className="w-6 h-6 text-indigo-600" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setLactaidPills(n)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                  lactaidPills === n
                    ? 'bg-indigo-500 text-white scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-red-500 text-center">{saveError}</p>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold text-lg hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-5 h-5" /> {isSaving ? 'Saving...' : 'Save Meal'}
        </button>
      </div>
    );
  }

  return null;
}
