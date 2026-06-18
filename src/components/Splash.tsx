import React, { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { sounds } from "../sounds";

interface SplashProps {
  onDismiss: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onDismiss }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    sounds.playCoin();
    // Simulate loading/caching assets
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    sounds.playClick();
    onDismiss();
  };

  return (
    <div id="splash_screen" className="absolute inset-0 bg-gradient-to-br from-amber-500 via-rose-600 to-indigo-900 flex flex-col justify-between p-8 text-white select-none animate-fade-in overflow-hidden">
      {/* Traditional African Geometric Patterns Borders (top and bottom) */}
      <div className="flex justify-center space-x-1 opacity-25">
        {[...Array(14)].map((_, i) => (
          <div key={i} className="w-8 h-8 rotate-45 border-2 border-white/20 flex items-center justify-center">
            <div className="w-3 h-3 bg-white" />
          </div>
        ))}
      </div>

      {/* Main Branding Logo block */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative group scale-100 hover:scale-105 transition-transform duration-300">
          {/* Decorative halo */}
          <div className="absolute -inset-4 bg-yellow-400 rounded-full blur-xl opacity-35 animate-pulse" />
          
          {/* Custom Procedural shield logo */}
          <div className="relative w-36 h-48 bg-transparent flex items-center justify-center">
            {/* Swazi Cowhide Shield Design */}
            <div className="absolute inset-0 bg-red-600 rounded-full border-[6px] border-white shadow-2xl flex flex-col justify-between p-4 overflow-hidden">
              <div className="w-full h-1/2 bg-white rounded-t-full flex items-center justify-center opacity-90" />
              <div className="w-full h-1/2 bg-slate-900 rounded-b-full" />
            </div>
            {/* Swazi shield staff stick line */}
            <div className="absolute h-60 w-3 bg-amber-800 rounded-full border-2 border-white shadow -z-10" />
            {/* Feathers on staff */}
            <div className="absolute -top-4 w-6 h-6 bg-white rounded-full border border-gray-300" />
            <div className="absolute -bottom-4 w-6 h-6 bg-red-500 rounded-full border border-gray-300" />
            
            {/* Shield Center emblem (Umgobo text label) */}
            <div className="relative z-10 text-white font-mono text-[10px] tracking-widest font-black bg-black/60 px-2 py-1 rounded-md border border-white/20">
              UMGOBO
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {/* Big title with bold custom shadow letters */}
          <h1 className="text-5xl font-black font-sans uppercase tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] text-yellow-400">
            Swazi <span className="text-white">Sprint</span>
          </h1>
          <p className="text-yellow-100 text-xs tracking-widest uppercase font-mono bg-black/25 px-4 py-1.5 rounded-full border border-white/10 w-fit mx-auto">
            Kingdom Endless Runner
          </p>
        </div>
      </div>

      {/* Interactive Play Button block or loading progress bar */}
      <div className="space-y-6 flex flex-col items-center">
        {progress < 100 ? (
          <div className="w-full max-w-[250px] space-y-2 z-10">
            <div className="w-full h-2.5 bg-black/45 rounded-full p-0.5 border border-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-rose-400 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-center text-[10px] font-mono tracking-widest text-yellow-100 uppercase">
              Crossing Sibebe Rock {progress}%
            </div>
          </div>
        ) : (
          <button
            onClick={handleStart}
            className="w-full max-w-[260px] cursor-pointer bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-extrabold text-lg py-4.5 px-6 rounded-2xl shadow-[0_6px_20px_rgba(245,158,11,0.4)] transition-all duration-300 active:translate-y-1 transform flex items-center justify-center space-x-3 group"
          >
            <span>START SPRINTING</span>
            <Play size={20} className="fill-slate-900 stroke-slate-900 group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        {/* Traditional African Geometric Patterns Bottom */}
        <div className="flex justify-center space-x-1 opacity-25">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="w-8 h-8 rotate-45 border-2 border-white/20 flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 bg-red-400" />
            </div>
          ))}
        </div>

        <p className="text-[9px] font-mono text-white/50 text-center uppercase tracking-widest">
          © 2026 Kingdom of Eswatini Gaming Core • Offline Secure
        </p>
      </div>
    </div>
  );
};
