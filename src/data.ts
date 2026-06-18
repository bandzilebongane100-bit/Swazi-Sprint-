import { 
  Character, 
  CharacterId, 
  LocationRegion, 
  LocationId, 
  PowerUpUpgrade, 
  PowerUpType, 
  Mission, 
  Achievement, 
  SaveState 
} from "./types";

export const CHARACTERS_DATA: Character[] = [
  {
    id: CharacterId.Student,
    name: "Lindiwe",
    role: "School Student",
    description: "A bright young runner from Mbabane who sprints to class each day!",
    color: "#fbbf24", // Warm Amber
    secondColor: "#059669", // Emerald Green
    cost: 0,
    currency: "coins",
    unlocked: true,
    avatarSvg: "student",
    stats: { speed: 3, agility: 4 }
  },
  {
    id: CharacterId.TaxiDriver,
    name: "Sipho",
    role: "Local Taxi Driver",
    description: "Famous for navigating Ezulwini Valley. Sprints when his minibus taxi breaks down!",
    color: "#eab308", // Yellow Taxi
    secondColor: "#1e293b", // Slate Black
    cost: 500,
    currency: "coins",
    unlocked: false,
    avatarSvg: "taxi",
    stats: { speed: 4, agility: 3 }
  },
  {
    id: CharacterId.TraditionalDancer,
    name: "Sibusiso",
    role: "Traditional Sibhaca Dancer",
    description: "Expresses high cultural stamina with high leaps, energy, and rich traditional gear.",
    color: "#dc2626", // Traditional Red
    secondColor: "#ffffff", // Pure White
    cost: 15,
    currency: "gems",
    unlocked: false,
    avatarSvg: "dancer",
    stats: { speed: 3, agility: 5 }
  },
  {
    id: CharacterId.FootballStar,
    name: "Thabo",
    role: "Eswatini Football Star",
    description: "Top midfielder of the Sihlangu Semnikati squad. Possesses supreme athletic endurance!",
    color: "#2563eb", // Royal Blue
    secondColor: "#facc15", // Sihlangu Gold
    cost: 1200,
    currency: "coins",
    unlocked: false,
    avatarSvg: "football",
    stats: { speed: 5, agility: 4 }
  },
  {
    id: CharacterId.Tourist,
    name: "Sarah",
    role: "Tourist Explorer",
    description: "Armed with a map and camera, she is deeply in love with the scenery of Ezulwini.",
    color: "#14b8a6", // Teal
    secondColor: "#78350f", // Khaki brown
    cost: 25,
    currency: "gems",
    unlocked: false,
    avatarSvg: "tourist",
    stats: { speed: 4, agility: 4 }
  },
  {
    id: CharacterId.MountainAdventurer,
    name: "Melusi",
    role: "Sibebe Climber",
    description: "Hales from the steep Sibebe Rock cliffs. He runs on rocky trails without breaking a sweat!",
    color: "#6b7280", // Slate Rock
    secondColor: "#f97316", // Intense Orange
    cost: 2500,
    currency: "coins",
    unlocked: false,
    avatarSvg: "mountain",
    stats: { speed: 5, agility: 3 }
  }
];

