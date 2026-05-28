'use client';

import { TrendingUp, Target, Award, BarChart3, Download, Sparkles } from 'lucide-react';
import { MealEntry } from '@/lib/types';
import { DAIRY_LEVEL_INFO } from '@/lib/dairy';
import { getRecommendations, getStats, getPatternInsights, exportMealsToCsv } from '@/lib/recommendations';

interface InsightsProps {
  meals: MealEntry[];
}

export default function Insights({ meals }: InsightsProps) {
  const recommendations = getRecommendations(meals);
  const stats = getStats(meals);
  const patterns = getPatternInsights(meals);

  function handleExport() {
    const csv = exportMealsToCsv(meals);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lactaid-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="text-5xl mb-4">💡</div>
        <h2 className="text-xl font-bold text-gray-800">No insights yet</h2>
        <p className="text-gray-500 mt-2 max-w-xs">
          Log meals and track symptoms to get personalized Lactaid dosage recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Your Insights</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-gray-200 text-xs font-medium text-gray-600 hover:bg-white hover:border-gray-300 transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
          label="Meals Logged"
          value={String(stats.totalMeals)}
          sub={`${stats.trackedMeals} with symptoms`}
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-emerald-500" />}
          label="Success Rate"
          value={stats.trackedMeals > 0 ? `${stats.successRate}%` : '--'}
          sub="symptom-free meals"
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-amber-500" />}
          label="Avg Pills/Meal"
          value={stats.totalMeals > 0 ? String(stats.avgPills) : '--'}
          sub="Lactaid per meal"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
          label="Top Food"
          value={stats.mostCommonFood.length > 12 ? stats.mostCommonFood.substring(0, 12) + '...' : stats.mostCommonFood}
          sub="most logged"
        />
      </div>

      {/* Pattern Insights */}
      {patterns.length > 0 && (
        <div className="bg-white/60 rounded-3xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Smart Patterns
          </h3>
          <div className="space-y-2.5">
            {patterns.map((p, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-2xl ${
                  p.type === 'success' ? 'bg-emerald-50/80 border border-emerald-100' :
                  p.type === 'warning' ? 'bg-amber-50/80 border border-amber-100' :
                  'bg-blue-50/80 border border-blue-100'
                }`}
              >
                <span className="text-lg shrink-0">{p.emoji}</span>
                <p className="text-sm text-gray-700">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dosage Guide */}
      <div className="bg-white/60 rounded-3xl p-5 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="text-lg">💊</span> Your Personal Dosage Guide
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Based on your {stats.trackedMeals} tracked meal{stats.trackedMeals !== 1 ? 's' : ''}
        </p>

        <div className="space-y-3">
          {recommendations.map(rec => {
            const levelInfo = DAIRY_LEVEL_INFO[rec.dairyLevel];
            return (
              <div key={rec.dairyLevel} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/80">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: levelInfo.color + '20', color: levelInfo.color }}
                    >
                      {levelInfo.emoji} {levelInfo.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{levelInfo.description}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-800">{rec.recommendedPills}</span>
                    <span className="text-xs text-gray-500">pill{rec.recommendedPills !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ConfidenceDots level={rec.confidence} />
                    <span className="text-[10px] text-gray-400">
                      {rec.dataPoints > 0 ? `${rec.dataPoints} entries` : 'default'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Symptom Trend */}
      {stats.weeklyTrend.length > 0 && (
        <div className="bg-white/60 rounded-3xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" /> Symptom Trend
          </h3>
          <div className="flex items-end gap-2 h-32">
            {stats.weeklyTrend.map((week, i) => {
              const height = Math.max(10, (week.avgScore / 3) * 100);
              const color =
                week.avgScore < 0.5 ? '#10b981' :
                week.avgScore < 1.5 ? '#fbbf24' :
                week.avgScore < 2.5 ? '#f97316' : '#ef4444';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500 font-medium">{week.avgScore}</span>
                  <div
                    className="w-full rounded-t-xl transition-all duration-500"
                    style={{ height: `${height}%`, backgroundColor: color + '40', borderBottom: `3px solid ${color}` }}
                  />
                  <span className="text-[10px] text-gray-400">{week.week}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            0 = no symptoms, 3 = severe
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 border border-blue-100">
        <h3 className="font-bold text-gray-800 mb-2">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">1.</span>
            Take Lactaid with your <strong>first bite</strong> of dairy
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">2.</span>
            Add extra pills for meals lasting &gt;30 minutes
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">3.</span>
            Log symptoms within <strong>2-12 hours</strong> of eating
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">4.</span>
            The more you log, the better your recommendations get
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white/60 rounded-2xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function ConfidenceDots({ level }: { level: 'low' | 'medium' | 'high' }) {
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= filled ? 'bg-blue-400' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
}
