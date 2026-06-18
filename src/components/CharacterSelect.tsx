import React from "react";
import { ArrowLeft, Check, Lock, User, Zap } from "lucide-react";
import { Character, CharacterId, SaveState } from "../types";
import { CHARACTERS_DATA } from "../data";
import { sounds } from "../sounds";

interface CharacterSelectProps {
  saveState: SaveState;
  onSelectCharacter: (charId: CharacterId) => void;
  onUnlockCharacter: (charId: CharacterId, cost: number, currency: "coins" | "gems") => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  saveState,
  onSelectCharacter,
  onUnlockCharacter,
  onBack,
}) => {
  const currentId = saveState.currentCharacter;
  const unlockedIds = saveState.unlockedCharacters;

  // Let's generate a list of characters with correct lock states
  const charactersList: Character[] = CHARACTERS_DATA.map((char) => ({
    ...char,
    unlocked: unlockedIds.includes(char.id),
  }));

  const handleCharClick = (char: Character) => {
    sounds.playClick();
    if (char.unlocked) {
      onSelectCharacter(char.id);
    }
  };

  const handleUnlock = (char: Character) => {
    if (char.unlocked) return;
    const balance = char.currency === "coins" ? saveState.coins : saveState.gems;
    if (balance >= char.cost) {
      sounds.playUpgrade();
      onUnlockCharacter(char.id, char.cost, char.currency);
    } else {
      sounds.playClick();
      alert(`You do not have enough ${char.currency} to unlock ${char.name}. Go out and collect more in Mbabane or Ezulwini!`);
    }
  };

  return (
    <div id="character_select_screen" className="absolute inset-0 bg-slate-950 flex flex-col p-5 text-white z-20 animate-fade-in select-none">
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
          <span>RUNNER ROSTER</span>
        </h2>
        {/* Balance trackers */}
        <div className="flex items-center space-x-2">
          <div className="text-xs bg-slate-900 px-2.5 py-1 rounded-full border border-yellow-500/10 text-yellow-500 font-mono font-bold">
            🪙 {saveState.coins}
          </div>
          <div className="text-xs bg-slate-900 px-2.5 py-1 rounded-full border border-red-500/10 text-red-400 font-mono font-bold">
            💎 {saveState.gems}
          </div>
        </div>
      </div>

      {/* Roster Grid */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
        {charactersList.map((char) => {
          const isSelected = char.id === currentId;
          const isUnlocked = char.unlocked;

          return (
            <div
              key={char.id}
              onClick={() => handleCharClick(char)}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden cursor-pointer ${
                isSelected
                  ? "bg-slate-900 border-yellow-500 shadow-md shadow-yellow-500/10"
                  : isUnlocked
                  ? "bg-slate-900/60 border-white/5 hover:border-white/10"
                  : "bg-slate-950/80 border-slate-900 opacity-80"
              }`}
            >
              {/* Dynamic colored accent light */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl opacity-10 pointer-events-none"
                style={{ backgroundColor: char.color }}
              />

              <div className="flex items-start space-x-4">
                {/* Visual Avatar representative badge */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center relative shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${char.color}, ${char.secondColor})`,
                  }}
                >
                  <User size={26} className="text-slate-950" />
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                      <Lock size={16} className="text-yellow-400" />
                    </div>
                  )}
                </div>

                {/* Character Name & Role details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black truncate">{char.name}</h3>
                    {isUnlocked ? (
                      isSelected ? (
                        <span className="text-[9px] uppercase font-bold text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded-full bg-yellow-500/5">
                          ACTIVE RUNNER
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase font-bold text-slate-400">
                          TAP TO SELECT
                        </span>
                      )
                    ) : null}
                  </div>
                  <span className="text-xs text-yellow-400/80 font-semibold">{char.role}</span>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">{char.description}</p>

                  {/* Stats bars */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {/* Speed bar */}
                    <div className="flex items-center space-x-1.5">
                      <Zap size={10} className="text-amber-500 fill-amber-500" />
                      <div className="flex-1">
                        <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                          <span>Speed</span>
                          <span>{char.stats.speed}/5</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full mt-0.5 overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${(char.stats.speed / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Agility bar */}
                    <div className="flex items-center space-x-1.5">
                      <Zap size={10} className="text-emerald-500 fill-emerald-500" />
                      <div className="flex-1">
                        <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                          <span>Agility</span>
                          <span>{char.stats.agility}/5</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full mt-0.5 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${(char.stats.agility / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Unlock button overlay if locked */}
                  {!isUnlocked && (
                    <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">REQUIREMENT :</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlock(char);
                        }}
                        className="px-3.5 py-1.5 bg-yellow-500 text-slate-950 hover:bg-yellow-400 text-xs font-black rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-lg active:scale-95 transition-transform"
                      >
                        <span>UNLOCK FOR</span>
                        <span className="font-mono">
                          {char.currency === "coins" ? "🪙" : "💎"} {char.cost}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-center text-slate-500 font-mono mt-2">
        Unlock elite dancers and school heroes of the Kingdom of Eswatini!
      </div>
    </div>
  );
};
