export enum LocationId {
  Mbabane = "mbabane",
  Manzini = "manzini",
  Ezulwini = "ezulwini",
  Rural = "rural",
  Mountains = "mountains"
}

export enum CharacterId {
  Student = "student",
  TaxiDriver = "taxi_driver",
  FootballStar = "football_star",
  TraditionalDancer = "traditional_dancer",
  Tourist = "tourist",
  MountainAdventurer = "mountain"
}

export enum PowerUpType {
  Magnet = "magnet",
  DoubleCoins = "double_coins",
  SpeedBoost = "speed_boost",
  Shield = "shield",
  SuperJump = "super_jump"
}

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  description: string;
  color: string;
  secondColor: string;
  cost: number;
  currency: "coins" | "gems";
  unlocked: boolean;
  avatarSvg: string; // Dynamic path or procedural description
  stats: {
    speed: number; // 1-5
    agility: number; // 1-5
  };
}

export interface LocationRegion {
  id: LocationId;
  name: string;
  description: string;
  costToUnlock: number;
  unlocked: boolean;
  colors: {
    sky: string;
    ground: string;
    horizon: string;
    laneLines: string;
  };
  sceneryType: "city" | "market" | "valley" | "rural" | "mountain";
  difficultyMultiplier: number;
}

export interface PowerUpUpgrade {
  type: PowerUpType;
  name: string;
  description: string;
  level: number; // 0 to 5
  maxLevel: number;
  baseDuration: number; // seconds
  upgradeCost: number[]; // cost for each level
}

export interface Mission {
  id: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  rewardGems: number;
  completed: boolean;
  claimed: boolean;
  type: "coins_single_run" | "distance_single_run" | "total_coins" | "total_distance" | "jump_cows" | "slide_under_barriers";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeEmoji: string;
  target: number;
  current: number;
  unlocked: boolean;
  rewardCoins: number;
}

export interface GameStats {
  highScore: number;
  totalDistance: number;
  totalCoins: number;
  totalGems: number;
  runsPlayed: number;
  cowsDodged: number;
  barriersSlid: number;
  powerUpsCollected: number;
}

export interface SaveState {
  coins: number;
  gems: number;
  stats: GameStats;
  currentLocation: LocationId;
  currentCharacter: CharacterId;
  unlockedCharacters: CharacterId[];
  unlockedLocations: LocationId[];
  powerUpLevels: { [key in PowerUpType]: number };
  activeMissions: Mission[];
  achievements: Achievement[];
  audioEnabled: boolean;
  musicEnabled: boolean;
  isHighQuality: boolean;
}
