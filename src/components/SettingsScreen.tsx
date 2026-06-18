import React from "react";
import { ArrowLeft, Trash2, Shield, Volume2, Sparkles, Battery } from "lucide-react";
import { sounds } from "../sounds";

interface SettingsScreenProps {
  audioEnabled: boolean;
  onToggleAudio: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  isHighQuality: boolean;
  onToggleQuality: () => void;
  onResetProgress: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  audioEnabled,
  onToggleAudio,
  musicEnabled,
  onToggleMusic,
  isHighQuality,
  onToggleQuality,
  onResetProgress,
  onBack,
}) => {
  const handleReset = () => {
    sounds.playClick();
    const conf = window.confirm(
      "WARNING: Are you sure you want to delete all collected gold, rubies, unlocked characters, and upgrades? This action is permanent and cannot be reversed!"
    );
    if (conf) {
      onResetProgress();
    }
  };

  return (
    <div id="settings_screen" className="absolute inset-0 bg-slate-950 flex flex-col p-5 text-white z-20 animate-fade-in select-none">
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
          <span>RUNNER SETTINGS</span>
        </h2>
        <div className="w-8 h-8" /> {/* Balance spacer */}
      </div>

      {/* Primary configuration controls list container */}
      <div className="flex-1 overflow-y-auto py-5 space-y-5">
        
        {/* AUDIO ENGINE CONTROLS */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-mono tracking-widest text-[#fbbf24] uppercase">🔊 Audio Controls</h3>
          
          <div className="bg-slate-900/60 rounded-2xl border border-white/5 divide-y divide-white/5">
            {/* SFX sound */}
            <div className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs">Sound Effects (SFX)</h4>
                <p className="text-[10px] text-slate-400">Jump whooshes, coin chime dual tones</p>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  onToggleAudio();
                }}
                className={`w-14 h-7 cursor-pointer rounded-full p-1 transition-colors duration-200 ${
                  audioEnabled ? "bg-emerald-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full transition-transform duration-200 ${
                    audioEnabled ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Music sounds */}
            <div className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs">Polyrhythm Track</h4>
                <p className="text-[10px] text-slate-400">African bouncy synthetics synthesizer loop</p>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  onToggleMusic();
                }}
                className={`w-14 h-7 cursor-pointer rounded-full p-1 transition-colors duration-200 ${
                  musicEnabled ? "bg-emerald-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full transition-transform duration-200 ${
                    musicEnabled ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* PERFORMANCE ADJUSTMENTS CAPPED FPS */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-mono tracking-widest text-[#38bdf8] uppercase">⚡ Performance Setup</h3>
          
          <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs">High Refresh Rates (60 FPS Boost)</h4>
              <p className="text-[10px] text-slate-400">Toggle for battery saving vs. peak fluid animation</p>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onToggleQuality();
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase flex items-center space-x-1 border cursor-pointer select-none transition-colors duration-200"
              style={{
                borderColor: isHighQuality ? "#10b981" : "#e2e8f0",
                color: isHighQuality ? "#10b981" : "#94a3b8",
                backgroundColor: isHighQuality ? "rgba(16, 185, 129, 0.05)" : "transparent",
              }}
            >
              {isHighQuality ? (
                <>
                  <Sparkles size={11} className="fill-[#10b981]" />
                  <span>60 FPS</span>
                </>
              ) : (
                <>
                  <Battery size={11} />
                  <span>30 FPS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* FACTORY DATA DELETE */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-mono tracking-widest text-red-400 uppercase">☠️ Danger Zone</h3>

          <div className="bg-slate-900/60 rounded-2xl border border-slate-900 p-4 space-y-3">
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs text-red-200">Reboot Mobile Storage</h4>
              <p className="text-[10px] text-slate-400">
                Wipe clean all save histories, custom high scores, upgrades and revert variables back to default school student.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full cursor-pointer py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold text-xs tracking-wider rounded-xl uppercase flex items-center justify-center space-x-2 shadow transition-all"
            >
              <Trash2 size={12} />
              <span>CLEAR FILES & PROGRESS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Legal Footer */}
      <div className="border-t border-white/5 pt-4 text-center space-y-1">
        <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
          SWAZI SPRINT RUNNER APP • BUILD v1.1.24
        </p>
        <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest flex items-center justify-center space-x-1">
          <Shield size={8} />
          <span>No internet required • No cookies saved</span>
        </p>
      </div>
    </div>
  );
};
