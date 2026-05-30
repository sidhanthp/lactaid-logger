'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronRight, ChevronLeft, Minus, Plus, Check, Pill, Zap, Sparkles, Loader2, Camera, X, Clock } from 'lucide-react';
import { DairyLevel, MealEntry } from '@/lib/types';
import { DAIRY_FOODS, DAIRY_LEVEL_INFO, searchFoods, estimateDairyLevel } from '@/lib/dairy';
import { createMeal } from '@/lib/storage';
import { getRecommendations } from '@/lib/recommendations';

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

interface MealItem {
  food: string;
  emoji: string;
  dairyLevel: DairyLevel;
  lactoseGrams: number;
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
  const [photoContext, setPhotoContext] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const estimateAbortRef = useRef<AbortController | null>(null);

  // Multi-item meal basket
  const [mealItems, setMealItems] = useState<MealItem[]>([]);

  // Editable meal time
  const [mealTime, setMealTime] = useState<string>(() => formatDateTimeLocal(new Date()));

  function formatDateTimeLocal(date: Date): string {
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${mo}-${d}T${h}:${mi}`;
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Combined dairy level from basket
  const combinedLactose = useMemo(() => {
    return mealItems.reduce((sum, item) => sum + item.lactoseGrams, 0);
  }, [mealItems]);

  const combinedDairyLevel = useMemo(() => {
    return estimateDairyLevel(combinedLactose);
  }, [combinedLactose]);

  const pillRecommendation = useMemo(() => {
    const level = mealItems.length > 0 ? combinedDairyLevel : dairyLevel;
    const recs = getRecommendations(meals);
    return recs.find(r => r.dairyLevel === level);
  }, [meals, dairyLevel, mealItems, combinedDairyLevel]);

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

  function addToBasket(food: string, emoji: string, level: DairyLevel, lactose: number) {
    setMealItems(prev => [...prev, { food, emoji, dairyLevel: level, lactoseGrams: lactose }]);
  }

  function removeFromBasket(index: number) {
    setMealItems(prev => prev.filter((_, i) => i !== index));
  }

  function selectFood(name: string, lactose: number, emoji: string, level: DairyLevel) {
    if (estimateAbortRef.current) estimateAbortRef.current.abort();
    setEstimating(false);
    setEstimateReasoning('');
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

  const [estimating, setEstimating] = useState(false);
  const [estimateReasoning, setEstimateReasoning] = useState('');

  async function handleCustomFood() {
    if (!customFood.trim()) return;
    const food = customFood.trim();
    setSelectedFood(food);
    setSelectedEmoji('🍽');
    setLactoseGrams(3);
    setDairyLevel('medium');
    setEstimating(true);
    setEstimateReasoning('');
    setStep('dairy');
    if (estimateAbortRef.current) estimateAbortRef.current.abort();
    const controller = new AbortController();
    estimateAbortRef.current = controller;
    try {
      const res = await fetch('/api/estimate-dairy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (res.ok) {
        const data = await res.json();
        setLactoseGrams(data.estimatedLactoseGrams);
        setDairyLevel(data.dairyLevel);
        if (data.reasoning) setEstimateReasoning(data.reasoning);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally {
      if (!controller.signal.aborted) setEstimating(false);
    }
  }

  function handleAddToBasketFromDairy() {
    addToBasket(selectedFood, selectedEmoji, dairyLevel, lactoseGrams);
    setSelectedFood('');
    setSelectedEmoji('🍽');
    setLactoseGrams(0);
    setDairyLevel('none');
    setEstimateReasoning('');
    setCustomFood('');
    setStep('food');
  }

  function handleDoneWithBasket() {
    // Auto-open recommendation with combined dairy level
    if (pillRecommendation && lactaidPills === 0) {
      setLactaidPills(pillRecommendation.recommendedPills);
    }
    setStep('lactaid');
  }

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const timestamp = new Date(mealTime).getTime();
      if (mealItems.length > 0) {
        // Multi-item meal: save as combined entry
        const combinedFood = mealItems.map(item => item.food).join(', ');
        const totalLactose = mealItems.reduce((sum, item) => sum + item.lactoseGrams, 0);
        const level = estimateDairyLevel(totalLactose);
        await createMeal({
          food: combinedFood,
          dairyLevel: level,
          estimatedLactoseGrams: totalLactose,
          lactaidPills,
          timestamp,
        });
      } else {
        // Single item meal
        await createMeal({
          food: selectedFood,
          dairyLevel,
          estimatedLactoseGrams: lactoseGrams,
          lactaidPills,
          timestamp,
        });
      }
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

  function handleAiSave(meal: AiParsedMeal) {
    // Add directly to basket instead of single-item flow
    addToBasket(meal.food, '🍽', meal.dairyLevel, meal.estimatedLactoseGrams);
    // If there are more AI results, keep showing them
    if (aiResults && aiResults.length > 1) {
      setAiResults(aiResults.filter(m => m !== meal));
    } else {
      setAiResults(null);
      setAiInput('');
    }
  }

  function revokePreview() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }

  async function analyzePhoto(file: File, context: string) {
    setPhotoLoading(true);
    setPhotoError('');
    setPhotoResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('meals', JSON.stringify(meals));
      if (context) formData.append('context', context);
      const res = await fetch('/api/analyze-photo', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPhotoResult(data);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to analyze photo');
    } finally {
      setPhotoLoading(false);
    }
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    revokePreview();
    setPhotoPreview(URL.createObjectURL(file));
    setPendingFile(file);
    setPhotoContext('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    await analyzePhoto(file, '');
  }

  async function handleReanalyzeWithContext() {
    if (!pendingFile) return;
    await analyzePhoto(pendingFile, photoContext);
  }

  function handlePhotoItemSelect(item: PhotoAnalysisResult['items'][0]) {
    // Add to basket directly
    addToBasket(item.food, '🍽', item.dairyLevel as DairyLevel, item.estimatedLactoseGrams);
  }

  function dismissPhoto() {
    setPhotoResult(null);
    revokePreview();
    setPhotoPreview(null);
    setPhotoError('');
    setPhotoContext('');
    setPendingFile(null);
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
    revokePreview();
    setPhotoPreview(null);
    setPhotoError('');
    setPhotoContext('');
    setPendingFile(null);
    setMealItems([]);
    setMealTime(formatDateTimeLocal(new Date()));
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

        {/* Meal Basket */}
        {mealItems.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-3 border border-emerald-200/60">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Meal Items ({mealItems.length})
                </span>
              </div>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {combinedLactose.toFixed(1)}g total lactose
              </span>
            </div>
            <div className="space-y-1.5 mb-2">
              {mealItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/80">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.food}</p>
                      <p className="text-[10px] text-gray-500">{item.lactoseGrams}g · {DAIRY_LEVEL_INFO[item.dairyLevel].label}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromBasket(i)}
                    className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleDoneWithBasket}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Pill className="w-4 h-4" /> Get Lactaid Recommendation
            </button>
          </div>
        )}

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
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add context: &quot;sharing with 3 people&quot;, &quot;just my slice&quot;..."
                value={photoContext}
                onChange={e => setPhotoContext(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && photoContext.trim() && !photoLoading && handleReanalyzeWithContext()}
                className="flex-1 px-3 py-2 rounded-xl bg-white/80 border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs text-gray-800 placeholder:text-gray-400"
              />
              {photoContext.trim() && (
                <button
                  onClick={handleReanalyzeWithContext}
                  disabled={photoLoading}
                  className="px-3 py-2 rounded-xl bg-sky-500 text-white text-xs font-medium disabled:opacity-40 hover:bg-sky-600 active:scale-95 transition-all flex items-center gap-1"
                >
                  {photoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Update</span>
                </button>
              )}
            </div>
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
                  {photoResult.items.map((item, i) => {
                    const alreadyAdded = mealItems.some(m => m.food === item.food);
                    return (
                      <button
                        key={i}
                        onClick={() => !alreadyAdded && handlePhotoItemSelect(item)}
                        disabled={alreadyAdded}
                        className={`flex items-center justify-between w-full p-2.5 rounded-xl border transition-all text-left ${
                          alreadyAdded
                            ? 'bg-emerald-50/80 border-emerald-200 opacity-70'
                            : 'bg-white/80 border-sky-100 hover:border-sky-300 active:scale-[0.98]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{item.food}</p>
                          <p className="text-[10px] text-gray-500">
                            {item.estimatedLactoseGrams}g lactose · {item.hasDairy ? DAIRY_LEVEL_INFO[item.dairyLevel as DairyLevel]?.label ?? item.dairyLevel : 'Dairy free'}
                          </p>
                        </div>
                        {alreadyAdded ? (
                          <span className="text-xs text-emerald-500 font-medium">Added</span>
                        ) : item.hasDairy ? (
                          <span className="text-xs text-sky-500 font-medium">+ Add</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {photoResult.items.length > 1 && (
                  <button
                    onClick={() => {
                      photoResult.items.forEach(item => {
                        if (!mealItems.some(m => m.food === item.food)) {
                          addToBasket(item.food, '🍽', item.dairyLevel as DairyLevel, item.estimatedLactoseGrams);
                        }
                      });
                      dismissPhoto();
                    }}
                    className="w-full mt-2 py-2 rounded-xl bg-sky-100 text-sky-700 text-xs font-semibold hover:bg-sky-200 active:scale-[0.98] transition-all"
                  >
                    + Add All Items
                  </button>
                )}
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
              {aiResults.map((m, i) => {
                const alreadyAdded = mealItems.some(item => item.food === m.food);
                return (
                  <button
                    key={i}
                    onClick={() => !alreadyAdded && handleAiSave(m)}
                    disabled={alreadyAdded}
                    className={`flex items-center justify-between w-full p-2.5 rounded-xl border transition-all text-left ${
                      alreadyAdded
                        ? 'bg-emerald-50/80 border-emerald-200 opacity-70'
                        : 'bg-white/80 border-violet-100 hover:border-violet-300 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{m.food}</p>
                      <p className="text-[10px] text-gray-500">{m.estimatedLactoseGrams}g lactose · {DAIRY_LEVEL_INFO[m.dairyLevel].label}</p>
                    </div>
                    {alreadyAdded ? (
                      <span className="text-xs text-emerald-500 font-medium">Added</span>
                    ) : (
                      <span className="text-xs text-violet-500 font-medium">+ Add</span>
                    )}
                  </button>
                );
              })}
              {aiResults.length > 1 && (
                <button
                  onClick={() => {
                    aiResults.forEach(m => {
                      if (!mealItems.some(item => item.food === m.food)) {
                        addToBasket(m.food, '🍽', m.dairyLevel, m.estimatedLactoseGrams);
                      }
                    });
                    setAiResults(null);
                    setAiInput('');
                  }}
                  className="w-full py-2 rounded-xl bg-violet-100 text-violet-700 text-xs font-semibold hover:bg-violet-200 active:scale-[0.98] transition-all"
                >
                  + Add All Items
                </button>
              )}
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

          {estimating ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span className="text-sm text-indigo-600">Estimating dairy content...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-gray-800">{lactoseGrams}g</span>
                <span
                  className="text-sm font-semibold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: levelInfo.color + '20', color: levelInfo.color }}
                >
                  {levelInfo.emoji} {levelInfo.label}
                </span>
              </div>

              {estimateReasoning && (
                <p className="text-xs text-indigo-600 bg-indigo-50 rounded-xl px-3 py-2 mb-3">{estimateReasoning}</p>
              )}
            </>
          )}

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

        <div className="flex gap-3">
          <button
            onClick={handleAddToBasketFromDairy}
            disabled={estimating}
            className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-semibold text-base hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" /> Add & Continue
          </button>
          {mealItems.length === 0 && (
            <button
              onClick={() => {
                // Single item: go directly to lactaid step
                addToBasket(selectedFood, selectedEmoji, dairyLevel, lactoseGrams);
                if (pillRecommendation && lactaidPills === 0) {
                  setLactaidPills(pillRecommendation.recommendedPills);
                }
                setStep('lactaid');
              }}
              disabled={estimating}
              className="flex-1 py-4 rounded-2xl bg-indigo-500 text-white font-semibold text-base hover:bg-indigo-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Done <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'lactaid') {
    const totalLactose = mealItems.length > 0 ? combinedLactose : lactoseGrams;
    const displayLevel = mealItems.length > 0 ? combinedDairyLevel : dairyLevel;
    const displayFood = mealItems.length > 0
      ? mealItems.map(item => item.food).join(', ')
      : selectedFood;
    const rec = pillRecommendation;
    const levelInfo = DAIRY_LEVEL_INFO[displayLevel];

    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <button onClick={() => mealItems.length > 0 ? setStep('food') : setStep('dairy')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 w-fit">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 mb-4">
            <Pill className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">How many Lactaid pills?</h2>
          <p className="text-gray-500 mt-1 text-sm">
            For <span className="font-medium">{displayFood}</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: levelInfo.color + '20', color: levelInfo.color }}
            >
              {levelInfo.emoji} {levelInfo.label}
            </span>
            <span className="text-xs text-gray-500">{totalLactose.toFixed(1)}g lactose</span>
          </div>
          {mealItems.length > 1 && (
            <p className="text-xs text-gray-400 mt-1">{mealItems.length} items combined</p>
          )}
        </div>

        {rec && (
          <button
            onClick={() => setLactaidPills(rec.recommendedPills)}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.98] ${
              lactaidPills === rec.recommendedPills
                ? 'bg-indigo-50 border-indigo-300'
                : 'bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200 hover:border-indigo-300'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-indigo-700">
                Take {rec.recommendedPills} pill{rec.recommendedPills !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-indigo-500">
                {rec.reasoning} · {rec.confidence} confidence
              </p>
            </div>
            {lactaidPills === rec.recommendedPills && (
              <Check className="w-4 h-4 text-indigo-500" />
            )}
          </button>
        )}

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

        {/* Meal Time Picker */}
        <div className="bg-white/60 rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">When did you eat?</span>
          </div>
          <input
            type="datetime-local"
            value={mealTime}
            onChange={e => setMealTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-gray-800"
          />
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
