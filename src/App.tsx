/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { 
  SaveState, 
  CharacterId, 
  LocationId, 
  PowerUpType, 
  Character, 
  LocationRegion, 
  Mission 
} from "./types";
import { 
  INITIAL_SAVE_STATE, 
  CHARACTERS_DATA, 
  LOCATIONS_DATA 
} from "./data";
import { sounds } from "./sounds";

// UI Screens
import { Splash } from "./components/Splash";
import { MainMenu } from "./components/MainMenu";
import { GameCanvas } from "./components/GameCanvas";
import { PauseMenu } from "./components/PauseMenu";
import { GameOver } from "./components/GameOver";
import { CharacterSelect } from "./components/CharacterSelect";
import { Shop } from "./components/Shop";
import { MissionsScreen } from "./components/MissionsScreen";
import { StatsScreen } from "./components/StatsScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { DeveloperModal } from "./components/DeveloperModal";

const LOCAL_STORAGE_KEY = "swazi_sprint_v2_save";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activePanel, setActivePanel] = useState<
    "menu" | "playing" | "character_select" | "shop" | "missions" | "stats" | "settings" | "loading"
  >("menu");

  const [saveState, setSaveState] = useState<SaveState>(INITIAL_SAVE_STATE);

  // View mode scaling
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  // Active game run states
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [coinsRun, setCoinsRun] = useState(0);
  const [gemsRun, setGemsRun] = useState(0);
  const [distanceRun, setDistanceRun] = useState(0);

  // Load progress on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge or validate to assure no runtime crashes with updates
        const merged: SaveState = {
          ...INITIAL_SAVE_STATE,
          ...parsed,
          stats: { ...INITIAL_SAVE_STATE.stats, ...parsed.stats },
          powerUpLevels: { ...INITIAL_SAVE_STATE.powerUpLevels, ...parsed.powerUpLevels },
          unlockedCharacters: parsed.unlockedCharacters || [CharacterId.Student],
          unlockedLocations: parsed.unlockedLocations || [LocationId.Mbabane],
        };
        setSaveState(merged);
        
        // Sync synthesizer settings
        sounds.setMute(!merged.audioEnabled);
        sounds.setMusicMute(!merged.musicEnabled);
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SAVE_STATE));
      }
    } catch (e) {
      console.error("Local storage error on load", e);
    }
  }, []);

  const saveToStorage = (newState: SaveState) => {
    try {
      setSaveState(newState);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error("Local storage error on write", e);
    }
  };

  const activeCharacter = CHARACTERS_DATA.find((c) => c.id === saveState.currentCharacter) || CHARACTERS_DATA[0];
  const activeLocation = LOCATIONS_DATA.find((l) => l.id === saveState.currentLocation) || LOCATIONS_DATA[0];

  // START RUNNER SPRINT ENGINE
  const handleStartGame = () => {
    setIsPaused(false);
    setIsGameOver(false);
    setCurrentScore(0);
    setCoinsRun(0);
    setGemsRun(0);
    setDistanceRun(0);
    
    // Switch to loading view
    setActivePanel("loading");
  };

  const handleLoadingComplete = () => {
    setActivePanel("playing");
    sounds.startMusic();
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.log("Iframe environment may block API fullscreen request, using CSS viewframe stretch", err);
          });
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };

  const handlePauseToggle = () => {
    sounds.playClick();
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        sounds.stopMusic();
      } else {
        sounds.startMusic();
      }
      return next;
    });
  };

  const handleRestartRunning = () => {
    sounds.playClick();
    handleStartGame();
  };

  const handleQuitToMenu = () => {
    sounds.playClick();
    sounds.stopMusic();
    setIsPaused(false);
    setIsGameOver(false);
    setActivePanel("menu");
  };

  // HANDLE RUN GAME OVER RESULTS
  const handleGameOverResult = (
    finalScore: number,
    coinsCollected: number,
    gemsCollected: number,
    distance: number
  ) => {
    // Stop backing tracking music loop
    sounds.stopMusic();
    
    setCurrentScore(finalScore);
    setCoinsRun(coinsCollected);
    setGemsRun(gemsCollected);
    setDistanceRun(distance);
    setIsGameOver(true);

    // Save running statistics to save wallet
    const updatedStats = { ...saveState.stats };
    updatedStats.runsPlayed += 1;
    updatedStats.totalDistance += distance;
    updatedStats.totalCoins += coinsCollected;
    updatedStats.totalGems += gemsCollected;
    updatedStats.highScore = Math.max(updatedStats.highScore, finalScore);
    
    // If the player ran Ezulwini or Rural, count cows/barriers added by Canvas
    // Let's increment those directly from performance logs:
    if (saveState.currentLocation === LocationId.Rural) {
      updatedStats.cowsDodged += Math.floor(distance / 125); // simple approximation based on distance
    } else {
      updatedStats.barriersSlid += Math.floor(distance / 90);
    }

    // Process and progress active Missions checklist
    const updatedMissions = saveState.activeMissions.map((mission) => {
      if (mission.claimed) return mission;
      let nextCurrent = mission.current;

      // Single run targets
      if (mission.type === "coins_single_run") {
        nextCurrent = Math.max(mission.current, coinsCollected);
      } else if (mission.type === "distance_single_run") {
        nextCurrent = Math.max(mission.current, distance);
      } 
      // Cumulative targets
      else if (mission.type === "total_coins") {
        nextCurrent = Math.min(mission.target, mission.current + coinsCollected);
      } else if (mission.type === "total_distance") {
        nextCurrent = Math.min(mission.target, mission.current + distance);
      } else if (mission.type === "jump_cows" && saveState.currentLocation === LocationId.Rural) {
        nextCurrent = Math.min(mission.target, mission.current + Math.floor(distance / 125));
      } else if (mission.type === "slide_under_barriers" && saveState.currentLocation !== LocationId.Rural) {
        nextCurrent = Math.min(mission.target, mission.current + Math.floor(distance / 90));
      }

      const completed = nextCurrent >= mission.target;
      return {
        ...mission,
        current: nextCurrent,
        completed,
      };
    });

    const isHighQ = saveState.isHighQuality;

    const updatedState: SaveState = {
      ...saveState,
      coins: saveState.coins + coinsCollected,
      gems: saveState.gems + gemsCollected,
      stats: updatedStats,
      activeMissions: updatedMissions,
    };

    saveToStorage(updatedState);
  };

  // AD OR MULTIPLIER ROYAL COIN MULTIPLIER DEAL
  const handleDoubleCoinsResult = (multiplier: number) => {
    // Deduct 1 gem
    if (saveState.gems >= 1) {
      const addedCoinsByMultiplier = coinsRun * (multiplier - 1);
      
      const updatedState: SaveState = {
        ...saveState,
        gems: saveState.gems - 1,
        coins: saveState.coins + addedCoinsByMultiplier, // add extra multiplied earnings
        stats: {
          ...saveState.stats,
          totalCoins: saveState.stats.totalCoins + addedCoinsByMultiplier,
        }
      };

      saveToStorage(updatedState);
      setCoinsRun((prev) => prev * multiplier);
    }
  };

  // UNLOCK CHARACTERS
  const handleUnlockCharacter = (
    charId: CharacterId,
    cost: number,
    currency: "coins" | "gems"
  ) => {
    const nextCoins = currency === "coins" ? saveState.coins - cost : saveState.coins;
    const nextGems = currency === "gems" ? saveState.gems - cost : saveState.gems;

    const updatedState: SaveState = {
      ...saveState,
      coins: nextCoins,
      gems: nextGems,
      unlockedCharacters: [...saveState.unlockedCharacters, charId],
      currentCharacter: charId, // Auto-equip newly unlocked hero
    };

    saveToStorage(updatedState);
  };

  const handleSelectCharacter = (charId: CharacterId) => {
    const updatedState: SaveState = {
      ...saveState,
      currentCharacter: charId,
    };
    saveToStorage(updatedState);
  };

  // UNLOCK REGIONS
  const handleUnlockLocation = (id: LocationId, cost: number) => {
    const updatedState: SaveState = {
      ...saveState,
      coins: saveState.coins - cost,
      unlockedLocations: [...saveState.unlockedLocations, id],
      currentLocation: id, // Switch default region
    };
    saveToStorage(updatedState);
  };

  const handleSelectRegion = (id: LocationId) => {
    const updatedState: SaveState = {
      ...saveState,
      currentLocation: id,
    };
    saveToStorage(updatedState);
  };

  // UPGRADE POWER UPS
  const handleUpgradePowerUp = (type: PowerUpType, cost: number) => {
    const currentLvl = saveState.powerUpLevels[type];
    
    const updatedLevels = {
      ...saveState.powerUpLevels,
      [type]: currentLvl + 1,
    };

    const updatedState: SaveState = {
      ...saveState,
      coins: saveState.coins - cost,
      powerUpLevels: updatedLevels,
    };

    saveToStorage(updatedState);
  };

  // TRADE COINS FOR RED RUBIES
  const handleTradeCoinsForGems = (coinCost: number, gemReward: number) => {
    const updatedState: SaveState = {
      ...saveState,
      coins: saveState.coins - coinCost,
      gems: saveState.gems + gemReward,
      stats: {
        ...saveState.stats,
        totalGems: saveState.stats.totalGems + gemReward,
      }
    };
    saveToStorage(updatedState);
  };

  // CLAIM ONCE AND ACCUMULATE REWARDS
  const handleClaimReward = (missionId: string, rewardCoins: number, rewardGems: number) => {
    const updatedMissions = saveState.activeMissions.map((m) => {
      if (m.id === missionId) {
        return { ...m, claimed: true };
      }
      return m;
    });

    const updatedState: SaveState = {
      ...saveState,
      coins: saveState.coins + rewardCoins,
      gems: saveState.gems + rewardGems,
      activeMissions: updatedMissions,
    };

    saveToStorage(updatedState);
  };

  // DAILY CHEST BOX CLAIM
  const handleClaimDailyReward = (rewardCoins: number, rewardGems: number) => {
    const updatedState: SaveState = {
      ...saveState,
      coins: saveState.coins + rewardCoins,
      gems: saveState.gems + rewardGems,
    };
    saveToStorage(updatedState);
  };

  // AUDIO/MUSIC TOGGLES
  const handleToggleAudio = () => {
    const next = !saveState.audioEnabled;
    const updatedState: SaveState = { ...saveState, audioEnabled: next };
    saveToStorage(updatedState);
    sounds.setMute(!next);
  };

  const handleToggleMusic = () => {
    const next = !saveState.musicEnabled;
    const updatedState: SaveState = { ...saveState, musicEnabled: next };
    saveToStorage(updatedState);
    sounds.setMusicMute(!next);
  };

  // QUALITY FLUID REFRESH TOGGLE (60FPS FOR MID-HIGH PHONES vs 30FPS CAPPED)
  const handleToggleQuality = () => {
    const next = !saveState.isHighQuality;
    const updatedState: SaveState = { ...saveState, isHighQuality: next };
    saveToStorage(updatedState);
  };

  // SYSTEM TOTAL PURGE WIPE DATA
  const handleResetProgress = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setSaveState(INITIAL_SAVE_STATE);
    // Hard resetting synthesizers
    sounds.setMute(false);
    sounds.setMusicMute(false);
    sounds.playUpgrade();
    alert("System database reboot completed successfully! Enjoy your fresh school ride!");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row items-center justify-center font-sans p-2">
      
      {/* MOBILE DEVICE FRAME WRAPPER */}
      {/* Centered responsive viewport makes it look gorgeous. If isFullscreen is active, we expand to full screen. */}
      <div 
        id="phone_viewframe" 
        className={`relative overflow-hidden bg-slate-950 flex flex-col transition-all duration-300 ${
          isFullscreen 
            ? "w-full h-screen md:h-screen md:w-full md:rounded-none md:border-0" 
            : "w-full h-screen md:h-[820px] md:w-[410px] md:rounded-[40px] md:border-[12px] md:border-slate-950 md:shadow-[0_24px_60px_rgba(0,0,0,0.85)]"
        }`}
      >
        {/* Dynamic Notch Detail - hidden during fullscreen */}
        {!isFullscreen && (
          <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-50 pointer-events-none" />
        )}

        {/* 1. SPLASH INTRO */}
        {showSplash ? (
          <Splash onDismiss={() => setShowSplash(false)} />
        ) : (
          <div className="relative flex-1 flex flex-col h-full w-full">
            
            {/* 2. DYNAMIC MAIN MENU HUB */}
            {activePanel === "menu" && (
              <MainMenu
                saveState={saveState}
                activeCharacter={activeCharacter}
                onOpenCharacterSelect={() => setActivePanel("character_select")}
                onOpenShop={() => setActivePanel("shop")}
                onOpenMissions={() => setActivePanel("missions")}
                onOpenStats={() => setActivePanel("stats")}
                onOpenSettings={() => setActivePanel("settings")}
                onSelectRegion={handleSelectRegion}
                onStartGame={handleStartGame}
                onClaimDailyReward={handleClaimDailyReward}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
                onOpenDevModal={() => {
                  sounds.playClick();
                  setIsDevModalOpen(true);
                }}
              />
            )}

            {/* 2.5 DYNAMIC 5-SECOND LOADING OVERLAY SPRINT ROADWAY */}
            {activePanel === "loading" && (
              <LoadingScreen
                locationName={activeLocation.name}
                onComplete={handleLoadingComplete}
              />
            )}

            {/* 3. ACTIVE RUN PLAYING CANVAS */}
            {activePanel === "playing" && (
              <div className="relative flex-grow h-full w-full">
                <GameCanvas
                  location={activeLocation}
                  character={activeCharacter}
                  saveState={saveState}
                  isPaused={isPaused}
                  isGameOver={isGameOver}
                  onGameOver={handleGameOverResult}
                  onPauseToggle={handlePauseToggle}
                  gameSpeedMultiplier={saveState.isHighQuality ? 1.0 : 0.65} // adjust speed scaling based on performance capped mode
                />

                {/* ESC PAUSE & FULL SCREEN TOGGLES DURING GAMEPLAY */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-35 bg-black/45 backdrop-blur-md rounded-full p-1 border border-white/10 shadow pointer-events-auto">
                  <button
                    onClick={handlePauseToggle}
                    id="ingame_pause_btn"
                    className="bg-slate-900 border border-white/5 text-white rounded-full px-4 py-1.5 hover:bg-slate-800 text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    ⏸ PAUSE
                  </button>
                  <button
                    onClick={handleToggleFullscreen}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-3.5 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    {isFullscreen ? "📱 BOX" : "🖥️ FULL"}
                  </button>
                </div>

                {/* PAUSE OVERLAY MODAL */}
                {isPaused && (
                  <PauseMenu
                    onKeepPlaying={handlePauseToggle}
                    onRestartRunning={handleRestartRunning}
                    onQuitToMenu={handleQuitToMenu}
                    audioMuted={!saveState.audioEnabled}
                    onToggleAudio={handleToggleAudio}
                    musicMuted={!saveState.musicEnabled}
                    onToggleMusic={handleToggleMusic}
                    currentScore={currentScore}
                  />
                )}

                {/* GAME OVER SCORE SCOREBOARD */}
                {isGameOver && (
                  <GameOver
                    score={currentScore}
                    coinsCollected={coinsRun}
                    gemsCollected={gemsRun}
                    distanceRun={distanceRun}
                    highScore={saveState.stats.highScore}
                    onRestartRunning={handleRestartRunning}
                    onQuitToMenu={handleQuitToMenu}
                    onDoubleCoins={handleDoubleCoinsResult}
                    gemBalance={saveState.gems}
                  />
                )}
              </div>
            )}

            {/* 4. CHARACTER SELECT MENU SCREEN */}
            {activePanel === "character_select" && (
              <CharacterSelect
                saveState={saveState}
                onSelectCharacter={handleSelectCharacter}
                onUnlockCharacter={handleUnlockCharacter}
                onBack={() => setActivePanel("menu")}
              />
            )}

            {/* 5. SHOP SCREEN */}
            {activePanel === "shop" && (
              <Shop
                saveState={saveState}
                onUpgradePowerUp={handleUpgradePowerUp}
                onUnlockLocation={handleUnlockLocation}
                onTradeCoinsForGems={handleTradeCoinsForGems}
                onBack={() => setActivePanel("menu")}
              />
            )}

            {/* 6. CHALLENGES CHECKLIST PANEL */}
            {activePanel === "missions" && (
              <MissionsScreen
                saveState={saveState}
                onClaimReward={handleClaimReward}
                onBack={() => setActivePanel("menu")}
              />
            )}

            {/* 7. PERFORMANCE AND TROPHY BADGES GALLERY */}
            {activePanel === "stats" && (
              <StatsScreen
                saveState={saveState}
                onBack={() => setActivePanel("menu")}
              />
            )}

            {/* 8. OPTIONS ADJUSTMENT SYSTEM SETUP */}
            {activePanel === "settings" && (
              <SettingsScreen
                audioEnabled={saveState.audioEnabled}
                onToggleAudio={handleToggleAudio}
                musicEnabled={saveState.musicEnabled}
                onToggleMusic={handleToggleMusic}
                isHighQuality={saveState.isHighQuality}
                onToggleQuality={handleToggleQuality}
                onResetProgress={handleResetProgress}
                onBack={() => setActivePanel("menu")}
              />
            )}
          </div>
        )}
      </div>

      {/* Aesthetic instructions watermark shown only on Desktop screens alongside the phone frame */}
      <div className="hidden xl:flex flex-col space-y-4 absolute left-12 max-w-xs text-slate-500 text-sm select-none">
        <div>
          <h3 className="font-extrabold text-amber-500 uppercase tracking-widest text-xs flex items-center space-x-1.5">
            <span>🇸🇿 Swazi Sprint</span>
            <span className="bg-red-500 text-white text-[8px] px-1 rounded animate-pulse">LIVE</span>
          </h3>
          <p className="text-xs leading-relaxed mt-1">
            Experience Eswatini's rich settings inside an immersive mobile endless runner built for fluid 60FPS precision!
          </p>
        </div>

        <div className="border-t border-white/5 pt-3 space-y-2">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400">DESKTOP CONTROLS:</h4>
          <ul className="text-xs space-y-1 font-mono text-slate-400">
            <li>• A / D / ◀ / ▶ : Change Lanes</li>
            <li>• W / Space / ▲ : Jump Over Cows</li>
            <li>• S / ▼ : Slide Barricades</li>
            <li>• ESC : Pause running</li>
          </ul>
        </div>

        <div className="border-t border-white/5 pt-3 space-y-2">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400">DISPLAY VIEW MODE:</h4>
          <button
            onClick={handleToggleFullscreen}
            className="w-full text-left py-2 px-3 bg-slate-900 border border-white/10 hover:border-yellow-500/20 text-yellow-400 hover:text-yellow-300 font-bold font-mono text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>{isFullscreen ? "📱 MOBILE PREVIEW" : "🖥️ CINEMATIC FULLSCREEN"}</span>
            <span className="text-[9px] bg-yellow-400/10 px-1.5 py-0.5 rounded text-yellow-400 uppercase font-medium">
              {isFullscreen ? "Full" : "Boxed"}
            </span>
          </button>
        </div>

        <div className="border-t border-white/5 pt-3 space-y-2">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400">THE CREATOR:</h4>
          <button
            onClick={() => {
              sounds.playClick();
              setIsDevModalOpen(true);
            }}
            className="w-full text-left py-2 px-3 bg-[#6366f1]/10 border border-[#6366f1]/30 hover:border-[#6366f1]/60 text-indigo-300 font-bold text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>🇸🇿 Meet Bandzile Kunene</span>
          </button>
        </div>
      </div>

      {/* Developer Profile Modal Overlay */}
      <DeveloperModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />
    </div>
  );
}
