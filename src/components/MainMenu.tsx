import React, { useEffect, useRef, useState } from "react";
import { Play, Sparkles, User, ShoppingBag, Award, Settings, Gift } from "lucide-react";
import { Character, LocationRegion, SaveState, LocationId } from "../types";
import { sounds } from "../sounds";
import { drawCharacter } from "../utils/characterDrawer";
import { LOCATIONS_DATA } from "../data";

interface MainMenuProps {
  saveState: SaveState;
  activeCharacter: Character;
  onOpenCharacterSelect: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onSelectRegion: (id: LocationId) => void;
  onStartGame: () => void;
  onClaimDailyReward: (coins: number, gems: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenDevModal: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveState,
  activeCharacter,
  onOpenCharacterSelect,
  onOpenShop,
  onOpenMissions,
  onOpenStats,
  onOpenSettings,
  onSelectRegion,
  onStartGame,
  onClaimDailyReward,
  isFullscreen,
  onToggleFullscreen,
  onOpenDevModal,
}) => {
  const showcaseCanvasRef = useRef<HTMLCanvasElement>(null);
  const [chestTimeRemaining, setChestTimeRemaining] = useState(0); // 0 is claimable
  const [showChestClaimedModal, setShowChestClaimedModal] = useState(false);

  // Filter only unlocked locations
  const unlockedRegionIds = saveState.unlockedLocations;
  const availableRegions = LOCATIONS_DATA.filter((r) => unlockedRegionIds.includes(r.id));
  const activeRegion = LOCATIONS_DATA.find((r) => r.id === saveState.currentLocation) || LOCATIONS_DATA[0];

  // Animated rotating runner showcase loop
  useEffect(() => {
    let animId: number;
    let time = 0;

    const canvas = showcaseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      time += 0.016; // delta estimation
      const w = canvas.width = 150;
      const h = canvas.height = 140;

      ctx.clearRect(0, 0, w, h);

      // Draw active player character running on spot
      drawCharacter(
        ctx,
        w / 2,
        h * 0.72,
        2.2, // scale
        activeCharacter.id,
        "run",
        time * 3.5, // speed cadence
        activeCharacter.color,
        activeCharacter.secondColor
      );

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeCharacter]);

  // Handle periodic timer for a simple Simulated "Daily Chest" (claimable every 15 seconds for testers!)
  useEffect(() => {
    const timer = setInterval(() => {
      setChestTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClaimChest = () => {
    if (chestTimeRemaining > 0) return;
    sounds.playUpgrade();
    onClaimDailyReward(30, 2); // reward 30 coins, 2 gems!
    setShowChestClaimedModal(true);
    setChestTimeRemaining(18); // cool down of 18 seconds for tests
  };

  const handlePlayClick = () => {
    sounds.playClick();
    sounds.playPowerUp();
    onStartGame();
  };

  const handleRegionChange = (dir: number) => {
    sounds.playClick();
    const currentIdx = availableRegions.findIndex((r) => r.id === saveState.currentLocation);
    let nextIdx = currentIdx + dir;
    if (nextIdx < 0) nextIdx = availableRegions.length - 1;
    if (nextIdx >= availableRegions.length) nextIdx = 0;
    
    onSelectRegion(availableRegions[nextIdx].id);
  };

  return (
    <div id="main_menu_screen" className="absolute inset-0 bg-slate-950 flex flex-col justify-between p-5 text-white select-none animate-fade-in overflow-y-auto">
      
      {/* 1. TOP HEADER STATUS ROW */}
      <div className="flex items-center justify-between pt-1">
        {/* Profile details */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-500 to-rose-500 flex items-center justify-center font-bold text-xs text-slate-950 shadow-md">
            PB
          </div>
          <div className="leading-tight">
            <h4 className="text-[10px] font-mono tracking-widest text-[#94a3b8] uppercase">YOUR HIGH</h4>
            <div className="text-sm font-black font-mono text-yellow-400">🏅 {saveState.stats.highScore}</div>
          </div>
        </div>

        {/* Currency balances */}
        <div className="flex items-center space-x-2">
          {/* Coins tag */}
          <div className="bg-slate-900 border border-white/5 py-1 px-2.5 rounded-full flex items-center space-x-1.5 shadow">
            <span className="text-[11px]">🪙</span>
            <span className="text-xs font-bold font-mono text-yellow-400">{saveState.coins}</span>
          </div>

          {/* Gems tag */}
          <div className="bg-slate-900 border border-white/5 py-1 px-2.5 rounded-full flex items-center space-x-1.5 shadow">
            <span className="text-[11px]">💎</span>
            <span className="text-xs font-bold font-mono text-red-400">{saveState.gems}</span>
          </div>
        </div>
      </div>

      {/* 2. CHARACTER INTERACTIVE SHOWCASE SCREEN */}
      <div className="flex-1 flex flex-col items-center justify-center text-center py-4 relative">
        
        {/* Background circular halo */}
        <div className="absolute w-44 h-44 rounded-full bg-indigo-500/10 blur-2xl -z-10 animate-pulse" />

        {/* Small tribal label */}
        <span className="text-[9px] font-mono tracking-widest text-yellow-500 uppercase px-2 py-0.5 rounded border border-yellow-500/20 bg-yellow-500/5 mb-1.5">
          {activeCharacter.role}
        </span>

        {/* The active runner rotating on canvas */}
        <canvas
          ref={showcaseCanvasRef}
          className="block h-[140px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform"
        />

        {/* Character Title */}
        <div className="space-y-0.5">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center justify-center space-x-1">
            <span>{activeCharacter.name}</span>
            <Sparkles size={14} className="text-yellow-400 fill-yellow-400" />
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5 max-w-[240px] leading-relaxed mx-auto">
            {activeCharacter.description}
          </p>
        </div>

        {/* Swap button */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenCharacterSelect();
          }}
          className="mt-3 text-[10px] cursor-pointer font-mono font-black tracking-widest text-yellow-400 hover:text-yellow-300 uppercase px-4 py-1 rounded-full bg-slate-900/50 border border-yellow-400/20 active:bg-slate-800 transition-colors"
        >
          SWAP CHARACTER
        </button>
      </div>

      {/* 3. MULTI-REGION LOCATIONS CAROUSEL SELECTOR */}
      <div className="bg-slate-900/40 border border-white/5 p-3 rounded-2xl space-y-2 text-center relative max-w-sm mx-auto w-full my-1">
        <span className="text-[8px] font-mono tracking-widest text-indigo-400 uppercase">ACTIVE ADVENTURE ZONE</span>
        
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleRegionChange(-1)}
            className="p-1 px-2.5 text-xs font-black text-slate-500 hover:text-white cursor-pointer bg-slate-950 rounded-lg"
          >
            ◀
          </button>
          
          <div className="text-center">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wide">
              {activeRegion.name}
            </h4>
            <p className="text-[9px] text-slate-400 mt-0.5">
              Difficulty: <span className="text-indigo-400 font-bold">x{activeRegion.difficultyMultiplier.toFixed(1)} score</span>
            </p>
          </div>

          <button
            onClick={() => handleRegionChange(1)}
            className="p-1 px-2.5 text-xs font-black text-slate-500 hover:text-white cursor-pointer bg-slate-950 rounded-lg"
          >
            ▶
          </button>
        </div>

        {unlockedRegionIds.length < LOCATIONS_DATA.length && (
          <p className="text-[8px] text-slate-500 uppercase font-mono">
            {LOCATIONS_DATA.length - unlockedRegionIds.length} regions left to purchase in Store !
          </p>
        )}
      </div>

      {/* 4. ACTIONS INTERACTIVE NAVIGATION RAIL */}
      <div className="flex flex-col space-y-3.5 max-w-sm mx-auto w-full pt-2">
        
        {/* Play button */}
        <button
          onClick={handlePlayClick}
          className="w-full cursor-pointer bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-600 hover:from-emerald-300 hover:via-teal-400 hover:to-indigo-500 text-white font-black text-lg py-4 px-6 rounded-2xl shadow-[0_8px_24px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.5)] transition-all transform active:translate-y-0.5 flex items-center justify-center space-x-3 group relative overflow-hidden"
        >
          {/* subtle white shining line slider */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <Play size={20} className="fill-white stroke-white group-hover:scale-110 transition-transform" />
          <span className="tracking-wider uppercase">START ALIVE SPRINT</span>
        </button>

        {/* Cinematic Widescreen & Developer interactive buttons row */}
        <div className="grid grid-cols-2 gap-2">
          {/* View Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              onToggleFullscreen();
            }}
            className="cursor-pointer py-2 px-3 rounded-xl border border-white/5 bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center space-x-1.5 text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider"
          >
            <span>{isFullscreen ? "📱 MOBILE SIZE" : "🖥️ WIDESCREEN"}</span>
          </button>

          {/* Dev portfolio button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenDevModal();
            }}
            className="cursor-pointer py-2 px-3 rounded-xl border border-yellow-500/15 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 text-[#facc15] hover:from-yellow-500/10 hover:to-amber-500/10 transition-all flex items-center justify-center space-x-1.5 text-[10px] font-black uppercase tracking-wider"
          >
            <span>👨‍💻 THE CREATOR</span>
          </button>
        </div>

        {/* Shortcuts grid */}
        <div className="grid grid-cols-5 gap-1.5 pb-2">
          {/* Shop */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenShop();
            }}
            className="bg-slate-900 border border-white/5 text-slate-300 hover:text-white p-3 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-colors cursor-pointer"
          >
            <ShoppingBag size={15} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wide">Shop</span>
          </button>

          {/* Missions */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenMissions();
            }}
            className="bg-slate-900 border border-white/5 text-slate-300 hover:text-white p-3 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-colors cursor-pointer"
          >
            <Award size={15} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wide">Tasks</span>
          </button>

          {/* Stats */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenStats();
            }}
            className="bg-slate-900 border border-white/5 text-slate-300 hover:text-white p-3 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-colors cursor-pointer"
          >
            <Sparkles size={15} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wide font-normal">Awards</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenSettings();
            }}
            className="bg-slate-900 border border-white/5 text-slate-300 hover:text-white p-3 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-colors cursor-pointer"
          >
            <Settings size={15} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wide">Setup</span>
          </button>

          {/* Daily standard chest box claim */}
          <button
            onClick={handleClaimChest}
            disabled={chestTimeRemaining > 0}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer select-none ${
              chestTimeRemaining > 0
                ? "bg-slate-950 border-slate-900 text-slate-600 pointer-events-none"
                : "bg-[#7c3aed] border-purple-500/20 text-white animate-pulse shadow-md shadow-purple-500/15"
            }`}
          >
            <Gift size={15} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wide leading-none">
              {chestTimeRemaining > 0 ? `${chestTimeRemaining}s` : "FREE"}
            </span>
          </button>
        </div>
      </div>

      {/* 5. GEMS MODAL REACTION CHEST COMPLETED */}
      {showChestClaimedModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-yellow-500/20 rounded-3xl p-6 text-center max-w-xs space-y-4">
            <span className="text-3xl animate-bounce block">🎁</span>
            <h3 className="text-lg font-black uppercase text-yellow-400">CHEST GEMS UNLOCKED!</h3>
            <p className="text-[11px] text-slate-300 leading-normal">
              You cracked open the standard King Chest box! Payout added to your offline profile wallet:
            </p>
            <div className="flex items-center justify-center space-x-3.5 text-sm font-bold font-mono">
              <span className="text-yellow-400">🪙 +30 Coins</span>
              <span className="text-red-400">💎 +2 Ruby Gems</span>
            </div>
            <button
              onClick={() => {
                sounds.playUpgrade();
                setShowChestClaimedModal(false);
              }}
              className="px-6 py-2 cursor-pointer bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs rounded-xl"
            >
              COLLECT PRIZES
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