export const LOCATIONS_DATA: LocationRegion[] = [
  {
    id: LocationId.Mbabane,
    name: "Mbabane City",
    description: "Maneuver through high-altitude street lanes, road dividers, signs, and typical town traffic.",
    costToUnlock: 0,
    unlocked: true,
    colors: {
      sky: "#38bdf8", // Sky blue
      ground: "#4b5563", // Asphalt gray
      horizon: "#10b981", // Emerald hills
      laneLines: "#fcd34d" // Yellow dividers
    },
    sceneryType: "city",
    difficultyMultiplier: 1.0
  },
  {
    id: LocationId.Manzini,
    name: "Manzini Market",
    description: "Dodge colorful market stalls, delivery trucks, fresh crop boxes, and chaotic cross streets.",
    costToUnlock: 300,
    unlocked: false,
    colors: {
      sky: "#f97316", // Sunset orange
      ground: "#854d0e", // Clay sand road
      horizon: "#ea580c", // Dusty orange skyline
      laneLines: "#fef08a" // Pale yellow dividers
    },
    sceneryType: "market",
    difficultyMultiplier: 1.2
  },
  {
    id: LocationId.Ezulwini,
    name: "Ezulwini Valley",
    description: "Race through the majestic Valley of Heaven, lined with luxury hotels, palm trees, and scenic views.",
    costToUnlock: 800,
    unlocked: false,
    colors: {
      sky: "#818cf8", // Indiglo twilight
      ground: "#374151", // Polished dark road
      horizon: "#4f46e5", // Violet valley outlines
      laneLines: "#38bdf8" // Cyan glow dividers
    },
    sceneryType: "valley",
    difficultyMultiplier: 1.4
  },
  {
    id: LocationId.Rural,
    name: "Rural Eswatini",
    description: "Keep broad eyes for traditional clay homesteads, rivers, muddy pits, and crossing cows!",
    costToUnlock: 1500,
    unlocked: false,
    colors: {
      sky: "#fdba74", // Golden afternoon sun
      ground: "#b45309", // Warm dirt soil path
      horizon: "#166534", // Green acacia forests
      laneLines: "#ffffff" // White chalk lines
    },
    sceneryType: "rural",
    difficultyMultiplier: 1.6
  },
  {
    id: LocationId.Mountains,
    name: "Sibebe Rock Region",
    description: "Shatter gravity in steep canyon bridges, crashing waterfalls, Sibebe rock cliffs, and narrow ledges.",
    costToUnlock: 2500,
    unlocked: false,
    colors: {
      sky: "#1e1b4b", // Deep starry night
      ground: "#1f2937", // Granite cliff gravel
      horizon: "#4b5563", // Sibebe rock contours
      laneLines: "#f43f5e" // Glowing lava-pink guidelines
    },
    sceneryType: "mountain",
    difficultyMultiplier: 2.0
  }
];

export const POWERUPS_DATA: PowerUpUpgrade[] = [
  {
    type: PowerUpType.Magnet,
    name: "Coin Magnet",
    description: "Draws all coins in neighboring lanes automatically down to your side.",
    level: 1,
    maxLevel: 5,
    baseDuration: 6, // 6s start, +2s per level
    upgradeCost: [0, 150, 300, 600, 1200]
  },
  {
    type: PowerUpType.DoubleCoins,
    name: "Double Coins",
    description: "Multiplies every collected golden coin x2 during active runs.",
    level: 1,
    maxLevel: 5,
    baseDuration: 6,
    upgradeCost: [0, 200, 400, 800, 1500]
  },
  {
    type: PowerUpType.SpeedBoost,
    name: "Express Speed Boost",
    description: "Sprints you ahead at hyper-sonic autopilot speed, making you invulnerable.",
    level: 1,
    maxLevel: 5,
    baseDuration: 4, // 4s start, +1s per level
    upgradeCost: [0, 250, 500, 1000, 2000]
  },
  {
    type: PowerUpType.Shield,
    name: "Traditional Shield",
    description: "Summons a glowing Umgobo shield bubble. Absorbs a single obstacle collision.",
    level: 1,
    maxLevel: 5,
    baseDuration: 7, // 7s start, +2s per level
    upgradeCost: [0, 100, 250, 500, 1000]
  },
  {
    type: PowerUpType.SuperJump,
    name: "Sibhaca Super Jump",
    description: "Acquires lightweight shoes allowing massive altitude jump sweeps to glide safely.",
    level: 1,
    maxLevel: 5,
    baseDuration: 6,
    upgradeCost: [0, 150, 300, 600, 1200]
  }
];

