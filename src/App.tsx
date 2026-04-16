import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Skull, 
  Sword, 
  Shield, 
  Zap, 
  Timer, 
  ChevronRight, 
  Trophy, 
  User, 
  Backpack, 
  Settings as SettingsIcon,
  Heart,
  Droplets,
  Star,
  Gamepad2,
  AlertCircle
} from 'lucide-react';
import { Player, Item, Enemy, Floor, ItemType, Stats, Skill, Position, TileType, Tile } from './types';
import { generateEnemy, generateLoot, calculateStatContribution, generateGrid, GRID_SIZE } from './utils';

const INITIAL_PLAYER: Player = {
  level: 1,
  xp: 0,
  nextLevelXp: 100,
  hp: 150,
  maxHp: 150,
  mp: 50,
  maxMp: 50,
  stats: {
    strength: 5,
    agility: 5,
    intelligence: 5,
    constitution: 10,
    luck: 5,
  },
  statPoints: 0,
  inventory: [],
  equipment: {
    weapon: null,
    armor: null,
    accessory: null,
  },
  skills: [
    {
      id: 'slash',
      name: 'Power Slash',
      description: 'A heavy strike dealing extra damage.',
      mpCost: 10,
      cooldown: 5,
      effect: (p) => { /* Logic implemented in combat */ }
    }
  ],
  potions: {
    health: 2,
    mana: 2,
  },
};

const FLOOR_TIME = 300; // 5 minutes

