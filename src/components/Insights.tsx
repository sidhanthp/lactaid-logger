"use client";

import { getUserStats } from "@/lib/recommendation";

interface InsightsProps {
  refreshKey: number;
}

export default function Insights({ refreshKey }: InsightsProps) {
  const stats = getUserStats();

  // Force re-render when refreshKey changes
  void refreshKey;

  if (stats.totalMeals === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40 text-lg">No data yet</p>
        <p className="text-white/30 text-sm mt-1">
          Log meals and symptoms to see personalized insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Meals Logged"
          value={stats.totalMeals.toString()}
          sublabel="total entries"
        />
        <StatCard
          label="Avg Lactose"
          value={`${stats.avgDairyPerMeal.toFixed(1)}g`}
          sublabel="per meal"
        />
        <StatCard
          label="Avg Pills"
          value={stats.avgPillsPerMeal.toFixed(1)}
          sublabel="per meal"
        />
        <StatCard
          label="Symptom-Free"
          value={`${(stats.symptomFreeRate * 100).toFixed(0)}%`}
          sublabel="of logged meals"
          highlight={stats.symptomFreeRate > 0.7}
        />
      </div>

      {/* Personal Threshold */}
      {stats.personalThreshold !== null ? (
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-xl p-5">
          <h3 className="text-white font-bold text-lg mb-1">
            Your Personal Threshold
          </h3>
          <p className="text-white text-3xl font-bold">
            {stats.personalThreshold.toFixed(1)}g
          </p>
          <p className="text-white/60 text-sm mt-1">
            lactose per pill — this is how much lactose one Lactaid pill can
            handle for your body based on your logged data.
          </p>
          <p className="text-white/40 text-xs mt-3">
            Average person: ~5g per pill. Your body may need more or fewer pills
            than average.
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-bold text-lg mb-1">
            Learning Your Threshold...
          </h3>
          <p className="text-white/60 text-sm">
            Log at least 3 symptom-free meals (with Lactaid & dairy) to calculate your
            personal lactose-per-pill threshold.
          </p>
          <div className="mt-3 bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (stats.successfulPairedCount / 3) * 100)}%`,
              }}
            />
          </div>
          <p className="text-white/40 text-xs mt-1">
            {stats.successfulPairedCount}/3 successful entries logged
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h4 className="text-white font-semibold mb-2">Tips for better data:</h4>
        <ul className="space-y-1.5 text-white/60 text-sm">
          <li>• Log symptoms within 24 hours of eating</li>
          <li>• Try different pill amounts for similar meals</li>
          <li>• Note if you ate on an empty or full stomach</li>
          <li>• The more you log, the better the recommendations</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string;
  value: string;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight
          ? "bg-green-500/10 border-green-400/30"
          : "bg-white/5 border-white/10"
      }`}
    >
      <p className="text-white/50 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
      <p className="text-white/40 text-xs">{sublabel}</p>
    </div>
  );
}