export const MISSIONS_TEMPLATES: Mission[] = [
  {
    id: "run_500",
    description: "Run 500 meters in a single run across Mbabane",
    target: 500,
    current: 0,
    rewardCoins: 150,
    rewardGems: 1,
    completed: false,
    claimed: false,
    type: "distance_single_run"
  },
  {
    id: "coins_100_single",
    description: "Collect 100 coins in a single run",
    target: 100,
    current: 0,
    rewardCoins: 200,
    rewardGems: 1,
    completed: false,
    claimed: false,
    type: "coins_single_run"
  },
  {
    id: "total_coins_1000",
    description: "Collect 1,000 total gold coins",
    target: 1000,
    current: 0,
    rewardCoins: 400,
    rewardGems: 2,
    completed: false,
    claimed: false,
    type: "total_coins"
  },
  {
    id: "dodge_15_cows",
    description: "Evade 12 cows in Rural Eswatini",
    target: 12,
    current: 0,
    rewardCoins: 350,
    rewardGems: 3,
    completed: false,
    claimed: false,
    type: "jump_cows"
  },
  {
    id: "slide_10_barriers",
    description: "Slide under 10 low barricades",
    target: 10,
    current: 0,
    rewardCoins: 250,
    rewardGems: 1,
    completed: false,
    claimed: false,
    type: "slide_under_barriers"
  },
  {
    id: "total_run_5000",
    description: "Cover 5,000 total meters across the Kingdom",
    target: 5000,
    current: 0,
    rewardCoins: 500,
    rewardGems: 5,
    completed: false,
    claimed: false,
    type: "total_distance"
  }
];

export const ACHIEVEMENTS_TEMPLATES: Achievement[] = [
  {
    id: "kingdom_explorer",
    title: "Kingdom Explorer",
    description: "Run a total of 10,000 cumulative meters",
    badgeEmoji: "🌍",
    target: 10000,
    current: 0,
    unlocked: false,
    rewardCoins: 1000
  },
  {
    id: "gold_tycoon",
    title: "Sikhulu Coin Tycoon",
    description: "Amass a sum of 5,000 total gold coins",
    badgeEmoji: "💰",
    target: 5000,
    current: 0,
    unlocked: false,
    rewardCoins: 800
  },
  {
    id: "gem_hoarder",
    title: "Crown Jewels",
    description: "Acquire a total of 50 red gems",
    badgeEmoji: "💎",
    target: 50,
    current: 0,
    unlocked: false,
    rewardCoins: 1200
  },
  {
    id: "cow_dodger",
    title: "Master Herder",
    description: "Leap clean over or dodge 50 cows safely",
    badgeEmoji: "🐄",
    target: 50,
    current: 0,
    unlocked: false,
    rewardCoins: 750
  },
  {
    id: "upgrade_max",
    title: "Power Overload",
    description: "Upgrade any single power-up power to Level 5",
    badgeEmoji: "⚡",
    target: 5,
    current: 1,
    unlocked: false,
    rewardCoins: 1000
  },
  {
    id: "conquer_sibebe",
    title: "Sibebe Conqueror",
    description: "Set a single run highscore of over 4,000 points",
    badgeEmoji: "⛰️",
    target: 4000,
    current: 0,
    unlocked: false,
    rewardCoins: 1500
  }
];

export const INITIAL_SAVE_STATE: SaveState = {
  coins: 50, // Start with a few coins to buy Sipho or upgrades quickly
  gems: 3,
  stats: {
    highScore: 0,
    totalDistance: 0,
    totalCoins: 0,
    totalGems: 0,
    runsPlayed: 0,
    cowsDodged: 0,
    barriersSlid: 0,
    powerUpsCollected: 0
  },
  currentLocation: LocationId.Mbabane,
  currentCharacter: CharacterId.Student,
  unlockedCharacters: [CharacterId.Student],
  unlockedLocations: [LocationId.Mbabane],
  powerUpLevels: {
    [PowerUpType.Magnet]: 1,
    [PowerUpType.DoubleCoins]: 1,
    [PowerUpType.SpeedBoost]: 1,
    [PowerUpType.Shield]: 1,
    [PowerUpType.SuperJump]: 1
  },
  activeMissions: MISSIONS_TEMPLATES,
  achievements: ACHIEVEMENTS_TEMPLATES,
  audioEnabled: true,
  musicEnabled: true,
  isHighQuality: true
};
