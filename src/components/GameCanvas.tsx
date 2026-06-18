import React, { useEffect, useRef, useState } from "react";
import { LocationRegion, Character, PowerUpType, SaveState } from "../types";
import { sounds } from "../sounds";
import { drawCharacter } from "../utils/characterDrawer";

interface GameCanvasProps {
  location: LocationRegion;
  character: Character;
  saveState: SaveState;
  isPaused: boolean;
  isGameOver: boolean;
  onGameOver: (score: number, coinsCollected: number, gemsCollected: number, distanceRun: number) => void;
  onPauseToggle: () => void;
  gameSpeedMultiplier: number;
}

interface Obstacle {
  id: number;
  z: number; // 0.0 (near player) to 1.1 (horizon)
  lane: number; // -1 (left), 0 (center), 1 (right)
  type: "barricade" | "barrier_low" | "taxi" | "cow" | "market_umbrella" | "waterfall_rock";
  width: number; // covers how many lanes
  height: number; // vertical clearance height
  passed: boolean;
}

interface Collectible {
  id: number;
  z: number;
  lane: number;
  type: "coin" | "gem" | PowerUpType;
  collected: boolean;
  bounceOffset: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  location,
  character,
  saveState,
  isPaused,
  isGameOver,
  onGameOver,
  onPauseToggle,
  gameSpeedMultiplier,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Core gameplay states
  const [score, setScore] = useState(0);
  const [coinsRun, setCoinsRun] = useState(0);
  const [gemsRun, setGemsRun] = useState(0);
  const [distance, setDistance] = useState(0);

  // Active power-up durations (in seconds remaining)
  const [activePowerUps, setActivePowerUps] = useState<{ [key in PowerUpType]: number }>({
    [PowerUpType.Magnet]: 0,
    [PowerUpType.DoubleCoins]: 0,
    [PowerUpType.SpeedBoost]: 0,
    [PowerUpType.Shield]: 0,
    [PowerUpType.SuperJump]: 0,
  });

  // Reference for game loop tick states to avoid state stale closure in high speed ref loops
  const stateRef = useRef({
    score: 0,
    coinsCollected: 0,
    gemsCollected: 0,
    distanceRun: 0,
    playerLane: 0, // -1, 0, 1
    targetLane: 0, // for smooth sliding transition
    laneTransitionProgress: 1.0, // 0.0 to 1.0
    playerY: 0, // elevation for jump
    jumpVelocity: 0,
    isSliding: false,
    slideTime: 0,
    isCrashed: false,
    crashTime: 0,
    speed: 0.015, // movement per frame of objects
    baseSpeed: 0.015,
    obstacles: [] as Obstacle[],
    collectibles: [] as Collectible[],
    particles: [] as Particle[],
    nextObstacleZ: 1.0,
    activePowerUps: {
      [PowerUpType.Magnet]: 0,
      [PowerUpType.DoubleCoins]: 0,
      [PowerUpType.SpeedBoost]: 0,
      [PowerUpType.Shield]: 0,
      [PowerUpType.SuperJump]: 0,
    },
    invulnerableTime: 0, // seconds flashing
    idCounter: 0,
    timeOfDay: 0.25, // day cycle
    cowsDodged: 0,
    barriersSlid: 0,
    runTime: 0,
  });

