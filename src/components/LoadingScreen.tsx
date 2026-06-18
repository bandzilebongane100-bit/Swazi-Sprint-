import React, { useEffect, useState } from "react";
import { Sparkles, Trophy, Zap } from "lucide-react";
import { sounds } from "../sounds";

interface LoadingScreenProps {
  onComplete: () => void;
  locationName: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, locationName }) => {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const loadingTips = [
    `Unlocking royal pathways in ${locationName}... 🇸🇿`,
    "Tuning traditional polyrhythmic synth tracks... 🎵",
    "Positioning Swazi cows on rural pathways... 🐄",
    "Shining dual-tone golden coins & red rubies... 🪙",
    "Initializing dynamic physics sliders for 60FPS... ⚡",
    "Ready to run! Warm up those reflex triggers... 🔥"
  ];

  useEffect(() => {
    sounds.playCoin();
    
    // Increment progress over exactly 5.0 seconds (5000ms)
    const totalDuration = 5000;
    const intervalTime = 50; // update scale
    const steps = totalDuration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          // Play slide/upgrade sound on 100% load
          setTimeout(() => {
            sounds.playUpgrade();
            onComplete();
          }, 150);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    // Swap loading tip descriptions periodically
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % loadingTips.length);
    }, 1100);

    return () => {
      clearInterval(timer);
      clearInterval(tipTimer);
    };
  }, [onComplete, locationName]);

  return (
    <div id="loading_screen" className="absolute inset-0 bg-slate-950 flex flex-col justify-between p-6 text-white z-50 animate-fade-in select-none">
      {/* Traditional Tribal Borders Decorative */}
      <div className="flex justify-center space-x-1.5 opacity-15">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="w-6 h-6 rotate-45 border border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-yellow-400" />
          </div>
        ))}
      </div>

      {/* Center Spinner and Stats */}
      <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative">
          {/* Animated pulsing outer halo ring */}
          <div className="absolute -inset-6 rounded-full border-2 border-indigo-500/10 border-t-indigo-500 animate-spin" style={{ animationDuration: '2s' }} />
          <div className="absolute -inset-4 rounded-full border-2 border-dashed border-yellow-500/10 border-r-yellow-500 animate-spin" style={{ animationDuration: '3s' }} />
          
          <div className="w-24 h-24 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center shadow-2xl relative z-10">
            <Trophy className="w-10 h-10 text-yellow-400 animate-bounce" />
          </div>
        </div>

        <div className="space-y-3.5 max-w-xs">
          <h3 className="text-sm font-black tracking-widest text-[#ca8a04] uppercase font-mono">
            PREPARING RUNWAY
          </h3>
          <h2 className="text-xl font-extrabold uppercase text-white tracking-tight">
            {locationName}
          </h2>

          {/* Staggered rotating tip */}
          <div className="h-10 flex items-center justify-center">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed animate-pulse">
              {loadingTips[tipIndex]}
            </p>
          </div>
        </div>

        {/* Progress percent text */}
        <div className="w-full max-w-[260px] space-y-2 pt-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>IGNITION</span>
            <span className="font-bold text-yellow-400">{Math.min(100, Math.floor(progress))}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 border border-white/5 rounded-full p-0.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 via-[#8b5cf6] to-indigo-500 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Developer notice short slider at bottom */}
      <div className="text-center space-y-2 border-t border-white/5 pt-4">
        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center justify-center space-x-1">
          <Sparkles size={8} className="text-indigo-400" />
          <span>Crafted with AI by Bandzile Kunene • Manzini Eswatini</span>
        </p>
      </div>
    </div>
  );
};
