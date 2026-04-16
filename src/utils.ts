import { Player, Stats, Enemy, Item, ItemType, Tile, TileType, Position } from "./types";

export const GRID_SIZE = 10;

export const generateGrid = (floor: number): { grid: Tile[][], playerPos: Position } => {
  const grid: Tile[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ type: TileType.EMPTY }))
  );

  // Add walls randomly (15% chance)
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (Math.random() < 0.15) {
        grid[y][x].type = TileType.WALL;
      }
    }
  }

  // Ensure player start position
  const playerPos = { x: 0, y: 0 };
  grid[playerPos.y][playerPos.x].type = TileType.EMPTY;

  // Add Stairs (far away from player)
  let stairsPos = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
  grid[stairsPos.y][stairsPos.x].type = TileType.STAIRS;

  // Add Enemies
  const enemyCount = 3 + Math.floor(floor / 5);
  for (let i = 0; i < enemyCount; i++) {
    let x = Math.floor(Math.random() * GRID_SIZE);
    let y = Math.floor(Math.random() * GRID_SIZE);
    if (grid[y][x].type === TileType.EMPTY) {
      grid[y][x].type = TileType.ENEMY;
      grid[y][x].enemy = generateEnemy(floor);
    }
  }

  // Add Chests
  const chestCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < chestCount; i++) {
    let x = Math.floor(Math.random() * GRID_SIZE);
    let y = Math.floor(Math.random() * GRID_SIZE);
    if (grid[y][x].type === TileType.EMPTY) {
      grid[y][x].type = TileType.CHEST;
      grid[y][x].chest = generateLoot(floor);
    }
  }

  return { grid, playerPos };
};

export const calculateStatContribution = (stats: Stats) => {
  return {
    hp: stats.constitution * 15,
    mp: stats.intelligence * 10,
    damage: stats.strength * 2,
    critRate: stats.luck * 0.01,
    evasion: stats.agility * 0.01,
  };
};

export const generateEnemy = (floor: number): Enemy => {
  const level = floor;
  const names = ["Crawler", "Grolch", "Steel Rat", "Troll", "Crazed AI Bot", "Shadow Weaver", "Dungeon Guard"];
  const name = names[Math.floor(Math.random() * names.length)];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: `${name} Lv.${level}`,
    level,
    maxHp: 20 + floor * 15,
    hp: 20 + floor * 15,
    damage: 2 + floor * 2,
    xpReward: 10 + floor * 5,
    goldReward: 5 + floor * 3,
  };
};

export const generateLoot = (floor: number): Item => {
  const rarities: ("COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY")[] = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];
  const weights = [60, 25, 10, 4, 1];
  
  let rand = Math.random() * 100;
  let cumulative = 0;
  let rarityIndex = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) {
      rarityIndex = i;
      break;
    }
  }
  
  const rarity = rarities[rarityIndex];
  const types = [ItemType.WEAPON, ItemType.ARMOR, ItemType.ACCESSORY];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const weaponNames = ["Rusty Sword", "Iron Blade", "Executioner's Axe", "Void Reaper", "World Ender"];
  const armorNames = ["Rags", "Leather Vest", "Steel Plate", "Guardian Suit", "God-King's Shell"];
  const accNames = ["Bone Ring", "Gem Pendant", "Ancient Idol", "Clockwork Heart", "Eye of the World"];
  
  let name = "";
  if (type === ItemType.WEAPON) name = weaponNames[Math.min(rarityIndex, weaponNames.length - 1)];
  if (type === ItemType.ARMOR) name = armorNames[Math.min(rarityIndex, armorNames.length - 1)];
  if (type === ItemType.ACCESSORY) name = accNames[Math.min(rarityIndex, accNames.length - 1)];

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    type,
    rarity,
    description: `A ${rarity} quality ${type.toLowerCase()}.`,
    damage: type === ItemType.WEAPON ? floor * (rarityIndex + 1) * 2 : 0,
    defense: type === ItemType.ARMOR ? floor * (rarityIndex + 1) * 1 : 0,
    stats: {
      strength: Math.floor(Math.random() * rarityIndex),
      luck: Math.floor(Math.random() * rarityIndex),
    }
  };
};
