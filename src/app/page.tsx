"use client";

import { useState } from "react";
import { UtensilsCrossed, Heart, Clock, BarChart3 } from "lucide-react";
import MealLogger from "@/components/MealLogger";
import SymptomLogger from "@/components/SymptomLogger";
import History from "@/components/History";
import Insights from "@/components/Insights";

type Tab = "log" | "symptoms" | "history" | "insights";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "log", label: "Log Meal", icon: <UtensilsCrossed className="w-5 h-5" /> },
  { key: "symptoms", label: "Symptoms", icon: <Heart className="w-5 h-5" /> },
  { key: "history", label: "History", icon: <Clock className="w-5 h-5" /> },
  { key: "insights", label: "Insights", icon: <BarChart3 className="w-5 h-5" /> },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("log");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleDataChange() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto w-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="milk">
            🥛
          </span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Lactaid Logger</h1>
            <p className="text-xs text-gray-500">
              Track dairy, dose smart, feel great
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        {activeTab === "log" && <MealLogger onMealSaved={handleDataChange} />}
        {activeTab === "symptoms" && (
          <SymptomLogger onSymptomSaved={handleDataChange} />
        )}
        {activeTab === "history" && <History refreshKey={refreshKey} />}
        {activeTab === "insights" && <Insights refreshKey={refreshKey} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="max-w-lg mx-auto flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center py-2 pt-3 transition-colors ${
                activeTab === tab.key
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.icon}
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
