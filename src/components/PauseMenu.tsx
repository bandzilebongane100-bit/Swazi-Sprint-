import React from "react";
import { Play, RotateCcw, Home, Volume2, VolumeX } from "lucide-react";
import { sounds } from "../sounds";

interface PauseMenuProps {
  onKeepPlaying: () => void;
  onRestartRunning: () => void;
  onQuitToMenu: () => void;
  audioMuted: boolean;
  onToggleAudio: () => void;
  musicMuted: boolean;
  onToggleMusic: () => void;
  currentScore: number;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onKeepPlaying,
  onRestartRunning,
  onQuitToMenu,
  audioMuted,
  onToggleAudio,
  musicMuted,
  onToggleMusic,
  currentScore,
}) => {
  return (
    <div id="pause_overlay" className="absolute inset-0 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center p-6 z-40 animate-fade-in text-white">
      {/* Container box */}
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-6.5 text-center shadow-2xl relative space-y-6">
        
        {/* Swazi Shield Badge Background watermark */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />

        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">RUNNER PAUSED</span>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">SWAZI SPRINT</h2>
          <div className="text-sm text-slate-400 font-mono mt-1">
            Current Session Score: <span className="text-white font-bold">{currentScore}</span>
          </div>
        </div>

        {/* Major Controller Action Buttons */}
        <div className="flex flex-col space-y-3.5 z-10 relative">
          <button
            onClick={() => {
              sounds.playClick();
              onKeepPlaying();
            }}
            className="w-full cursor-pointer bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center space-x-2.5 shadow-lg shadow-amber-500/25 active:translate-y-0.5 transition-all text-base uppercase"
          >
            <Play size={18} className="fill-slate-950 stroke-slate-950" />
            <span>KEEP SPRINTING</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onRestartRunning();
            }}
            className="w-full cursor-pointer bg-slate-800 hover:bg-slate-750 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center space-x-2.5 border border-white/5 active:translate-y-0.5 transition-all text-sm uppercase"
          >
            <RotateCcw size={16} />
            <span>RESTART RUN</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onQuitToMenu();
            }}
            className="w-full cursor-pointer bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white font-medium py-3.5 px-6 rounded-2xl flex items-center justify-center space-x-2.5 border border-white/5 active:translate-y-0.5 transition-all text-sm uppercase"
          >
            <Home size={16} />
            <span>EXIT TO MAIN MENU</span>
          </button>
        </div>

        {/* Audio Mutes Toggles Section */}
        <div className="border-t border-white/5 pt-5 flex items-center justify-around">
          {/* SFX mute block */}
          <button
            onClick={onToggleAudio}
            className="flex flex-col items-center space-y-1 group cursor-pointer"
          >
            <div className={`p-3 rounded-full ${audioMuted ? "bg-slate-800 text-slate-500" : "bg-indigo-600/25 text-indigo-400 border border-indigo-500/25"} transition-colors`}>
              {audioMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">SFX</span>
          </button>

          {/* Music mute block */}
          <button
            onClick={onToggleMusic}
            className="flex flex-col items-center space-y-1 group cursor-pointer"
          >
            <div className={`p-3 rounded-full ${musicMuted ? "bg-slate-800 text-slate-500" : "bg-purple-600/25 text-purple-400 border border-purple-500/25"} transition-colors`}>
              {musicMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">MUSIC</span>
          </button>
        </div>

        {/* Micro Eswatini details */}
        <div className="text-[10px] font-mono text-slate-500">
          Tip: Tap ↑ or swipe ↑ to leap over cows and barricades!
        </div>
      </div>
    </div>
  );
};
