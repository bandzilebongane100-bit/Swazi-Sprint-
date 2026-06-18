import React from "react";
import { ArrowLeft, Award, Check, TrendingUp, Sparkles, MapPin } from "lucide-react";
import { Achievement, GameStats, SaveState } from "../types";
import { sounds } from "../sounds";

interface StatsScreenProps {
  saveState: SaveState;
  onBack: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ saveState, onBack }) => {
  const stats = saveState.stats;

  // Compute percentage progress of each cumulative achievement
  const achievementsWithProgress: Achievement[] = saveState.achievements.map((ach) => {
    let currentVal = 0;
    if (ach.id === "kingdom_explorer") currentVal = stats.totalDistance;
    if (ach.id === "gold_tycoon") currentVal = stats.totalCoins;
    if (ach.id === "gem_hoarder") currentVal = stats.totalGems;
    if (ach.id === "cow_dodger") currentVal = stats.cowsDodged;
    if (ach.id === "conquer_sibebe") currentVal = stats.highScore;
    if (ach.id === "upgrade_max") {
      // Find highest upgraded level in power ups
      const maxLvl = Math.max(...(Object.values(saveState.powerUpLevels) as number[]));
      currentVal = maxLvl;
    }

    const isUnlocked = currentVal >= ach.target;

    return {
      ...ach,
      current: currentVal,
      unlocked: isUnlocked,
    };
  });

  return (
    <div id="stats_screen" className="absolute inset-0 bg-slate-950 flex flex-col p-5 text-white z-20 animate-fade-in select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="p-2 bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors border border-white/5 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center space-x-1.5">
          <span>HALL OF STATS</span>
        </h2>
        {/* Simple awards ticker */}
        <div className="flex items-center space-x-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase">UNLOCKED:</span>
          <div className="text-xs bg-slate-900 px-2 py-0.5 rounded-full border border-yellow-500/10 text-yellow-500 font-mono font-bold">
            🏅 {achievementsWithProgress.filter((a) => a.unlocked).length}
          </div>
        </div>
      </div>

      {/* Scrollable Metrics and Badges */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
        {/* SECTION 1: RUNNERS PERFORMANCE NUMBERS */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono tracking-widest text-[#a855f7] uppercase">🏆 Overall Achievements</h3>
          
          <div className="grid grid-cols-2 gap-2.5">
            {/* Highscore */}
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 relative overflow-hidden">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Personal Best</span>
              <div className="text-xl font-black mt-1 text-yellow-400">{stats.highScore}</div>
              <TrendingUp size={14} className="absolute right-3 bottom-3 text-yellow-400/20" />
            </div>

            {/* Total Distance */}
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 relative overflow-hidden">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Total Sprinted</span>
              <div className="text-xl font-black mt-1 text-white">{stats.totalDistance}m</div>
              <MapPin size={14} className="absolute right-3 bottom-3 text-indigo-400/20" />
            </div>

            {/* Total Coins */}
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Total Coins Found</span>
              <div className="text-base font-black mt-1 text-yellow-500">🪙 {stats.totalCoins}</div>
            </div>

            {/* Total Gems */}
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Total Red Rubies</span>
              <div className="text-base font-black mt-1 text-red-400">💎 {stats.totalGems}</div>
            </div>

            {/* Runs played */}
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Runs Tumbled</span>
              <div className="text-base font-black mt-1 text-pink-400">🏃 {stats.runsPlayed}</div>
            </div>

            {/* Cows dodged */}
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Cows Evaded</span>
              <div className="text-base font-black mt-1 text-emerald-400">🐄 {stats.cowsDodged}</div>
            </div>
          </div>
        </div>

        {/* SECTION 2: THE BADGES CHESTBOARD */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono tracking-widest text-[#facc15] uppercase">🏅 Royal Badge Chest</h3>
          
          <div className="space-y-3">
            {achievementsWithProgress.map((ach) => {
              const progressPct = Math.min(100, (ach.current / ach.target) * 100);

              return (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-2xl border flex items-center space-x-3.5 relative overflow-hidden ${
                    ach.unlocked
                      ? "bg-gradient-to-r from-yellow-500/5 to-amber-500/5 border-yellow-500/20"
                      : "bg-slate-900 border-white/5 opacity-70"
                  }`}
                >
                  {/* Badge Icon circle */}
                  <div
                    className={`w-12 h-12 rounded-full shrink-0 font-sans flex items-center justify-center text-2xl border ${
                      ach.unlocked
                        ? "bg-gradient-to-b from-yellow-400/20 to-amber-500/35 border-yellow-400/40 shadow-inner"
                        : "bg-slate-950 border-white/5 text-slate-500"
                    }`}
                  >
                    {ach.badgeEmoji}
                  </div>

                  {/* Descriptions */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs tracking-wide">{ach.title}</h4>
                      {ach.unlocked && (
                        <span className="text-[8px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded px-1 flex items-center space-x-0.5">
                          <Check size={8} />
                          <span>UNLOCKED</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{ach.description}</p>
                    
                    {/* Badge slider progress */}
                    {!ach.unlocked && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase mb-1">
                          <span>Target progress</span>
                          <span>
                            {ach.current} / {ach.target}
                          </span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-center text-slate-500 font-mono mt-2">
        Badge accomplishments earn special gold payouts securely offline.
      </div>
    </div>
  );
};