export default function App() {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'LEVEL_UP' | 'GAME_OVER' | 'VICTORY'>('MENU');
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [floor, setFloor] = useState<Floor>({
    number: 1,
    timer: FLOOR_TIME,
    stairsFound: false,
    enemies: [],
    grid: [],
    playerPosition: { x: 0, y: 0 }
  });
  const [combatEnemy, setCombatEnemy] = useState<Enemy | null>(null);
  const [logs, setLogs] = useState<{ id: string; text: string; type: 'AI' | 'COMBAT' | 'SYSTEM' }[]>([]);
  const [activeTab, setActiveTab] = useState<'Dungeon' | 'Character' | 'Inventory'>('Dungeon');
  const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);

  const addLog = useCallback((text: string, type: 'AI' | 'COMBAT' | 'SYSTEM' = 'SYSTEM') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 50));
  }, []);

  // Timer Effect
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      setFloor(prev => {
        if (prev.timer <= 0) {
          setGameState('GAME_OVER');
          addLog("YOU FAILED THE TIMER! The fans are disappointed. And by fans, I mean I'm bored. You're dead.", 'AI');
          return prev;
        }
        return { ...prev, timer: prev.timer - 1 };
      });

      // Passive Regeneration (Every second)
      if (!combatEnemy) {
        setPlayer(prev => {
          const hpRegen = 0.5; // Very slow
          const mpRegen = 0.2;
          return {
            ...prev,
            hp: Math.min(prev.maxHp, prev.hp + hpRegen),
            mp: Math.min(prev.maxMp, prev.mp + mpRegen)
          };
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, addLog]);

  // Initial Floor Generation
  useEffect(() => {
    if (gameState === 'PLAYING' && floor.grid.length === 0) {
      const { grid, playerPos } = generateGrid(floor.number);
      setFloor(prev => ({ ...prev, grid, playerPosition: playerPos }));
      addLog(`New Floor: ${floor.number}. Explore the map or die.`, 'SYSTEM');
      if (floor.number === 1) {
        addLog("Welcome to the World Dungeon, Crawler! Try not to die in the first five minutes. It's bad for ratings.", 'AI');
      }
    }
  }, [gameState, floor.number, floor.grid.length, addLog]);

  const startGame = () => {
    const { grid, playerPos } = generateGrid(1);
    setPlayer(INITIAL_PLAYER);
    setFloor({
      number: 1,
      timer: FLOOR_TIME,
      stairsFound: false,
      enemies: [],
      grid,
      playerPosition: playerPos
    });
    setLogs([]);
    setGameState('PLAYING');
  };

  const movePlayer = (dx: number, dy: number) => {
    if (combatEnemy || gameState !== 'PLAYING') return;

    setFloor(prev => {
      const newX = prev.playerPosition.x + dx;
      const newY = prev.playerPosition.y + dy;

      if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) return prev;
      
      const targetTile = prev.grid[newY][newX];
      if (targetTile.type === TileType.WALL) return prev;

      let newGrid = [...prev.grid.map(row => [...row])];
      
      if (targetTile.type === TileType.ENEMY) {
        setCombatEnemy(targetTile.enemy!);
        addLog(`Encountered ${targetTile.enemy!.name}! Fight!`, 'SYSTEM');
        return { ...prev, playerPosition: { x: newX, y: newY } };
      }

      if (targetTile.type === TileType.CHEST) {
        const item = targetTile.chest!;
        addLog(`Found a chest! It contained: ${item.name}`, 'SYSTEM');
        
        // Bonus potion chance from chests
        const potionChance = Math.random();
        let potionText = "";
        setPlayer(p => {
          const newPotions = { ...p.potions };
          if (potionChance < 0.4) {
            newPotions.health++;
            potionText = " (+1 Health Potion)";
          } else if (potionChance < 0.7) {
            newPotions.mana++;
            potionText = " (+1 Mana Potion)";
          }
          return { ...p, inventory: [...p.inventory, item], potions: newPotions };
        });
        if (potionText) addLog(`Additional loot:${potionText}`, 'SYSTEM');
        
        newGrid[newY][newX] = { type: TileType.EMPTY };
      }

      if (targetTile.type === TileType.STAIRS) {
        addLog("You found the stairs. Ready to descend?", 'SYSTEM');
      }

      return {
        ...prev,
        grid: newGrid,
        playerPosition: { x: newX, y: newY }
      };
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') movePlayer(0, -1);
      if (e.key === 'ArrowDown') movePlayer(0, 1);
      if (e.key === 'ArrowLeft') movePlayer(-1, 0);
      if (e.key === 'ArrowRight') movePlayer(1, 0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combatEnemy, gameState]);

  const handleCombat = (enemy: Enemy) => {
    const pStats = calculateStatContribution(player.stats);
    const weaponDmg = player.equipment.weapon?.damage || 0;
    const playerDmg = pStats.damage + weaponDmg;
    
    // Player hits enemy
    const actualDmg = Math.max(1, Math.floor(playerDmg * (Math.random() * 0.4 + 0.8)));
    const newEnemyHp = Math.max(0, enemy.hp - actualDmg);
    addLog(`You hit ${enemy.name} for ${actualDmg} damage!`, 'COMBAT');

    if (newEnemyHp <= 0) {
      addLog(`You defeated ${enemy.name}!`, 'SYSTEM');
      setSelectedEnemy(null);
      const xpGain = enemy.xpReward;
      const goldGain = enemy.goldReward;
      
      // Loot chance
      let loot: Item | null = null;
      if (Math.random() > 0.7) {
        loot = generateLoot(floor.number);
        addLog(`Loot found: ${loot.name}!`, 'SYSTEM');
      }

      // Potion chance from enemies
      const potionChance = Math.random();
      let potionDrop: 'health' | 'mana' | null = null;
      if (potionChance < 0.3) potionDrop = 'health';
      else if (potionChance < 0.5) potionDrop = 'mana';

      setPlayer(prev => {
        let newXp = prev.xp + xpGain;
        let newLevel = prev.level;
        let newNextXp = prev.nextLevelXp;
        let newPoints = prev.statPoints;
        let newMaxHp = prev.maxHp;
        const newPotions = { ...prev.potions };
        if (potionDrop) {
          newPotions[potionDrop]++;
          addLog(`Enemy dropped a ${potionDrop} potion!`, 'SYSTEM');
        }

        if (newXp >= prev.nextLevelXp) {
          newLevel++;
          newXp -= prev.nextLevelXp;
          newNextXp = Math.floor(newNextXp * 1.5);
          newPoints += 5;
          newMaxHp += 20;
          addLog(`LEVEL UP! You are now level ${newLevel}.`, 'SYSTEM');
          addLog("Look at you, getting stronger. It won't save you, but it's cute.", 'AI');
        }

        return {
          ...prev,
          level: newLevel,
          xp: newXp,
          nextLevelXp: newNextXp,
          statPoints: newPoints,
          maxHp: newMaxHp,
          inventory: loot ? [...prev.inventory, loot] : prev.inventory,
          potions: newPotions
        };
      });

      setFloor(prev => {
        let newGrid = [...prev.grid.map(row => [...row])];
        newGrid[prev.playerPosition.y][prev.playerPosition.x] = { type: TileType.EMPTY };
        
        return { 
          ...prev, 
          grid: newGrid,
          enemies: prev.enemies.filter(e => e.id !== enemy.id)
        };
      });
      setCombatEnemy(null);
    } else {
      // Enemy hits player
      const enemyDmg = Math.max(1, Math.floor(enemy.damage * (Math.random() * 0.4 + 0.8)));
      const armorDef = player.equipment.armor?.defense || 0;
      const finalEnemyDmg = Math.max(1, enemyDmg - armorDef);
      
      const newPlayerHp = Math.max(0, player.hp - finalEnemyDmg);
      addLog(`${enemy.name} hits you for ${finalEnemyDmg} damage!`, 'COMBAT');
      
      setPlayer(prev => ({ ...prev, hp: newPlayerHp }));
      
      if (newPlayerHp <= 0) {
        setGameState('GAME_OVER');
        addLog("Critical failure! Your heart has stopped. How inconsiderate.", 'AI');
      }

      setCombatEnemy(prev => prev ? { ...prev, hp: newEnemyHp } : null);
      setFloor(prev => ({
        ...prev,
        enemies: prev.enemies.map(e => e.id === enemy.id ? { ...e, hp: newEnemyHp } : e)
      }));
    }
  };

  const nextFloor = () => {
    if (floor.number === 50) {
      setGameState('VICTORY');
      return;
    }
    const { grid, playerPos } = generateGrid(floor.number + 1);
    setFloor(prev => ({
      ...prev,
      number: prev.number + 1,
      timer: FLOOR_TIME,
      stairsFound: false,
      enemies: [],
      grid,
      playerPosition: playerPos
    }));
    setActiveTab('Dungeon');
  };

  const handleRest = () => {
    if (player.mp < 10) {
      addLog("Not enough MP to rest. You're too wired.", 'SYSTEM');
      return;
    }
    const healAmount = Math.floor(player.maxHp * 0.2);
    setPlayer(prev => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + healAmount),
      mp: prev.mp - 10
    }));
    addLog(`You take a quick breather. Recovered ${healAmount} HP.`, 'SYSTEM');
    addLog("Taking a nap in a death trap? Bold strategy. Let's see if it pays off.", 'AI');
  };

  const useSkill = (skill: Skill) => {
    if (gameState !== 'PLAYING' || !combatEnemy) {
      addLog("You need to be in combat to use skills.", 'SYSTEM');
      return;
    }
    if (player.mp < skill.mpCost) {
      addLog("Not enough MP!", 'SYSTEM');
      return;
    }

    const pStats = calculateStatContribution(player.stats);
    const weaponDmg = player.equipment.weapon?.damage || 0;
    const playerDmg = pStats.damage + weaponDmg;
    
    // Skill logic (Simple multiplier for now)
    const multiplier = 2;
    const actualDmg = Math.floor(playerDmg * multiplier * (Math.random() * 0.4 + 0.8));
    
    setPlayer(prev => ({ ...prev, mp: prev.mp - skill.mpCost }));
    addLog(`You used ${skill.name}!`, 'COMBAT');
    
    // Trigger hit logic by mimicking handleCombat but with higher damage
    const newEnemyHp = Math.max(0, combatEnemy.hp - actualDmg);
    addLog(`Critical Strike! ${combatEnemy.name} takes ${actualDmg} damage!`, 'COMBAT');

    if (newEnemyHp <= 0) {
      handleCombat({ ...combatEnemy, hp: 1 });
    } else {
      setCombatEnemy(prev => prev ? { ...prev, hp: newEnemyHp } : null);
      
      // Counter attack
      const enemyDmg = Math.max(1, Math.floor(combatEnemy.damage * (Math.random() * 0.4 + 0.8)));
      const armorDef = player.equipment.armor?.defense || 0;
      const finalEnemyDmg = Math.max(1, enemyDmg - armorDef);
      setPlayer(prev => ({ ...prev, hp: Math.max(0, prev.hp - finalEnemyDmg) }));
    }
  };

  const usePotion = (type: 'health' | 'mana') => {
    if (player.potions[type] <= 0) {
      addLog(`No ${type} potions left!`, 'SYSTEM');
      return;
    }

    setPlayer(prev => {
      const newPotions = { ...prev.potions };
      newPotions[type]--;
      
      if (type === 'health') {
        return {
          ...prev,
          hp: Math.min(prev.maxHp, prev.hp + 50),
          potions: newPotions
        };
      } else {
        return {
          ...prev,
          mp: Math.min(prev.maxMp, prev.mp + 30),
          potions: newPotions
        };
      }
    });
    addLog(`Used ${type} potion.`, 'SYSTEM');
  };
  const allocateStat = (statName: keyof Stats) => {
    if (player.statPoints <= 0) return;
    setPlayer(prev => ({
      ...prev,
      statPoints: prev.statPoints - 1,
      stats: { ...prev.stats, [statName]: prev.stats[statName] + 1 }
    }));
  };

  const equipItem = (item: Item) => {
    setPlayer(prev => {
      const newEquipment = { ...prev.equipment };
      if (item.type === ItemType.WEAPON) newEquipment.weapon = item;
      if (item.type === ItemType.ARMOR) newEquipment.armor = item;
      if (item.type === ItemType.ACCESSORY) newEquipment.accessory = item;
      
      return { ...prev, equipment: newEquipment };
    });
    addLog(`Equipped ${item.name}`, 'SYSTEM');
  };

  const unequipItem = (slot: keyof Player['equipment']) => {
    setPlayer(prev => {
      const item = prev.equipment[slot];
      if (!item) return prev;
      addLog(`Unequipped ${item.name}`, 'SYSTEM');
      return {
        ...prev,
        equipment: { ...prev.equipment, [slot]: null }
      };
    });
  };

  if (gameState === 'MENU') {
    return (
      <div className="min-h-screen bg-dungeon-bg p-8 flex flex-col items-center justify-center overflow-hidden relative font-sans">
        <div className="scanline" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10"
        >
          <h1 className="text-8xl font-black text-dungeon-accent mb-2 tracking-tighter uppercase italic">
            World <span className="text-white">Dungeon</span>
          </h1>
          <p className="text-dungeon-pink font-mono mb-12 tracking-widest text-lg uppercase h-6 animate-pulse">
            Crawling Phase: 50 Floors or Death
          </p>
          
          <button 
            onClick={startGame}
            className="group relative px-12 py-4 bg-dungeon-accent text-black font-bold text-2xl uppercase tracking-widest hover:bg-white transition-all duration-300 transform hover:scale-105 rounded-lg"
          >
            Enter the Meat Grinder
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-dungeon-pink rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-dungeon-pink rounded-full" />
          </button>
          
          <div className="mt-16 max-w-xl mx-auto text-dungeon-dim font-mono text-sm leading-relaxed border-l-2 border-dungeon-accent pl-6 py-2 bg-dungeon-surface/30 p-4 rounded-r-lg">
            "Listen up, Crawler. You have 5 minutes per floor. Find the stairs. Kill the mobs. Don't let the audience drop. If the ratings fall, I'll drop a bomb on you. Good luck!"
            <br />
            <span className="text-dungeon-pink opacity-80">— The AI Announcer</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'GAME_OVER' || gameState === 'VICTORY') {
    return (
      <div className="min-h-screen bg-dungeon-bg p-8 flex flex-col items-center justify-center">
        <div className="scanline" />
        <div className="text-center z-10">
          <h1 className={`text-9xl font-black mb-8 italic uppercase ${gameState === 'VICTORY' ? 'text-dungeon-gold' : 'text-dungeon-pink'}`}>
            {gameState === 'VICTORY' ? 'CHAMPION' : 'ELIMINATED'}
          </h1>
          <p className="text-white text-2xl mb-12 font-mono">
            You reached floor {floor.number} | Level {player.level}
          </p>
          <button 
            onClick={() => setGameState('MENU')}
            className="px-12 py-4 bg-white text-black font-bold text-xl uppercase tracking-widest hover:bg-dungeon-accent transition-all rounded-lg"
          >
            Re-spawn as a new loser
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dungeon-bg text-dungeon-text font-sans p-2 md:p-5 gap-4 flex flex-col h-screen max-h-screen overflow-hidden">
      <div className="scanline" />
      
      {/* HEADER GRID */}
      <header className="flex flex-col md:grid md:grid-cols-[1fr_200px_1fr] gap-3 md:gap-5 items-center z-20 shrink-0">
        <div className="w-full bg-dungeon-surface border-2 border-dungeon-accent p-2 md:p-3 px-5 rounded-lg flex md:block items-center justify-between gap-4">
          <h1 className="text-[10px] uppercase tracking-[2px] text-dungeon-accent font-bold">Floor Progress</h1>
          <p className="text-xl md:text-2xl font-bold text-white uppercase italic">Floor {floor.number}</p>
        </div>

        <div className="w-full bg-[#2a0a0a] border-2 border-dungeon-pink rounded-lg p-2 md:p-3 text-center shadow-[0_0_15px_rgba(248,81,73,0.2)]">
          <div className="text-[10px] text-dungeon-pink uppercase font-bold mb-0.5">Stairwell Deadline</div>
          <div className="font-mono text-xl md:text-3xl font-bold text-white">
            {Math.floor(floor.timer / 60).toString().padStart(2, '0')}:{(floor.timer % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className="w-full flex flex-col justify-center gap-1.5 md:gap-2">
          {/* HP Bar */}
          <div className="flex flex-col">
            <div className="flex justify-between text-[9px] text-dungeon-pink font-bold uppercase tracking-wider mb-0.5">
              <span>Health Points</span>
              <span>{player.hp} / {player.maxHp}</span>
            </div>
            <div className="h-2 bg-[#2a0a0a] rounded-full overflow-hidden border border-dungeon-pink/30 shadow-[0_0_5px_rgba(248,81,73,0.1)]">
              <motion.div 
                className="h-full bg-dungeon-pink"
                initial={false}
                animate={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
          </div>

          {/* MP Bar */}
          <div className="flex flex-col">
            <div className="flex justify-between text-[9px] text-dungeon-accent font-bold uppercase tracking-wider mb-0.5">
              <span>Mana Reserve</span>
              <span>{player.mp} / {player.maxMp}</span>
            </div>
            <div className="h-2 bg-[#0a1a2a] rounded-full overflow-hidden border border-dungeon-accent/30">
              <motion.div 
                className="h-full bg-dungeon-accent"
                initial={false}
                animate={{ width: `${(player.mp / player.maxMp) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
          </div>

          {/* XP Bar */}
          <div className="flex flex-col">
            <div className="flex justify-between text-[9px] text-dungeon-dim font-bold uppercase tracking-wider mb-0.5">
              <span>Experience [LVL {player.level}]</span>
              <span>{player.xp} / {player.nextLevelXp}</span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-full overflow-hidden border border-dungeon-border">
              <motion.div 
                className="h-full bg-gradient-to-r from-xp-start to-xp-end"
                initial={false}
                animate={{ width: `${(player.xp / player.nextLevelXp) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN BENTO GRID */}
      <main className="flex-1 flex flex-col md:grid md:grid-cols-[280px_1fr_300px] md:grid-rows-[1fr_200px] gap-4 overflow-y-auto md:overflow-hidden pb-20 md:pb-0">
        
        {/* STATS & SKILLS (Left) - Order 2 on mobile */}
        <div className="order-2 md:order-1 bento-card overflow-y-auto min-h-[400px] md:min-h-0">
          <div className="bento-card-header">Vitals & Status</div>
          <div className="space-y-3 mb-6 bg-dungeon-bg/30 p-3 rounded-lg border border-dungeon-border/50">
             <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-dungeon-pink uppercase">
                  <span>Health</span>
                  <span>{player.hp} / {player.maxHp}</span>
                </div>
                <div className="h-1.5 bg-[#2a0a0a] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-dungeon-pink shadow-[0_0_8px_rgba(248,81,73,0.5)]"
                    animate={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                </div>
             </div>
             <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-dungeon-accent uppercase">
                  <span>Mana</span>
                  <span>{player.mp} / {player.maxMp}</span>
                </div>
                <div className="h-1.5 bg-[#0a1a2a] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-dungeon-accent shadow-[0_0_8px_rgba(88,166,255,0.5)]"
                    animate={{ width: `${(player.mp / player.maxMp) * 100}%` }}
                  />
                </div>
             </div>

             {/* Potion Quick Bar */}
             <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dungeon-border/50">
                <button 
                  onClick={() => usePotion('health')}
                  className="flex items-center justify-between px-2 py-1.5 bg-[#2a0a0a] border border-dungeon-pink/30 rounded hover:bg-dungeon-pink hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-1.5">
                    <Heart size={12} className="text-dungeon-pink group-hover:text-white" />
                    <span className="text-[10px] font-bold">HP POT</span>
                  </div>
                  <span className="text-xs font-black text-white group-hover:text-black">{player.potions.health}</span>
                </button>
                <button 
                  onClick={() => usePotion('mana')}
                  className="flex items-center justify-between px-2 py-1.5 bg-[#0a1a2a] border border-dungeon-accent/30 rounded hover:bg-dungeon-accent hover:text-black transition-all group"
                >
                  <div className="flex items-center gap-1.5">
                    <Droplets size={12} className="text-dungeon-accent group-hover:text-black" />
                    <span className="text-[10px] font-bold">MP POT</span>
                  </div>
                  <span className="text-xs font-black text-white group-hover:text-black">{player.potions.mana}</span>
                </button>
             </div>
          </div>

          <div className="bento-card-header">
            Character Attributes 
            {player.statPoints > 0 && <span className="text-dungeon-gold font-bold">Points: {player.statPoints}</span>}
          </div>
          <div className="space-y-2 mb-6">
            {Object.entries(player.stats).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center font-mono text-sm group">
                <span className="capitalize">{key}:</span>
                <div className="flex items-center gap-3">
                  <span className="text-dungeon-accent font-bold text-lg">{val}</span>
                  {player.statPoints > 0 && (
                    <button 
                      onClick={() => allocateStat(key as keyof Stats)}
                      className="w-5 h-5 bg-dungeon-accent text-black rounded-full flex items-center justify-center font-bold text-xs hover:bg-white transition-all transform hover:scale-110"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bento-card-header">Active Skills</div>
          <div className="space-y-3">
            {player.skills.map(skill => (
              <div 
                key={skill.id} 
                onClick={() => useSkill(skill)}
                className="group cursor-pointer p-2 border border-dungeon-border rounded bg-dungeon-bg/50 hover:border-dungeon-accent transition-all"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-tight text-white">• {skill.name}</span>
                  <span className="text-[9px] text-dungeon-accent font-mono">{skill.mpCost} MP</span>
                </div>
                <div className="text-[10px] text-dungeon-dim line-clamp-1">{skill.description}</div>
              </div>
            ))}
          </div>

          {player.statPoints > 0 && (
            <div className="mt-auto p-2 border border-dashed border-dungeon-gold rounded text-dungeon-gold text-[10px] font-bold text-center animate-pulse uppercase tracking-wider">
              {player.statPoints} STAT POINTS AVAILABLE!
            </div>
          )}
        </div>

        {/* COMBAT VIEWPORT / MAP (Middle) - Order 1 on mobile */}
        <div className="order-1 md:order-2 bento-card combat-viewport bg-[radial-gradient(circle_at_center,#1c2128_0%,#0d1117_100%)] flex items-center justify-center relative border-dungeon-accent/30 overflow-hidden min-h-[350px] md:min-h-0">
          <AnimatePresence mode="wait">
            {combatEnemy ? (
              <motion.div 
                key="combat"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center z-10 w-full"
              >
                <div className="space-y-4">
                  <div className="inline-block bg-dungeon-gold text-black text-[10px] font-bold px-2 py-1 rounded mb-2 uppercase tracking-[2px]">LEVEL {combatEnemy.level} CREATURE</div>
                  <div className="text-4xl font-black text-dungeon-pink uppercase italic tracking-tighter mb-1 drop-shadow-[0_0_10px_rgba(248,81,73,0.3)]">
                    {combatEnemy.name}
                  </div>
                  
                  <div className="w-80 h-5 bg-[#301010] border-2 border-dungeon-pink rounded overflow-hidden mx-auto shadow-[0_0_10px_rgba(248,81,73,0.2)]">
                    <motion.div 
                      className="h-full bg-dungeon-pink"
                      initial={{ width: 0 }}
                      animate={{ width: `${(combatEnemy.hp / combatEnemy.maxHp) * 100}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-dungeon-pink mt-1 mb-6">HP: {combatEnemy.hp} / {combatEnemy.maxHp}</div>

                  <div className="grid grid-cols-2 gap-4 w-80 mx-auto">
                    <button 
                      onClick={() => handleCombat(combatEnemy)}
                      className="bg-dungeon-accent text-black font-black py-3 rounded hover:bg-white transition-all uppercase tracking-widest text-sm"
                    >
                      Attack
                    </button>
                    <button 
                      className="bg-dungeon-pink text-white font-black py-3 rounded hover:bg-white hover:text-dungeon-pink transition-all uppercase tracking-widest text-sm"
                      onClick={() => handleRest()}
                    >
                      Rest (10 MP)
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-1 p-4 bg-dungeon-bg/40 rounded-xl border border-dungeon-border/30 shadow-inner"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
              >
                {floor.grid.length > 0 && floor.grid.map((row, y) => 
                  row.map((tile, x) => {
                    const isPlayer = floor.playerPosition.x === x && floor.playerPosition.y === y;
                    const canGoToNextFloor = tile.type === TileType.STAIRS && isPlayer;
                    
                    return (
                      <div 
                        key={`${x}-${y}`} 
                        className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs border transition-all duration-300 relative
                          ${tile.type === TileType.WALL ? 'bg-dungeon-border border-dungeon-dim' : 'bg-dungeon-surface/30 border-dungeon-border/20'}
                          ${isPlayer ? 'z-10 scale-110' : ''}
                        `}
                      >
                        {isPlayer && (
                          <motion.div 
                            layoutId="player"
                            className="bg-dungeon-accent w-6 h-6 rounded flex items-center justify-center shadow-[0_0_10px_rgba(88,166,255,0.8)]"
                          >
                            <User size={14} className="text-black" />
                          </motion.div>
                        )}
                        {!isPlayer && tile.type === TileType.ENEMY && <Skull size={14} className="text-dungeon-pink opacity-80" />}
                        {!isPlayer && tile.type === TileType.CHEST && <Backpack size={14} className="text-dungeon-gold opacity-80" />}
                        {!isPlayer && tile.type === TileType.STAIRS && (
                          <div className="text-dungeon-accent flex flex-col items-center gap-0">
                            <ChevronRight size={14} className="rotate-90" />
                            <div className="w-4 h-1 bg-dungeon-accent rounded-full -mt-1 shadow-[0_0_5px_#58a6ff]" />
                          </div>
                        )}
                        {canGoToNextFloor && (
                          <button 
                            onClick={nextFloor}
                            className="absolute -bottom-8 bg-dungeon-gold text-black font-bold px-3 py-1 text-[8px] rounded whitespace-nowrap z-20 animate-bounce cursor-pointer shadow-lg active:scale-95"
                          >
                            DESCEND [SPACE]
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
                {/* Movement Controls Overlay for Mobile/Touch */}
                <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-2 opacity-50 hover:opacity-100 transition-opacity">
                  <div />
                  <button onClick={() => movePlayer(0, -1)} className="w-8 h-8 bg-dungeon-surface border border-dungeon-accent rounded flex items-center justify-center hover:bg-dungeon-accent hover:text-black transition-colors">↑</button>
                  <div />
                  <button onClick={() => movePlayer(-1, 0)} className="w-8 h-8 bg-dungeon-surface border border-dungeon-accent rounded flex items-center justify-center hover:bg-dungeon-accent hover:text-black transition-colors">←</button>
                  <button onClick={() => movePlayer(0, 1)} className="w-8 h-8 bg-dungeon-surface border border-dungeon-accent rounded flex items-center justify-center hover:bg-dungeon-accent hover:text-black transition-colors">↓</button>
                  <button onClick={() => movePlayer(1, 0)} className="w-8 h-8 bg-dungeon-surface border border-dungeon-accent rounded flex items-center justify-center hover:bg-dungeon-accent hover:text-black transition-colors">→</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* EQUIPMENT & INVENTORY (Right) - Order 3 on mobile */}
        <div className="order-3 md:order-3 bento-card overflow-y-auto min-h-[400px] md:min-h-0">
          <div className="bento-card-header">Current Equipment</div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div 
              onClick={() => unequipItem('weapon')}
              className={`aspect-square bg-[#0d1117] border rounded-lg flex flex-col items-center justify-center p-2 text-center text-[9px] cursor-pointer transition-all hover:bg-dungeon-pink/10 ${player.equipment.weapon ? 'border-dungeon-accent' : 'border-dungeon-border opacity-50'}`}
            >
              <div className="font-bold text-white mb-1">WEAPON</div>
              <div className="text-dungeon-accent font-bold truncate w-full">{player.equipment.weapon?.name || 'Empty'}</div>
              {player.equipment.weapon && <div className="text-[7px] text-dungeon-pink mt-1 italic">Click to Unequip</div>}
            </div>
            <div 
              onClick={() => unequipItem('armor')}
              className={`aspect-square bg-[#0d1117] border rounded-lg flex flex-col items-center justify-center p-2 text-center text-[9px] cursor-pointer transition-all hover:bg-dungeon-pink/10 ${player.equipment.armor ? 'border-dungeon-accent' : 'border-dungeon-border opacity-50'}`}
            >
              <div className="font-bold text-white mb-1">CHEST</div>
              <div className="text-dungeon-accent font-bold truncate w-full">{player.equipment.armor?.name || 'Empty'}</div>
              {player.equipment.armor && <div className="text-[7px] text-dungeon-pink mt-1 italic">Click to Unequip</div>}
            </div>
            <div className={`aspect-square bg-[#0d1117] border rounded-lg flex flex-col items-center justify-center p-2 text-center text-[9px] border-dungeon-border opacity-50`}>
              <div className="font-bold text-white mb-1">FEET</div>
              <div className="text-dungeon-accent font-bold truncate w-full">Barefoot</div>
            </div>
            <div 
              onClick={() => unequipItem('accessory')}
              className={`aspect-square bg-[#0d1117] border rounded-lg flex flex-col items-center justify-center p-2 text-center text-[9px] cursor-pointer transition-all hover:bg-dungeon-pink/10 ${player.equipment.accessory ? 'border-dungeon-gold' : 'border-dungeon-border opacity-50'}`}
            >
              <div className="font-bold text-white mb-1">ACCESSORY</div>
              <div className="text-dungeon-gold font-bold truncate w-full">{player.equipment.accessory?.name || 'None'}</div>
              {player.equipment.accessory && <div className="text-[7px] text-dungeon-pink mt-1 italic">Click to Unequip</div>}
            </div>
          </div>

          <div className="bento-card-header">Backpack ({player.inventory.length}/50)</div>
          <div className="space-y-1 overflow-y-auto pr-2">
            {player.inventory.length > 0 ? player.inventory.map((item, i) => (
              <div 
                key={item.id + i}
                onClick={() => equipItem(item)}
                className="group flex justify-between items-center p-2 border-b border-dungeon-border text-[10px] hover:bg-dungeon-accent/10 cursor-pointer transition-all"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-white truncate w-32">{item.name}</span>
                  <span className="text-dungeon-dim text-[8px] uppercase">{item.rarity} {item.type}</span>
                </div>
                <button className="text-dungeon-accent font-bold opacity-0 group-hover:opacity-100 transition-opacity">EQUIP</button>
              </div>
            )) : (
              <div className="text-center py-6 text-dungeon-dim text-[10px] italic">INVENTORY EMPTY</div>
            )}
          </div>
        </div>

        {/* SYSTEM CONSOLE LOGS (Bottom Row) */}
        <div className="order-4 md:order-4 bento-card bento-grid col-span-1 md:col-span-3 !grid-cols-1 !grid-rows-1 !p-0 bg-[#0d1117] overflow-hidden min-h-[200px]">
          <div className="bento-card-header !m-0 !p-3 bg-dungeon-surface">System Console Status <span>[ONLINE]</span></div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-2 font-mono text-[11px] leading-relaxed">
            <AnimatePresence mode="popLayout">
              {logs.map((log) => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${
                    log.type === 'AI' ? 'text-dungeon-pink italic' : 
                    log.type === 'COMBAT' ? 'text-white' : 'text-[#88ee88]'
                  } flex gap-4`}
                >
                  <span className="text-dungeon-dim shrink-0">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                  <span>
                    {log.type === 'AI' && <span className="font-bold text-dungeon-pink">AI: </span>}
                    {log.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* FOOTER BAR */}
      <footer className="flex justify-center items-center h-4 font-mono text-[8px] uppercase tracking-[0.3em] text-dungeon-dim gap-8 bg-dungeon-surface/20 rounded-lg">
        <span className="text-dungeon-accent animate-pulse">WORLD DUNGEON LIVE TRANSMISSION ACTIVE</span>
        <span>LATENCY: 0.12MS</span>
        <span>AUDIENCE: {1200 + floor.number * 500}M</span>
      </footer>
    </div>
  );
}
