"use client";

import { useState } from "react";
import MealLogger from "./MealLogger";
import History from "./History";
import Insights from "./Insights";

type Tab = "log" | "history" | "insights";

export default function LactaidLogger() {
  const [activeTab, setActiveTab] = useState<Tab>("log");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleDataChange() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">
            💊 Lactaid Logger
          </h1>
          <p className="text-white/50 text-sm">
            Track dairy, dosage & symptoms
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="sticky top-[76px] z-40 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 flex">
          {(
            [
              { id: "log", label: "Log Meal", emoji: "🍽️" },
              { id: "history", label: "History", emoji: "📋" },
              { id: "insights", label: "Insights", emoji: "📊" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <span className="mr-1">{tab.emoji}</span>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {activeTab === "log" && <MealLogger onMealSaved={handleDataChange} />}
        {activeTab === "history" && (
          <History refreshKey={refreshKey} onUpdate={handleDataChange} />
        )}
        {activeTab === "insights" && <Insights refreshKey={refreshKey} />}
      </main>
    </div>
  );
}
