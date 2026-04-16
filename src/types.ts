export interface Stats {
  strength: number;
  agility: number;
  intelligence: number;
  constitution: number;
  luck: number;
}

export interface Player {
  level: number;
  xp: number;
  nextLevelXp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: Stats;
  statPoints: number;
  inventory: Item[];
  equipment: {
    weapon: Item | null;
    armor: Item | null;
    accessory: Item | null;
  };
  skills: Skill[];
  potions: {
    health: number;
    mana: number;
  };
}

export enum ItemType {
  WEAPON = "WEAPON",
  ARMOR = "ARMOR",
  ACCESSORY = "ACCESSORY",
  CONSUMABLE = "CONSUMABLE",
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  stats?: Partial<Stats>;
  damage?: number;
  defense?: number;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  cooldown: number;
  effect: (player: Player) => void;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  xpReward: number;
  goldReward: number;
  level: number;
}

export interface Position {
  x: number;
  y: number;
}

export enum TileType {
  EMPTY = "EMPTY",
  WALL = "WALL",
  ENEMY = "ENEMY",
  CHEST = "CHEST",
  STAIRS = "STAIRS",
}

export interface Tile {
  type: TileType;
  enemy?: Enemy;
  chest?: Item;
}

export interface Floor {
  number: number;
  timer: number;
  stairsFound: boolean;
  enemies: Enemy[];
  grid: Tile[][];
  playerPosition: Position;
}