  const [dimensions, setDimensions] = useState({ width: 450, height: 750 });

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 320),
          height: Math.max(height, 480),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update speed based on current selected character's agility / speed
  useEffect(() => {
    // Initial setup speed
    const charSpeedFactor = 1 + (character.stats.speed - 3) * 0.04;
    const regionMult = location.difficultyMultiplier;
    stateRef.current.baseSpeed = 0.014 * charSpeedFactor * regionMult * gameSpeedMultiplier;
    stateRef.current.speed = stateRef.current.baseSpeed;
  }, [character, location, gameSpeedMultiplier]);

  // SWIPE ENGINE FOR MOBILE
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPaused || isGameOver || stateRef.current.isCrashed) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isPaused || isGameOver || stateRef.current.isCrashed) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    const swipeThreshold = 35; // minimum px for gesture trigger

    // Check horizontal vs vertical swipes
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) {
          // Swipe Right
          triggerLaneChange(1);
        } else {
          // Swipe Left
          triggerLaneChange(-1);
        }
        touchStartRef.current = null; // Consume swipe
      }
    } else {
      if (Math.abs(diffY) > swipeThreshold) {
        if (diffY < 0) {
          // Swipe Up (Jump)
          triggerJump();
        } else {
          // Swipe Down (Slide)
          triggerSlide();
        }
        touchStartRef.current = null; // Consume swipe
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || isGameOver || stateRef.current.isCrashed) return;
      
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          triggerLaneChange(-1);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          triggerLaneChange(1);
          break;
        case "ArrowUp":
        case "w":
        case "W":
        case " ":
          triggerJump();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          triggerSlide();
          break;
        case "Escape":
          onPauseToggle();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, isGameOver]);

  const triggerLaneChange = (dir: number) => {
    const s = stateRef.current;
    if (s.isCrashed) return;

    const oldTarget = s.targetLane;
    const nextLane = Math.min(1, Math.max(-1, oldTarget + dir));

    if (nextLane !== oldTarget) {
      s.playerLane = s.targetLane; // Start transition from previous finish
      s.targetLane = nextLane;
      s.laneTransitionProgress = 0.0;
      sounds.playLaneChange();
    }
  };

  const triggerJump = () => {
    const s = stateRef.current;
    if (s.isCrashed || s.playerY > 0 || s.isSliding) return;

    // Jump velocity elevated if super_jump shoe active
    const hasSuperJump = s.activePowerUps[PowerUpType.SuperJump] > 0;
    const multiplier = saveState.powerUpLevels[PowerUpType.SuperJump] * 0.1 + 1;
    s.jumpVelocity = hasSuperJump ? 10.5 * multiplier : 7.2;
    s.playerY = 1;
    
    // Stop sliding if user jumps mid-slide
    s.isSliding = false;
    
    sounds.playJump();
  };

  const triggerSlide = () => {
    const s = stateRef.current;
    if (s.isCrashed) return;

    // Dive down fast if currently in air (Subway surfers cancel air roll mechanic)
    if (s.playerY > 0) {
      s.playerY = 0;
      s.jumpVelocity = 0;
    }

    s.isSliding = true;
    s.slideTime = 0.65; // Durations of slide
    sounds.playSlide();
  };

  // SPARKLE COLLECTING PARTICLE SPARK
  const spawnCollectParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1.0,
        life: 0.8, // seconds
      });
    }
  };

  // MAIN RUN GAME LOOP (60FPS Canvas Ticking)
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      // Calculate delta time
      const dt = Math.min((time - lastTime) / 1000, 0.05); // Cap to avoid massive skips on tab freeze
      lastTime = time;

      if (!isPaused && !isGameOver) {
        updateGame(dt);
      }
      renderGame();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, isGameOver, dimensions, location, character]);

  const updateGame = (dt: number) => {
    const s = stateRef.current;
    s.runTime += dt;

    // Slow day and night cycle increment (looping day to night sunset etc)
    s.timeOfDay = (s.timeOfDay + dt * 0.003) % 1.0;

    if (s.isCrashed) {
      s.crashTime -= dt;
      if (s.crashTime <= 0) {
        onGameOver(
          Math.floor(s.score),
          s.coinsCollected,
          s.gemsCollected,
          Math.floor(s.distanceRun)
        );
      }
      // Decelerate background movement
      s.speed = Math.max(0, s.speed - dt * 0.05);
      return;
    }

    // 1. Update power ups countdowns
    let activeBoost = false;
    const powerUpsCopy = { ...s.activePowerUps };
    for (const key in powerUpsCopy) {
      const type = key as PowerUpType;
      if (s.activePowerUps[type] > 0) {
        s.activePowerUps[type] = Math.max(0, s.activePowerUps[type] - dt);
        if (type === PowerUpType.SpeedBoost) activeBoost = true;
      }
    }
    // Reflect changes to component react state for dashboard display
    setActivePowerUps({ ...s.activePowerUps });

    // 2. Adjust run speed dynamically (hyper fast during speed boost!)
    if (activeBoost) {
      s.speed = s.baseSpeed * 2.3;
      s.invulnerableTime = 0.5; // invincible
    } else {
      // Gradually speed up over distance
      const distanceFactor = 1 + (s.distanceRun / 1500) * 0.12;
      s.speed = s.baseSpeed * Math.min(distanceFactor, 2.0);
    }

    if (s.invulnerableTime > 0) {
      s.invulnerableTime = Math.max(0, s.invulnerableTime - dt);
    }

    // 3. Accumulate Game progress counters
    const speedCoeff = activeBoost ? 2.5 : 1.0;
    s.distanceRun += s.speed * 180 * speedCoeff * dt;
    s.score += s.speed * 280 * (s.activePowerUps[PowerUpType.DoubleCoins] > 0 ? 2 : 1) * speedCoeff * dt;

    // Push state metrics to dynamic React displays
    setScore(Math.floor(s.score));
    setDistance(Math.floor(s.distanceRun));

    // 4. Update horizontal landing slide
    if (s.laneTransitionProgress < 1.0) {
      s.laneTransitionProgress += dt * 8.5; // speed of land changing transition
      if (s.laneTransitionProgress >= 1.0) {
        s.laneTransitionProgress = 1.0;
        s.playerLane = s.targetLane;
      }
    }

    // 5. Update physical vertical jump calculations
    if (s.playerY > 0) {
      s.playerY += s.jumpVelocity;
      s.jumpVelocity -= 22.5 * dt; // gravity deceleration

      if (s.playerY <= 0) {
        s.playerY = 0;
        s.jumpVelocity = 0;
        // Small landing debris shockwave particles
        const playerScreenX = dimensions.width / 2 + s.targetLane * (dimensions.width * 0.22);
        spawnCollectParticles(playerScreenX, dimensions.height * 0.76, "#e2e8f0", 4);
      }
    }

    // 6. Update Slide crouching duration timer
    if (s.isSliding) {
      s.slideTime -= dt;
      if (s.slideTime <= 0) {
        s.isSliding = false;
      }
    }

    // 7. Manage background spawned obstacles & scenery objects
    s.obstacles.forEach((obs) => {
      obs.z -= s.speed * 8 * dt; // obstacles move faster toward player
    });

    s.collectibles.forEach((item) => {
      item.z -= s.speed * 8 * dt;
      // Magnet mechanics: pull coins if magnet active!
      if (s.activePowerUps[PowerUpType.Magnet] > 0 && item.type === "coin" && item.z > 0 && item.z < 0.6) {
        // compute magnet vacuum pull
        const magnetStiffness = dt * 10;
        const currentTargetLaneX = s.targetLane;
        // pull z faster, pull lane smoothly toward current player lane
        if (item.lane < currentTargetLaneX) {
          item.lane = Math.min(currentTargetLaneX, item.lane + magnetStiffness);
        } else if (item.lane > currentTargetLaneX) {
          item.lane = Math.max(currentTargetLaneX, item.lane - magnetStiffness);
        }
      }
    });

    // Clean up passed entities
    s.obstacles = s.obstacles.filter((obs) => {
      if (obs.z <= -0.1 && !obs.passed) {
        obs.passed = true;
        // Count dodging metrics for awards/missions
        if (obs.type === "cow") s.cowsDodged++;
        if (obs.type === "barricade" || obs.type === "barrier_low") s.barriersSlid++;
      }
      return obs.z > -0.2;
    });

    s.collectibles = s.collectibles.filter((item) => {
      return item.z > -0.2;
    });

    // 8. Handle active Collision logic
    checkRunCollisions();

    // 9. Spawning logic for upcoming items
    spawnUpcomingScenery(dt);

    // 10. Update floating burst particles
    s.particles.forEach((part) => {
      part.x += part.vx;
      part.y += part.vy;
      part.vy += 4.5 * dt; // slight particle gravity
      part.life -= dt;
      part.alpha = Math.max(0, part.life / 0.8);
    });
    s.particles = s.particles.filter((p) => p.life > 0);
  };

  // CHECK ALL RUNNER COLLISIONS
  const checkRunCollisions = () => {
    const s = stateRef.current;
    if (s.isCrashed) return;

    const playW = dimensions.width;
    const playH = dimensions.height;

    // Player geometric lane location (offset based slide)
    const playerActualLane = s.playerLane + (s.targetLane - s.playerLane) * s.laneTransitionProgress;

    // Check Coin and Power-up Collections
    s.collectibles.forEach((item) => {
      if (item.collected || item.z < -0.1) return;

      // Distance checking. z is depth. around z=0.08 is runner's plane!
      const zBuffer = 0.08;
      if (Math.abs(item.z - 0.08) < zBuffer) {
        // horizontal lane check
        if (Math.abs(item.lane - playerActualLane) < 0.45) {
          // vertical height clearance check
          const collectY = playH * 0.77 - s.playerY;
          const itemY = playH * 0.28 + Math.pow(1 - item.z, 2.5) * (playH * 0.85 - playH * 0.28) - (item.type === "coin" ? 10 : 25);
          
          if (s.playerY > 40 && item.type === "coin") {
            // Can collect high coins if jumping
          }

          // Trigger collect
          item.collected = true;
          handleItemCollection(item);
        }
      }
    });

    // Check Obstacles Crashes
    s.obstacles.forEach((obs) => {
      if (obs.passed || s.isCrashed) return;

      // Collision range z=0.05 to z=0.15 is the critical player depth zone
      if (obs.z >= 0.04 && obs.z <= 0.14) {
        if (Math.abs(obs.lane - playerActualLane) < 0.55) {
          // Lane overlap! Verify high or low evasions
          
          let crashDetected = false;

          if (obs.type === "barricade" || obs.type === "market_umbrella") {
            // Barricade is HIGH: requires sliding underneath!
            // If NOT sliding, crash occurs!
            if (!s.isSliding) {
              crashDetected = true;
            }
          } else if (obs.type === "barrier_low" || obs.type === "cow") {
            // Low hurdle is LOW: requires jumping over!
            // If player vertical height is less than 24, crash occurs!
            if (s.playerY < 24) {
              crashDetected = true;
            }
          } else {
            // Taxi, Truck, Solid rocks are obstacles: requires dynamic lane shift!
            // You can jump over small low obstacles but high buses/taxis are strictly solid blockades.
            // If player doesn't have Sibhaca Super Jump shoe higher than 55, crash happens!
            const isSuperJumping = s.activePowerUps[PowerUpType.SuperJump] > 0 && s.playerY > 55;
            if (!isSuperJumping) {
              crashDetected = true;
            }
          }

          if (crashDetected) {
            // Invincibility shield protects runner!
            if (s.activePowerUps[PowerUpType.Shield] > 0 || s.invulnerableTime > 0) {
              // Absorb hit, deactivate shield, trigger flash
              s.activePowerUps[PowerUpType.Shield] = 0;
              s.invulnerableTime = 1.5; // 1.5s invulnerability
              sounds.playCrash(); // lower sound
              
              // Blow up obstacle details safely
              obs.passed = true;
              const obsProjX = playW / 2 + obs.lane * (playW * 0.22);
              spawnCollectParticles(obsProjX, playH * 0.72, "#ef4444", 15);
            } else {
              // DESTRUCTIVE CRASH GAME-OVER SEQUENCE
              s.isCrashed = true;
              s.crashTime = 1.5; // delay scoreboard 1.5s
              sounds.playCrash();
              sounds.stopMusic();
            }
          }
        }
      }
    });
  };

  const handleItemCollection = (item: Collectible) => {
    const s = stateRef.current;
    const playW = dimensions.width;
    const playH = dimensions.height;
    
    // Compute pixel coordinates of pick-up for burst particle emitter
    const scaleFactor = Math.pow(1 - item.z, 2.5);
    const screenX = playW / 2 + item.lane * (playW * 0.22) * scaleFactor;
    const screenY = playH * 0.28 + scaleFactor * (playH * 0.85 - playH * 0.28);

    if (item.type === "coin") {
      let coinMultiplier = s.activePowerUps[PowerUpType.DoubleCoins] > 0 ? 2 : 1;
      s.coinsCollected += 1 * coinMultiplier;
      s.score += 55 * coinMultiplier;
      setCoinsRun(s.coinsCollected);
      sounds.playCoin();
      spawnCollectParticles(screenX, screenY - 10, "#fbbf24", 5);
    } else if (item.type === "gem") {
      s.gemsCollected += 1;
      setGemsRun(s.gemsCollected);
      sounds.playGem();
      spawnCollectParticles(screenX, screenY - 15, "#ef4444", 8);
    } else {
      // POWER-UP COLLECTION! Read custom save durations upgrades
      const pType = item.type as PowerUpType;
      // Upgrade level impacts duration
      const level = saveState.powerUpLevels[pType];
      const upgradeDetail = saveState.activeMissions; // fallback container for data structure
      
      const levelBonusSec = (level - 1) * 2.0;
      const duration = (pType === PowerUpType.SpeedBoost ? 4 : pType === PowerUpType.Shield ? 7 : 6) + levelBonusSec;

      s.activePowerUps[pType] = duration;
      sounds.playPowerUp();
      spawnCollectParticles(screenX, screenY - 20, "#3b82f6", 12);
    }
  };

  // SPANNER GENERATOR FOR OBSTACLES & SCENERY ENTITIES
  const spawnUpcomingScenery = (dt: number) => {
    const s = stateRef.current;
    s.nextObstacleZ -= dt * 1.6; // spawn timer

    if (s.nextObstacleZ <= 0) {
      s.nextObstacleZ = 0.9 + Math.random() * 0.7; // next segment delay
      s.idCounter++;

      // Decide what to spawn: Coin row, Obstacle barrier, Red gems, Powerup
      const roll = Math.random();

      if (roll < 0.45) {
        // 1. Spawn Obstacle
        const lanesList = [-1, 0, 1];
        const randomLane = lanesList[Math.floor(Math.random() * lanesList.length)];
        
        // Pick an obstacle type based on selected location/region
        let possibleTypes: Obstacle["type"][] = ["barrier_low", "barricade"];
        
        if (location.sceneryType === "rural") {
          possibleTypes.push("cow", "barrier_low");
        } else if (location.sceneryType === "market") {
          possibleTypes.push("market_umbrella", "taxi");
        } else if (location.sceneryType === "city") {
          possibleTypes.push("taxi", "barricade");
        } else if (location.sceneryType === "mountain") {
          possibleTypes.push("waterfall_rock", "barricade");
        } else {
          possibleTypes.push("taxi", "barrier_low");
        }

        const selectedType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];

        s.obstacles.push({
          id: s.idCounter,
          z: 1.1, // starts far at horizon
          lane: randomLane,
          type: selectedType,
          width: 0.8,
          height: selectedType === "barricade" || selectedType === "market_umbrella" ? 35 : 0,
          passed: false
        });

        // Add 2 coins right behind the obstacle in another lane as prize!
        const leftoverLanes = lanesList.filter(l => l !== randomLane);
        const prizeLane = leftoverLanes[Math.floor(Math.random() * leftoverLanes.length)];
        s.collectibles.push({
          id: s.idCounter + 100,
          z: 1.25,
          lane: prizeLane,
          type: "coin",
          collected: false,
          bounceOffset: Math.random() * Math.PI
        });
      } else if (roll < 0.85) {
        // 2. Spawn a beautiful sequence of floating Coins (e.g., 3 in a row)
        const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const heightRow = Math.random() > 0.75 ? 30 : 0; // jump-required floating coins
        
        for (let i = 0; i < 3; i++) {
          s.collectibles.push({
            id: s.idCounter + i * 50,
            z: 1.1 + i * 0.08,
            lane: lane,
            type: "coin",
            collected: false,
            bounceOffset: Math.random() * Math.PI
          });
        }
      } else {
        // 3. Spawn rare Gem or a PowerUp box in a random lane!
        const lane = Math.floor(Math.random() * 3) - 1;
        const itemRoll = Math.random();
        let itemType: "gem" | PowerUpType = "gem";

        if (itemRoll < 0.2) {
          itemType = PowerUpType.Magnet;
        } else if (itemRoll < 0.4) {
          itemType = PowerUpType.DoubleCoins;
        } else if (itemRoll < 0.6) {
          itemType = PowerUpType.SpeedBoost;
        } else if (itemRoll < 0.75) {
          itemType = PowerUpType.Shield;
        } else if (itemRoll < 0.9) {
          itemType = PowerUpType.SuperJump;
        }

        s.collectibles.push({
          id: s.idCounter,
          z: 1.15,
          lane: lane,
          type: itemType,
          collected: false,
          bounceOffset: Math.random() * Math.PI
        });
      }
    }
  };

  // RENDER DYNAMIC CANVAS CANVAS
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const s = stateRef.current;
    const w = dimensions.width;
    const h = dimensions.height;

    // Apply high/low quality scaling setup
    canvas.width = w;
    canvas.height = h;

    // 1. Draw atmospheric Sky Gradient with dynamic day/night blend
    // Let's blend sky colors according to s.timeOfDay
    // timeOfDay: 0.0-0.4 Day, 0.4-0.6 Sunset, 0.6-0.8 Night, 0.8-1.0 Dawn
    let skyColor1 = location.colors.sky;
    let skyColor2 = "#ffffff";
    let horizonOutlineColor = location.colors.horizon;

    if (s.timeOfDay > 0.4 && s.timeOfDay <= 0.65) {
      // Sunset
      const factor = (s.timeOfDay - 0.4) / 0.25;
      skyColor1 = blendColors(location.colors.sky, "#f35c1e", factor);
      skyColor2 = blendColors("#ffffff", "#fca5a5", factor);
    } else if (s.timeOfDay > 0.65 && s.timeOfDay <= 0.85) {
      // Deep Starry night
      const factor = (s.timeOfDay - 0.65) / 0.2;
      skyColor1 = blendColors("#f35c1e", "#030712", factor);
      skyColor2 = blendColors("#fca5a5", "#111827", factor);
    } else if (s.timeOfDay > 0.85) {
      // Dawn rising back
      const factor = (s.timeOfDay - 0.85) / 0.15;
      skyColor1 = blendColors("#030712", location.colors.sky, factor);
      skyColor2 = blendColors("#111827", "#ffffff", factor);
    }

    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.28);
    skyGrad.addColorStop(0, skyColor1);
    skyGrad.addColorStop(1, skyColor2);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.28);

    // Weather Effects: Night stars, rain overlays
    if (s.timeOfDay > 0.65 && s.timeOfDay <= 0.88) {
      // Draw quiet stars
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 20; i++) {
        const starX = (Math.sin(i * 1234.5) * 0.5 + 0.5) * w;
        const starY = (Math.cos(i * 5432.1) * 0.5 + 0.5) * (h * 0.22);
        const shine = Math.sin(s.runTime * 4 + i) * 0.4 + 0.6;
        ctx.globalAlpha = shine;
        ctx.fillRect(starX, starY, 2, 2);
      }
      ctx.globalAlpha = 1.0;
    }

    // 2. Draw Scenic Horizon (Sibebe hills silhouette, clouds, buildings)
    ctx.fillStyle = horizonOutlineColor;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.28);
    // Draw 3 large curved mountains in the background for Mbabane / Sibebe
    ctx.quadraticCurveTo(w * 0.2, h * 0.14, w * 0.4, h * 0.28);
    ctx.quadraticCurveTo(w * 0.65, h * 0.08, w * 0.85, h * 0.28);
    ctx.quadraticCurveTo(w * 0.95, h * 0.18, w, h * 0.28);
    ctx.lineTo(w, h * 0.28);
    ctx.lineTo(0, h * 0.28);
    ctx.fill();

    // 3. Draw Road Ground (Converging lane roads)
    const vanishingY = h * 0.28;
    const groundY = h * 0.85;

    ctx.fillStyle = location.colors.ground;
    ctx.beginPath();
    ctx.moveTo(0, vanishingY);
    ctx.lineTo(w, vanishingY);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // Secondary decorative scenery lines (like road verges on the left/right sides)
    ctx.strokeStyle = location.sceneryType === "rural" ? "#16a34a" : "#9ca3af";
    ctx.lineWidth = 3;
    ctx.beginPath();
    // left boundary line converging
    ctx.moveTo(w * 0.21, vanishingY);
    ctx.lineTo(0, h);
    // right boundary line converging
    ctx.moveTo(w * 0.79, vanishingY);
    ctx.lineTo(w, h);
    ctx.stroke();

    // 4. Draw Lanes dividers
    ctx.strokeStyle = location.colors.laneLines;
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 18]); // dashed highway divides

    const laneW = w * 0.22; // width of each lane at projection base
    
    // Left lane division road vector
    ctx.beginPath();
    ctx.moveTo(w / 2 - laneW * 0.5, vanishingY);
    ctx.lineTo(w / 2 - laneW * 2.2, h);
    ctx.stroke();

    // Right lane division road vector
    ctx.beginPath();
    ctx.moveTo(w / 2 + laneW * 0.5, vanishingY);
    ctx.lineTo(w / 2 + laneW * 2.2, h);
    ctx.stroke();
    
    ctx.setLineDash([]); // clear dash

    // 5. Draw scenery flanking decorations (Ezulwini Palms, Mbabane Buildings, Rural Mud huts)
    drawFlankingScenery(ctx, w, h, vanishingY, groundY);

    // 6. Draw Collectibles (Coins, Gems, Power-ups) sorted by z-depth desc
    // Sorting guarantees that faraway coins are rendered behind closer items
    s.collectibles.sort((a, b) => b.z - a.z);
    s.collectibles.forEach((item) => {
      if (item.collected) return;
      drawCollectibleItem(ctx, item, w, h, vanishingY, groundY);
    });

    // 7. Draw Active Obstacles (Cows, Taxis, Barricades)
    s.obstacles.sort((a, b) => b.z - a.z);
    s.obstacles.forEach((obs) => {
      if (obs.passed && s.isCrashed) return; // don't draw if crashed & passed
      drawObstacleItem(ctx, obs, w, h, vanishingY, groundY);
    });

    // 8. Draw Player Active Character (Fluid skeleton running loop)
    const activeBoost = s.activePowerUps[PowerUpType.SpeedBoost] > 0;
    const playerActualLane = s.playerLane + (s.targetLane - s.playerLane) * s.laneTransitionProgress;

    // Convert player position to projected screen coordinates
    // Player is fixed on immediate foreground depth plane around z=0.08
    const playerScaleFactor = Math.pow(1 - 0.08, 2.5);
    const playerProjX = w / 2 + playerActualLane * (w * 0.22) * playerScaleFactor;
    const playerProjY = vanishingY + playerScaleFactor * (groundY - vanishingY) - (s.playerY * playerScaleFactor * 1.55);

    // Flashing effect if invulnerable
    let shouldDrawPlayer = true;
    if (s.invulnerableTime > 0) {
      shouldDrawPlayer = Math.floor(s.runTime * 15) % 2 === 0;
    }

    if (shouldDrawPlayer) {
      // Draw running trail if speed boost active
      if (activeBoost) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        // Drawing blue-ish shadow trail
        drawCharacter(
          ctx,
          playerProjX - 12,
          playerProjY,
          1.7 * playerScaleFactor,
          character.id,
          "run",
          s.runTime * 4.5,
          "#60a5fa",
          "#2563eb"
        );
        ctx.restore();
      }

      // Draw the core character
      let playerAnim: "run" | "jump" | "slide" | "crash" = "run";
      let animTime = s.runTime * 3.5; // runner speed cadence

      if (s.isCrashed) {
        playerAnim = "crash";
        animTime = s.crashTime;
      } else if (s.playerY > 0) {
        playerAnim = "jump";
        animTime = s.playerY / 60; // scale elevation for frame sequence
      } else if (s.isSliding) {
        playerAnim = "slide";
        animTime = s.slideTime;
      }

      // Increase scale slightly for crisp resolution
      drawCharacter(
        ctx,
        playerProjX,
        playerProjY,
        1.8 * playerScaleFactor,
        character.id,
        playerAnim,
        animTime,
        character.color,
        character.secondColor
      );

      // 9. Draw visual power-up indicators around the player (Shield bubble, Magnet rings)
      if (s.activePowerUps[PowerUpType.Shield] > 0) {
        // Glowing cyan traditional Umgobo shell shield circle
        ctx.save();
        ctx.strokeStyle = "rgba(34, 211, 238, 0.7)";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(playerProjX, playerProjY - 24, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (s.activePowerUps[PowerUpType.Magnet] > 0) {
        // Glowing golden dynamic rings
        ctx.save();
        ctx.strokeStyle = "rgba(234, 179, 8, 0.75)";
        ctx.lineWidth = 2;
        const ringPulse = 20 + Math.sin(s.runTime * 10) * 6;
        ctx.beginPath();
        ctx.arc(playerProjX, playerProjY - 14, ringPulse, 0, Math.PI, true);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 10. Draw Explosive Particles
    s.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 11. Draw Rain or Cloud Weather overlay if on Mbabane rainy setting
    if (location.sceneryType === "city" || location.sceneryType === "mountain") {
      ctx.strokeStyle = "rgba(224, 242, 254, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Draw falling streaks
      for (let k = 0; k < 12; k++) {
        const rx = (Math.sin(s.runTime + k * 23.4) * 0.5 + 0.5) * w;
        const ry = ((s.runTime * 2.5 + k * 80) % h);
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 8, ry + 16);
      }
      ctx.stroke();
    }
  };

  // HELPER DESCRIPTIONS TO BLEND COLORS FOR DYNAMIC SUNSETS/NIGHTS
  const blendColors = (c1: string, c2: string, ratio: number) => {
    // Basic hex blend converter
    const parseHex = (hex: string) => {
      const standard = hex.startsWith("#") ? hex.substring(1) : hex;
      if (standard.length === 3) {
        return {
          r: parseInt(standard[0] + standard[0], 16),
          g: parseInt(standard[1] + standard[1], 16),
          b: parseInt(standard[2] + standard[2], 16)
        };
      }
      return {
        r: parseInt(standard.substring(0, 2), 16),
        g: parseInt(standard.substring(2, 4), 16),
        b: parseInt(standard.substring(4, 6), 16)
      };
    };

    try {
      const rgb1 = parseHex(c1);
      const rgb2 = parseHex(c2);

      const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
      const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
      const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);

      return `rgb(${r}, ${g}, ${b})`;
    } catch (e) {
      return c1;
    }
  };

  // DRAW FLANKING SCENERY (Palm Trees, Huts, Gables, Rocks)
  const drawFlankingScenery = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    vanishingY: number,
    groundY: number
  ) => {
    const s = stateRef.current;
    
    // We generate pseudo-infinite trees or items by using current s.distanceRun metric
    const itemsSpacing = 0.25; // spacing in depth
    const distanceCycles = s.distanceRun * 0.01;

    // Draw left and right flanking markers using distance loop
    for (let i = 0; i < 5; i++) {
      // depth factor
      let sideZ = 1.0 - ((distanceCycles / 4 + i * itemsSpacing) % 1.0);
      if (sideZ <= 0.05) continue;

      const scale = Math.pow(1 - sideZ, 2.5);
      const groundLine = vanishingY + scale * (groundY - vanishingY);
      
      const leftX = w / 2 - (w * 0.28) * scale;
      const rightX = w / 2 + (w * 0.28) * scale;
      const scenerySize = 65 * scale;

      ctx.save();
      if (location.sceneryType === "city") {
        // Draw modern Mbabane buildings (brick structures & towers)
        ctx.fillStyle = "#4b5563"; // gray towers
        ctx.fillRect(leftX - scenerySize, groundLine - scenerySize * 2, scenerySize, scenerySize * 2);
        ctx.fillStyle = "#374151";
        ctx.fillRect(rightX, groundLine - scenerySize * 2.5, scenerySize * 0.8, scenerySize * 2.5);
        
        // building yellow window lights
        ctx.fillStyle = s.timeOfDay > 0.6 ? "#eab308" : "rgba(255,255,255,0.4)";
        ctx.fillRect(leftX - scenerySize * 0.7, groundLine - scenerySize * 1.6, scenerySize * 0.15, scenerySize * 0.15);
        ctx.fillRect(rightX + scenerySize * 0.2, groundLine - scenerySize * 2.1, scenerySize * 0.15, scenerySize * 0.15);
      } else if (location.sceneryType === "valley") {
        // Draw beautiful tall green Palm trees for Ezulwini resort
        // left trunk
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 3.5 * scale;
        ctx.beginPath();
        ctx.moveTo(leftX - 5 * scale, groundLine);
        ctx.quadraticCurveTo(leftX - 15 * scale, groundLine - scenerySize * 0.8, leftX - 10 * scale, groundLine - scenerySize * 1.5);
        ctx.stroke();

        // left green palms leaves
        ctx.fillStyle = "#047857";
        ctx.beginPath();
        ctx.ellipse(leftX - 10 * scale, groundLine - scenerySize * 1.5, scenerySize * 0.4, scenerySize * 0.15, Math.PI / 6, 0, Math.PI * 2);
        ctx.ellipse(leftX - 10 * scale, groundLine - scenerySize * 1.5, scenerySize * 0.4, scenerySize * 0.15, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // Right side hotel sign
        ctx.fillStyle = "#fb7185";
        ctx.fillRect(rightX + 5 * scale, groundLine - scenerySize * 1.4, scenerySize * 0.6, scenerySize * 0.8);
        ctx.fillStyle = "#ffffff";
        ctx.font = `${Math.max(5, 10 * scale)}px sans-serif`;
        ctx.fillText("HOTEL", rightX + 8 * scale, groundLine - scenerySize * 1.0);
      } else if (location.sceneryType === "rural") {
        // Draw clay round houses with golden straw roofs (Eswatini rondavels!)
        // left rondavel mud base (light brown circle / rect)
        ctx.fillStyle = "#b45309";
        ctx.beginPath();
        ctx.fillRect(leftX - scenerySize - 4, groundLine - scenerySize * 0.8, scenerySize, scenerySize * 0.8);
        
        ctx.fillStyle = "#78350f"; // thatch roof
        ctx.beginPath();
        ctx.moveTo(leftX - scenerySize - 8, groundLine - scenerySize * 0.8);
        ctx.lineTo(leftX - scenerySize / 2 - 4, groundLine - scenerySize * 1.4);
        ctx.lineTo(leftX - 4, groundLine - scenerySize * 0.8);
        ctx.fill();

        // right acacia umbrella tree
        ctx.strokeStyle = "#854d0e";
        ctx.lineWidth = 4 * scale;
        ctx.beginPath();
        ctx.moveTo(rightX + 15 * scale, groundLine);
        ctx.lineTo(rightX + 15 * scale, groundLine - scenerySize * 1.2);
        ctx.stroke();

        ctx.fillStyle = "#15803d";
        ctx.beginPath();
        ctx.ellipse(rightX + 15 * scale, groundLine - scenerySize * 1.2, scenerySize, scenerySize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (location.sceneryType === "mountain") {
        // Large dark rock pillars and wooden canyon bridge outlines
        ctx.fillStyle = "#4b5563"; // rock pillar
        ctx.beginPath();
        ctx.moveTo(leftX - scenerySize * 1.5, groundLine);
        ctx.lineTo(leftX - scenerySize, groundLine - scenerySize * 2.2);
        ctx.lineTo(leftX, groundLine - scenerySize * 1.8);
        ctx.lineTo(leftX + scenerySize * 0.5, groundLine);
        ctx.fill();

        // cascading water stream (waterfall) from right rocks
        ctx.fillStyle = "#60a5fa";
        ctx.fillRect(rightX + 5 * scale, groundLine - scenerySize * 2.0, scenerySize * 0.35, scenerySize * 2.0);
        ctx.fillStyle = "#e0f2fe"; // water froth
        ctx.fillRect(rightX + 5 * scale, groundLine - 2, scenerySize * 0.38, 3);
      } else {
        // Fallback generic green bushes
        ctx.fillStyle = "#16a34a";
        ctx.beginPath();
        ctx.arc(leftX - scenerySize * 0.5, groundLine - scenerySize * 0.3, scenerySize * 0.4, 0, Math.PI * 2);
        ctx.arc(rightX + scenerySize * 0.5, groundLine - scenerySize * 0.3, scenerySize * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  // DRAW COLLECTIBLES (Coins, Gems, Power-ups)
  const drawCollectibleItem = (
    ctx: CanvasRenderingContext2D,
    item: Collectible,
    w: number,
    h: number,
    vanishingY: number,
    groundY: number
  ) => {
    const s = stateRef.current;
    const scaleFactor = Math.pow(1 - item.z, 2.5);
    const itemProjX = w / 2 + item.lane * (w * 0.22) * scaleFactor;
    
    // Add small floating hover bounce
    const hoverVal = Math.sin(s.runTime * 8 + item.bounceOffset) * 6 * scaleFactor;
    const itemProjY = vanishingY + scaleFactor * (groundY - vanishingY) - hoverVal;
    
    const baseSize = item.type === "coin" ? 8 : item.type === "gem" ? 10 : 13;
    const size = baseSize * scaleFactor;

    if (size < 0.8) return; // ignore sub-pixel renders

    ctx.save();
    if (item.type === "coin") {
      // Golden Eswatini coin
      ctx.fillStyle = "#facc15";
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 1.5 * scaleFactor;
      ctx.beginPath();
      ctx.arc(itemProjX, itemProjY - 10 * scaleFactor, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inside shiny star imprint
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(itemProjX, itemProjY - 10 * scaleFactor, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === "gem") {
      // Red diamond gems
      ctx.fillStyle = "#ef4444";
      ctx.strokeStyle = "#991b1b";
      ctx.lineWidth = 1 * scaleFactor;
      ctx.beginPath();
      // Draw diamond polygon
      ctx.moveTo(itemProjX, itemProjY - 18 * scaleFactor - size);
      ctx.lineTo(itemProjX + size, itemProjY - 18 * scaleFactor);
      ctx.lineTo(itemProjX, itemProjY - 18 * scaleFactor + size);
      ctx.lineTo(itemProjX - size, itemProjY - 18 * scaleFactor);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // POWER UP BOX! E.g. Magnet, Shield, Speed Boost box
      ctx.fillStyle = "#2563eb"; // deep blue shield box
      if (item.type === PowerUpType.Magnet) ctx.fillStyle = "#eab308"; // gold magnet
      if (item.type === PowerUpType.Shield) ctx.fillStyle = "#06b6d4"; // cyan shield
      if (item.type === PowerUpType.SpeedBoost) ctx.fillStyle = "#ea580c"; // orange speed bolt
      if (item.type === PowerUpType.SuperJump) ctx.fillStyle = "#8b5cf6"; // purple shoes

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(itemProjX - size, itemProjY - 20 * scaleFactor - size, size * 2, size * 2, 4) : ctx.rect(itemProjX - size, itemProjY - 20 * scaleFactor - size, size * 2, size * 2);
      ctx.fill();
      ctx.stroke();

      // Power up symbol (Magnet horseshoe, shield crown, wings)
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(5, 11 * scaleFactor)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let sym = "?";
      if (item.type === PowerUpType.Magnet) sym = "U";
      if (item.type === PowerUpType.Shield) sym = "O";
      if (item.type === PowerUpType.SpeedBoost) sym = "⚡";
      if (item.type === PowerUpType.SuperJump) sym = "J";
      ctx.fillText(sym, itemProjX, itemProjY - 20 * scaleFactor);
    }
    ctx.restore();
  };

  // DRAW RUNNING OBSTACLES (BARRICADES, ROAD TOWNS, COWS)
  const drawObstacleItem = (
    ctx: CanvasRenderingContext2D,
    obs: Obstacle,
    w: number,
    h: number,
    vanishingY: number,
    groundY: number
  ) => {
    const scaleFactor = Math.pow(1 - obs.z, 2.5);
    const obsProjX = w / 2 + obs.lane * (w * 0.22) * scaleFactor;
    const obsProjY = vanishingY + scaleFactor * (groundY - vanishingY);

    const baseUnitWidth = 32;
    const unitSizeX = baseUnitWidth * scaleFactor;
    const unitSizeY = 28 * scaleFactor;

    if (unitSizeX < 0.8) return;

    ctx.save();
    if (obs.type === "cow") {
      // Traditional Swazi Cattle cow hurdle!
      // Body (brown rect)
      ctx.fillStyle = "#78350f"; // dark brown
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(obsProjX - unitSizeX, obsProjY - unitSizeY * 0.8, unitSizeX * 2, unitSizeY * 0.8, 6) : ctx.rect(obsProjX - unitSizeX, obsProjY - unitSizeY * 0.8, unitSizeX * 2, unitSizeY * 0.8);
      ctx.fill();

      // cow white/black spots
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(obsProjX - unitSizeX * 0.5, obsProjY - unitSizeY * 0.5, unitSizeX * 0.35, 0, Math.PI * 2);
      ctx.arc(obsProjX + unitSizeX * 0.4, obsProjY - unitSizeY * 0.4, unitSizeX * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // cow legs
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 3.5 * scaleFactor;
      ctx.beginPath();
      // 4 legs
      ctx.moveTo(obsProjX - unitSizeX * 0.7, obsProjY - unitSizeY * 0.25);
      ctx.lineTo(obsProjX - unitSizeX * 0.7, obsProjY);
      ctx.moveTo(obsProjX - unitSizeX * 0.3, obsProjY - unitSizeY * 0.25);
      ctx.lineTo(obsProjX - unitSizeX * 0.3, obsProjY);
      ctx.moveTo(obsProjX + unitSizeX * 0.4, obsProjY - unitSizeY * 0.25);
      ctx.lineTo(obsProjX + unitSizeX * 0.4, obsProjY);
      ctx.moveTo(obsProjX + unitSizeX * 0.7, obsProjY - unitSizeY * 0.25);
      ctx.lineTo(obsProjX + unitSizeX * 0.7, obsProjY);
      ctx.stroke();

      // Head (brown/white with outstanding small black horns!)
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.arc(obsProjX + unitSizeX * 0.8, obsProjY - unitSizeY * 1.0, 7 * scaleFactor, 0, Math.PI * 2);
      ctx.fill();

      // horns
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2.5 * scaleFactor;
      ctx.beginPath();
      ctx.moveTo(obsProjX + unitSizeX * 0.72, obsProjY - unitSizeY * 1.1);
      ctx.lineTo(obsProjX + unitSizeX * 0.65, obsProjY - unitSizeY * 1.35);
      ctx.moveTo(obsProjX + unitSizeX * 0.88, obsProjY - unitSizeY * 1.1);
      ctx.lineTo(obsProjX + unitSizeX * 0.95, obsProjY - unitSizeY * 1.35);
      ctx.stroke();
    } else if (obs.type === "taxi") {
      // Local Minibus Toyota Taxi (White box with red/blue/green Swazi decals)
      // Main minibus body
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(obsProjX - unitSizeX * 1.2, obsProjY - unitSizeY * 1.7, unitSizeX * 2.4, unitSizeY * 1.7, 5) : ctx.rect(obsProjX - unitSizeX * 1.2, obsProjY - unitSizeY * 1.7, unitSizeX * 2.4, unitSizeY * 1.7);
      ctx.fill();

      // Windshield & side passenger glass panels
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(obsProjX - unitSizeX * 1.0, obsProjY - unitSizeY * 1.5, unitSizeX * 2.0, unitSizeY * 0.5);

      // Colorful Traditional Eswatini flag decal stripes (green, yellow, red, blue) across taxi sides!
      ctx.fillStyle = "#dc2626"; // Red decal
      ctx.fillRect(obsProjX - unitSizeX * 1.2, obsProjY - unitSizeY * 0.8, unitSizeX * 2.4, 3 * scaleFactor);
      ctx.fillStyle = "#16a34a"; // Green decal
      ctx.fillRect(obsProjX - unitSizeX * 1.2, obsProjY - unitSizeY * 0.7, unitSizeX * 2.4, 3 * scaleFactor);

      // Yellow headlamps & rear black wheels
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(obsProjX - unitSizeX * 0.9, obsProjY - unitSizeY * 0.25, 4 * scaleFactor, 0, Math.PI * 2);
      ctx.arc(obsProjX + unitSizeX * 0.9, obsProjY - unitSizeY * 0.25, 4 * scaleFactor, 0, Math.PI * 2);
      ctx.fill();

      // Tires
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(obsProjX - unitSizeX * 1.05, obsProjY - 3, unitSizeX * 0.4, 5);
      ctx.fillRect(obsProjX + unitSizeX * 0.65, obsProjY - 3, unitSizeX * 0.4, 5);
    } else if (obs.type === "barricade") {
      // HIGH BARRICADE (Requires sliding under!)
      // Constructed as red and white high metal toll gate pillars
      ctx.strokeStyle = "#dc2626"; // Red metal pillars
      ctx.lineWidth = 4.5 * scaleFactor;
      ctx.beginPath();
      // Left vertical post
      ctx.moveTo(obsProjX - unitSizeX * 1.1, obsProjY);
      ctx.lineTo(obsProjX - unitSizeX * 1.1, obsProjY - unitSizeY * 1.6);
      // Right vertical post
      ctx.moveTo(obsProjX + unitSizeX * 1.1, obsProjY);
      ctx.lineTo(obsProjX + unitSizeX * 1.1, obsProjY - unitSizeY * 1.6);
      ctx.stroke();

      // Top horizontal zebra strike beam
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(obsProjX - unitSizeX * 1.15, obsProjY - unitSizeY * 1.6, unitSizeX * 2.3, unitSizeY * 0.35);

      ctx.fillStyle = "#dc2626";
      // draw zebra warning diagonal marks
      ctx.fillRect(obsProjX - unitSizeX * 0.8, obsProjY - unitSizeY * 1.6, unitSizeX * 0.3, unitSizeY * 0.35);
      ctx.fillRect(obsProjX - unitSizeX * 0.1, obsProjY - unitSizeY * 1.6, unitSizeX * 0.3, unitSizeY * 0.35);
      ctx.fillRect(obsProjX + unitSizeX * 0.6, obsProjY - unitSizeY * 1.6, unitSizeX * 0.3, unitSizeY * 0.35);
    } else if (obs.type === "market_umbrella") {
      // Manzini Market umbrellas (High roadblock canopy!)
      // Umbrella post stick
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 3.5 * scaleFactor;
      ctx.beginPath();
      ctx.moveTo(obsProjX, obsProjY);
      ctx.lineTo(obsProjX, obsProjY - unitSizeY * 1.55);
      ctx.stroke();

      // Broad canvas high shade dome (bypassed by sliding under, or change lanes)
      ctx.fillStyle = "#facc15"; // yellow canvas shade dome
      ctx.beginPath();
      ctx.arc(obsProjX, obsProjY - unitSizeY * 1.5, unitSizeX * 1.3, Math.PI, 0);
      ctx.fill();

      // orange details of market umbrella stripes
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.ellipse(obsProjX, obsProjY - unitSizeY * 1.5, unitSizeX * 0.8, 5 * scaleFactor, 0, Math.PI, 0);
      ctx.fill();
    } else {
      // LOW BLOCKADE ROAD BARRIER (LOW) (Requires jumping over!)
      // Styled as standard black & white stripe low municipal barricade
      ctx.fillStyle = "#1e293b"; // base posts
      ctx.fillRect(obsProjX - unitSizeX * 0.8, obsProjY - unitSizeY * 0.6, unitSizeX * 0.25, unitSizeY * 0.6);
      ctx.fillRect(obsProjX + unitSizeX * 0.55, obsProjY - unitSizeY * 0.6, unitSizeX * 0.25, unitSizeY * 0.6);

      // horizontal danger divider board (black and yellow)
      ctx.fillStyle = "#fbbf24"; // yellow stripe board
      ctx.fillRect(obsProjX - unitSizeX * 1.05, obsProjY - unitSizeY * 0.8, unitSizeX * 2.1, unitSizeY * 0.35);

      ctx.fillStyle = "#1e293b"; // black hazard stripes
      ctx.fillRect(obsProjX - unitSizeX * 0.8, obsProjY - unitSizeY * 0.8, unitSizeX * 0.25, unitSizeY * 0.35);
      ctx.fillRect(obsProjX - unitSizeX * 0.2, obsProjY - unitSizeY * 0.8, unitSizeX * 0.25, unitSizeY * 0.35);
      ctx.fillRect(obsProjX + unitSizeX * 0.4, obsProjY - unitSizeY * 0.8, unitSizeX * 0.25, unitSizeY * 0.35);
    }
    ctx.restore();
  };

  return (
    <div
      ref={containerRef}
      id="game_container"
      className="relative w-full h-full overflow-hidden select-none bg-slate-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        id="game_canvas"
        className="block w-full h-full cursor-pointer touch-none"
      />

      {/* FLOATING HUD METRICS DASHBOARD */}
      <div id="game_hud" className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
        {/* Left Side: Score & Meters Run */}
        <div className="flex flex-col space-y-1">
          <div className="bg-black/45 backdrop-blur-md px-3.5 py-1.5 rounded-2xl flex items-center space-x-2 border border-white/10 text-white shadow-xl">
            <span className="text-xs font-mono tracking-widest text-[#fbbf24]">SCORE</span>
            <span className="text-xl font-black font-sans leading-none">{score}</span>
          </div>

          <div className="bg-black/45 backdrop-blur-md px-3 py-1 rounded-xl flex items-center space-x-2 border border-white/5 text-slate-300 w-fit">
            <span className="text-[10px] font-mono tracking-widest text-[#a855f7]">REGION</span>
            <span className="text-xs font-semibold leading-none">{location.name}</span>
          </div>
        </div>

        {/* Right Side: Currency Counters */}
        <div className="flex flex-col items-end space-y-1.5">
          <div className="flex items-center space-x-2">
            {/* Coins */}
            <div className="bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-1.5 border border-[#ca8a04]/20 text-[#facc15] shadow-lg">
              <span className="text-xs">🪙</span>
              <span className="text-sm font-bold font-mono">{coinsRun}</span>
            </div>

            {/* Gems */}
            <div className="bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-1.5 border border-[#ef4444]/20 text-[#fca5a5] shadow-lg">
              <span className="text-xs">💎</span>
              <span className="text-sm font-bold font-mono">{gemsRun}</span>
            </div>
          </div>

          {/* Distance Run */}
          <div className="bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full text-slate-300 border border-white/5 font-mono text-xs shadow">
            🏃 {distance} m
          </div>
        </div>
      </div>

      {/* ACTIVE POWER-UP TIMERS PANEL */}
      <div id="powerup_hud" className="absolute bottom-6 left-4 flex flex-col space-y-1.5 pointer-events-none">
        {(Object.entries(activePowerUps) as [PowerUpType, number][]).map(([key, remainder]) => {
          if (remainder <= 0) return null;
          const type = key as PowerUpType;
          let label = "Powerup";
          let color = "bg-blue-500";
          
          if (type === PowerUpType.Magnet) { label = "🧲 Magnet"; color = "bg-[#eab308]"; }
          if (type === PowerUpType.DoubleCoins) { label = "🪙 x2 Gold"; color = "bg-[#fbbf24]"; }
          if (type === PowerUpType.SpeedBoost) { label = "⚡ Turbo"; color = "bg-[#ea580c]"; }
          if (type === PowerUpType.Shield) { label = "🛡️ Shield"; color = "bg-[#06b6d4]"; }
          if (type === PowerUpType.SuperJump) { label = "👟 High Jump"; color = "bg-[#8b5cf6]"; }

          return (
            <div key={type} className="bg-black/65 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white text-xs flex items-center space-x-2 min-w-[130px] shadow-lg">
              <div className="flex-1">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-1">
                  <span>{label}</span>
                  <span className="font-mono">{remainder.toFixed(1)}s</span>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} transition-all duration-100`}
                    style={{ width: `${Math.min(100, (remainder / 10) * 100)}%` }} // assume 10s max duration reference
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK INSTRUCTIONS ON FIRST RUN */}
      {distance < 45 && (
        <div id="hint_overlay" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none animate-fade-in bg-black/40 backdrop-blur-[2px] p-5 rounded-2xl border border-white/5">
          <div className="text-white text-base font-bold mb-2">🎮 SWIPE / ARROWS TO RUN!</div>
          <div className="text-white/80 text-xs flex flex-col space-y-1 leading-relaxed">
            <span>Left / Right: Change Lanes</span>
            <span>Up: Jump obstacles</span>
            <span>Down: Slide under barricades</span>
            <span className="text-[#fbbf24] mt-2 animate-bounce">Let's Go!</span>
          </div>
        </div>
      )}
    </div>
  );
};
