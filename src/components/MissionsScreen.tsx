import React from "react";
import { ArrowLeft, Check, Award, Gift } from "lucide-react";
import { Mission, SaveState } from "../types";
import { sounds } from "../sounds";

interface MissionsScreenProps {
  saveState: SaveState;
  onClaimReward: (missionId: string, coins: number, gems: number) => void;
  onBack: () => void;
}

export const MissionsScreen: React.FC<MissionsScreenProps> = ({
  saveState,
  onClaimReward,
  onBack,
}) => {
  const missions = saveState.activeMissions;

  const handleClaim = (mission: Mission) => {
    if (mission.completed && !mission.claimed) {
      sounds.playUpgrade();
      onClaimReward(mission.id, mission.rewardCoins, mission.rewardGems);
    }
  };

  return (
    <div id="missions_screen" className="absolute inset-0 bg-slate-950 flex flex-col p-5 text-white z-20 animate-fade-in select-none">
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
          <span>RUNNER MISSIONS</span>
        </h2>
        {/* Balances */}
        <div className="flex items-center space-x-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">REWARDS GATHERED:</span>
          <div className="text-xs bg-slate-900 px-2 py-0.5 rounded-full border border-white/5 text-purple-400 font-mono font-bold">
            🏆 {missions.filter((m) => m.completed).length}
          </div>
        </div>
      </div>

      {/* Description card */}
      <div className="my-3.5 p-3.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/15 rounded-2xl flex items-center space-x-3">
        <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center text-lg">
          🎁
        </div>
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wide">Kingdom Challenges</h4>
          <p className="text-[10px] text-slate-400 leading-normal">
            Complete high-cadence challenges automatically during runs to earn huge bags of gold and rubies !
          </p>
        </div>
      </div>

      {/* Missions checklist */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {missions.map((mission) => {
          const progressPercent = Math.min(100, (mission.current / mission.target) * 100);
          
          return (
            <div
              key={mission.id}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                mission.claimed
                  ? "bg-slate-950/40 border-slate-900 opacity-60"
                  : mission.completed
                  ? "bg-purple-950/20 border-purple-500/40"
                  : "bg-slate-900 border-white/5"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-0.5 max-w-[70%]">
                  <h4 className="font-bold text-xs leading-normal">{mission.description}</h4>
                  
                  {/* Progress tracker numbers */}
                  <span className="text-[10px] font-mono text-indigo-400">
                    {mission.claimed 
                      ? "Claimed successfully" 
                      : `Progress: ${mission.current} / ${mission.target}`}
                  </span>
                </div>

                {/* Reward elements */}
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono text-yellow-500">
                    <span>🪙 {mission.rewardCoins}</span>
                    {mission.rewardGems > 0 && <span className="text-red-400">💎 {mission.rewardGems}</span>}
                  </div>
                </div>
              </div>

              {/* Progress Bar slider */}
              {!mission.claimed && (
                <div className="h-2 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Action Buttons: Claim or standard status */}
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[8px] font-mono uppercase text-slate-500">Challenge ID: {mission.id}</span>
                
                {mission.claimed ? (
                  <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-1">
                    <Check size={10} />
                    <span>Reward Collected</span>
                  </span>
                ) : mission.completed ? (
                  <button
                    onClick={() => handleClaim(mission)}
                    className="px-3 py-1 bg-yellow-500 text-slate-950 font-black text-[10px] rounded-lg tracking-wider hover:bg-yellow-400 transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <Gift size={10} />
                    <span>CLAIM BONUS</span>
                  </button>
                ) : (
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                    UNCOMPLETED ({progressPercent.toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-center text-slate-500 font-mono mt-2">
        Missions reset and track cumulative gameplay achievements securely.
      </div>
    </div>
  );
};
