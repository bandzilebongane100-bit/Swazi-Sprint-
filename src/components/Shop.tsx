import React, { useState } from "react";
import { ArrowLeft, ArrowUp, Lock, Sparkles, Map } from "lucide-react";
import { PowerUpType, LocationId, SaveState, PowerUpUpgrade, LocationRegion } from "../types";
import { POWERUPS_DATA, LOCATIONS_DATA } from "../data";
import { sounds } from "../sounds";

interface ShopProps {
  saveState: SaveState;
  onUpgradePowerUp: (type: PowerUpType, cost: number) => void;
  onUnlockLocation: (id: LocationId, cost: number) => void;
  onTradeCoinsForGems: (coinCost: number, gemReward: number) => void;
  onBack: () => void;
}

export const Shop: React.FC<ShopProps> = ({
  saveState,
  onUpgradePowerUp,
  onUnlockLocation,
  onTradeCoinsForGems,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"powerups" | "regions" | "gems">("powerups");

  // Power ups upgrades list mapping
  const currentLevels = saveState.powerUpLevels;
  const powerUpsUpgrades: PowerUpUpgrade[] = POWERUPS_DATA.map((up) => {
    const currentLvl = currentLevels[up.type];
    const isMax = currentLvl >= up.maxLevel;
    // Costs correspond to indices [0: level 1 to level 2 cost, 1: level 2 to level 3 etc.]
    // level index is currently: currentLvl
    const nextCost = isMax ? 0 : up.upgradeCost[currentLvl];

    return {
      ...up,
      level: currentLvl,
      upgradeCost: up.upgradeCost, // just retain raw
      // custom metadata
      nextCost,
    } as any;
  });

  // Regions lists mapping
  const unlockedRegions = saveState.unlockedLocations;
  const locationsList: LocationRegion[] = LOCATIONS_DATA.map((loc) => ({
    ...loc,
    unlocked: unlockedRegions.includes(loc.id),
  }));

  const handlePowerUpUpgradeClick = (power: any) => {
    if (power.level >= power.maxLevel) return;
    if (saveState.coins >= power.nextCost) {
      sounds.playUpgrade();
      onUpgradePowerUp(power.type, power.nextCost);
    } else {
      sounds.playClick();
      alert(`You need ${power.nextCost} coins to upgrade ${power.name}!`);
    }
  };

  const handleUnlockLocationClick = (loc: LocationRegion) => {
    if (loc.unlocked) return;
    if (saveState.coins >= loc.costToUnlock) {
      sounds.playUpgrade();
      onUnlockLocation(loc.id, loc.costToUnlock);
    } else {
      sounds.playClick();
      alert(`You do not have enough coins to unlock the beautiful slopes of ${loc.name}! Needs 🪙 ${loc.costToUnlock}.`);
    }
  };

  const handleSimulateGemTrade = (coinCost: number, gemReward: number) => {
    if (saveState.coins >= coinCost) {
      sounds.playUpgrade();
      onTradeCoinsForGems(coinCost, gemReward);
    } else {
      sounds.playClick();
      alert(`You do not have ${coinCost} gold coins to purchase Ruby Gems!`);
    }
  };

  return (
    <div id="shop_screen" className="absolute inset-0 bg-slate-950 flex flex-col p-5 text-white z-20 animate-fade-in select-none">
      {/* Header bar */}
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
          <span>ROYAL STORE</span>
        </h2>
        {/* Balance tracking indicators */}
        <div className="flex items-center space-x-2">
          <div className="text-xs bg-slate-900 px-2.5 py-1 rounded-full border border-yellow-500/10 text-yellow-500 font-mono font-bold">
            🪙 {saveState.coins}
          </div>
          <div className="text-xs bg-slate-900 px-2.5 py-1 rounded-full border border-red-500/10 text-red-400 font-mono font-bold">
            💎 {saveState.gems}
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="grid grid-cols-3 gap-1.5 my-4 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab("powerups");
          }}
          className={`py-2 px-1 text-center cursor-pointer text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            activeTab === "powerups" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
          }`}
        >
          ⚡ UPGRADES
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab("regions");
          }}
          className={`py-2 px-1 text-center cursor-pointer text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            activeTab === "regions" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
          }`}
        >
          🌍 LOCATIONS
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab("gems");
          }}
          className={`py-2 px-1 text-center cursor-pointer text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            activeTab === "gems" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
          }`}
        >
          💎 RUBIES
        </button>
      </div>

      {/* Main product display listing content area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        
        {/* TAB 1: POWER UPS UPGRADES */}
        {activeTab === "powerups" && (
          <div className="space-y-3">
            {powerUpsUpgrades.map((power: any) => {
              const isMax = power.level >= power.maxLevel;
              let powerupEmoji = "🛡️";
              if (power.type === PowerUpType.Magnet) powerupEmoji = "🧲";
              if (power.type === PowerUpType.DoubleCoins) powerupEmoji = "🪙";
              if (power.type === PowerUpType.SpeedBoost) powerupEmoji = "⚡";
              if (power.type === PowerUpType.SuperJump) powerupEmoji = "👟";

              return (
                <div key={power.type} className="p-3.5 bg-slate-900/80 border border-white/5 rounded-2xl flex items-center space-x-3.5">
                  {/* Emoji display */}
                  <div className="w-11 h-11 bg-slate-950/80 rounded-xl font-sans flex items-center justify-center text-xl shadow">
                    {powerupEmoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs truncate uppercase tracking-wide">{power.name}</h4>
                      <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        {isMax ? "MAXED" : `LVL ${power.level}/${power.maxLevel}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{power.description}</p>

                    {/* Progress bars showing the current upgrade tier */}
                    <div className="flex items-center space-x-1 mt-2">
                      {[...Array(power.maxLevel)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i < power.level ? "bg-amber-500" : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>

                    {!isMax && (
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
                        <span className="text-[9px] font-mono text-slate-500">Duration: +2s boost</span>
                        <button
                          onClick={() => handlePowerUpUpgradeClick(power)}
                          className="px-3.5 py-1.5 bg-indigo-600 text-white font-extrabold text-[10px] rounded-xl flex items-center space-x-1 curser-pointer hover:bg-indigo-500 transition-colors shadow shadow-indigo-600/10 cursor-pointer"
                        >
                          <ArrowUp size={10} />
                          <span>UPGRADE: 🪙 {power.nextCost}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: LOCATIONS / REGIONS UNLOCKS */}
        {activeTab === "regions" && (
          <div className="space-y-3">
            {locationsList.map((loc) => {
              const isCurrent = saveState.currentLocation === loc.id;
              
              return (
                <div
                  key={loc.id}
                  className={`p-4 border rounded-2xl relative overflow-hidden flex flex-col justify-between ${
                    loc.unlocked
                      ? isCurrent
                        ? "bg-indigo-950/20 border-yellow-500/40"
                        : "bg-slate-900 border-white/5"
                      : "bg-slate-950/60 border-slate-900 opacity-80"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-sm">{loc.name}</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed pr-8">{loc.description}</p>
                    </div>

                    <div className="shrink-0 p-2.5 bg-slate-950/80 rounded-xl">
                      <Map size={18} className={loc.unlocked ? "text-amber-500" : "text-slate-500"} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-white/5">
                    {loc.unlocked ? (
                      <div className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 rounded-full flex items-center space-x-1">
                        <Sparkles size={10} />
                        <span>UNLOCKED ACTIVE</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-1 font-mono text-xs text-slate-400">
                          <Lock size={12} />
                          <span>LOCKED</span>
                        </div>

                        <button
                          onClick={() => handleUnlockLocationClick(loc)}
                          className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center space-x-1 cursor-pointer"
                        >
                          <span>ACTIVATE:</span>
                          <span className="font-mono">🪙 {loc.costToUnlock}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: GEMS EXCHANGER */}
        {activeTab === "gems" && (
          <div className="space-y-3.5">
            <div className="bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 p-4 rounded-2xl text-center space-y-1.5">
              <span className="text-xl">💎</span>
              <h4 className="font-bold text-xs uppercase tracking-widest text-red-400">Local Rubies Exchange</h4>
              <p className="text-[10px] text-slate-300 leading-normal max-w-xs mx-auto">
                No real payments needed! Simply trade the gold coins you collect in-game to secure royal ruby gems and unlock rare characters.
              </p>
            </div>

            <div className="space-y-2">
              {/* Deal 1 */}
              <div className="p-3.5 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs">Small Gem Pack</h5>
                  <p className="text-[10px] text-red-400 font-mono">💎 +5 ruby gems</p>
                </div>
                <button
                  onClick={() => handleSimulateGemTrade(150, 5)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-yellow-500/30 font-bold text-xs text-yellow-400 rounded-xl cursor-pointer"
                >
                  TRADE: 🪙 150
                </button>
              </div>

              {/* Deal 2 */}
              <div className="p-3.5 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs">Mega Mountain Purse</h5>
                  <p className="text-[10px] text-red-400 font-mono">💎 +12 ruby gems</p>
                </div>
                <button
                  onClick={() => handleSimulateGemTrade(300, 12)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-yellow-500/30 font-bold text-xs text-yellow-400 rounded-xl cursor-pointer"
                >
                  TRADE: 🪙 300
                </button>
              </div>

              {/* Deal 3 */}
              <div className="p-3.5 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs">Royal Shield Treasures</h5>
                  <p className="text-[10px] text-red-400 font-mono">💎 +30 ruby gems</p>
                </div>
                <button
                  onClick={() => handleSimulateGemTrade(650, 30)}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                >
                  TRADE: 🪙 650
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] text-center text-slate-500 font-mono mt-3">
        Purchasing items permanently updates your offline mobile save files.
      </div>
    </div>
  );
};
