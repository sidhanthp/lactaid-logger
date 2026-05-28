'use client';

import { useState, useCallback } from 'react';
import { PlusCircle, Clock, Lightbulb } from 'lucide-react';
import { TabType, MealEntry } from '@/lib/types';
import { getMeals } from '@/lib/storage';
import LogMeal from './LogMeal';
import History from './History';
import Insights from './Insights';

const TABS: { id: TabType; label: string; icon: typeof PlusCircle }[] = [
  { id: 'log', label: 'Log Meal', icon: PlusCircle },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
];

export default function LactaidLogger() {
  const [activeTab, setActiveTab] = useState<TabType>('log');
  const [meals, setMeals] = useState<MealEntry[]>(() => getMeals());

  const refreshMeals = useCallback(() => {
    setMeals(getMeals());
  }, []);

  function handleMealLogged() {
    refreshMeals();
    setActiveTab('history');
  }

  const pendingSymptoms = meals.filter(m => m.symptoms === null).length;

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-200">
              💊
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Lactaid Logger</h1>
              <p className="text-xs text-gray-500">Track dairy · Find your dosage</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 pb-24">
        {activeTab === 'log' && <LogMeal onMealSaved={refreshMeals} onMealLogged={handleMealLogged} />}
        {activeTab === 'history' && <History meals={meals} onUpdate={refreshMeals} />}
        {activeTab === 'insights' && <Insights meals={meals} />}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/80 backdrop-blur-xl border-t border-gray-100/50 safe-area-bottom">
        <div className="max-w-lg mx-auto flex">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 pt-2 transition-all relative ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                )}
                <div className="relative">
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  {tab.id === 'history' && pendingSymptoms > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {pendingSymptoms}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
