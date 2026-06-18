import React, { useState, useEffect } from "react";
import { Play, RotateCcw, Home, Award, Sparkles } from "lucide-react";
import { sounds } from "../sounds";

interface GameOverProps {
  score: number;
  coinsCollected: number;
  gemsCollected: number;
  distanceRun: number;
  highScore: number;
  onRestartRunning: () => void;
  onQuitToMenu: () => void;
  onDoubleCoins: (multiplier: number) => void;
  gemBalance: number;
}

export const GameOver: React.FC<GameOverProps> = ({
  score,
  coinsCollected,
  gemsCollected,
  distanceRun,
  highScore,
  onRestartRunning,
  onQuitToMenu,
  onDoubleCoins,
  gemBalance,
}) => {
  const [isHighscore, setIsHighscore] = useState(false);
  const [coinedDoubled, setCoinsDoubled] = useState(false);

  useEffect(() => {
    sounds.playCrash();
    if (score > highScore) {
      setIsHighscore(true);
      sounds.playGem();
    }
  }, [score, highScore]);

  const handleDoubleCoins = () => {
    if (coinedDoubled) return;
    if (gemBalance >= 1) {
      sounds.playUpgrade();
      onDoubleCoins(2); // double coins in callback updates parent state
      setCoinsDoubled(true);
    } else {
      sounds.playClick();
      alert("You need at least 1 Ruby Gem to execute a Royal Doubler!");
    }
  };

  return (
    <div id="gameover_screen" className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-40 animate-fade-in text-white overflow-y-auto">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-red-500/20 rounded-3xl p-6 text-center shadow-2xl space-y-6 relative">
        
        {/* Swazi Shield top shadow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 border-2 border-white px-4 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase font-black shadow-lg">
          RUN COMPLETED
        </div>

        {/* Highscore celebration */}
        {isHighscore ? (
          <div className="space-y-1 pt-4 text-center">
            <div className="flex items-center justify-center space-x-1.5 text-yellow-400 animate-bounce">
              <Sparkles size={20} className="fill-yellow-400" />
              <span className="text-sm font-black tracking-widest font-mono uppercase">NEW HIGH RECORD!</span>
              <Sparkles size={20} className="fill-yellow-400" />
            </div>
            <h1 className="text-4xl font-black text-yellow-400 tracking-tight drop-shadow">
              {score}
            </h1>
          </div>
        ) : (
          <div className="space-y-1 pt-4">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">FINAL SCORE</span>
            <h1 className="text-4xl font-black tracking-tight text-white">{score}</h1>
          </div>
        )}

        {/* Breakdown details bento style */}
        <div className="grid grid-cols-3 gap-2">
          {/* Distance */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono tracking-wider text-indigo-400 uppercase">DISTANCE</span>
            <span className="text-base font-black mt-1 font-sans">{distanceRun}m</span>
          </div>

          {/* Coins */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono tracking-wider text-amber-400 uppercase">COINS</span>
            <span className="text-base font-black mt-1 font-sans text-yellow-400">🪙 {coinsCollected * (coinedDoubled ? 2 : 1)}</span>
          </div>

          {/* Gems */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-red-400">
            <span className="text-[10px] font-mono tracking-wider text-red-400 uppercase">GEMS</span>
            <span className="text-base font-black mt-1 font-sans">💎 {gemsCollected}</span>
          </div>
        </div>

        {/* Royal Doubler Deal */}
        {!coinedDoubled && coinsCollected > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center space-y-2">
            <div className="text-xs font-semibold text-yellow-100 flex items-center space-x-1.5 justify-center">
              <span>👑 ROYAL COIN MULTIPLIER Deal!</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-normal">
              Spend <span className="text-red-400 font-bold">1 Ruby Gem</span> to permanently double collected gold coins on this run to{" "}
              <span className="text-yellow-400 font-bold">🪙 {coinsCollected * 2}</span>!
            </p>
            <button
              onClick={handleDoubleCoins}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow shadow-amber-500/10 cursor-pointer"
            >
              <span>PAY 1 GEM & DOUBLE</span>
              <span className="text-[10px] bg-slate-950/20 px-1 py-0.5 rounded text-slate-950 text-[9px] font-black">RUBY</span>
            </button>
          </div>
        )}

        {coinedDoubled && (
          <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-3 text-xs text-indigo-200 font-black tracking-widest uppercase flex items-center justify-center space-x-2 animate-pulse">
            <Sparkles size={14} className="fill-indigo-400 text-indigo-400" />
            <span>Gold Coins Doubled!</span>
            <Sparkles size={14} className="fill-indigo-400 text-indigo-400" />
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-2.5 pt-2">
          {/* Run again */}
          <button
            onClick={() => {
              sounds.playClick();
              onRestartRunning();
            }}
            className="w-full cursor-pointer bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 active:translate-y-0.5 transition-all w-full text-base uppercase"
          >
            <RotateCcw size={18} />
            <span>RUN AGAIN</span>
          </button>

          {/* Home */}
          <button
            onClick={() => {
              sounds.playClick();
              onQuitToMenu();
            }}
            className="w-full cursor-pointer bg-slate-800 hover:bg-slate-755 text-slate-200 border border-white/5 font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center space-x-2 active:translate-y-0.5 transition-all text-sm uppercase"
          >
            <Home size={15} />
            <span>EXIT TO SHELTER</span>
          </button>
        </div>

        {/* Fun quote */}
        <div className="text-[10px] font-mono text-slate-500 h-4">
          HighScore to Beat: <span className="text-slate-300 font-bold">{highScore}</span>
        </div>
      </div>
    </div>
  );
};
