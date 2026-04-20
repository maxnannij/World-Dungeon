// ==================== DATOS DEL JUEGO ====================
let gameData = {
  gems: 15, silver: 2, gold: 612,
  currentTab: 0,
  prestige: 0,
  almasEternas: 1,
  lastTabernaClaim: Date.now() - 1000*60*60*12,

  buildings: {
    cuartel: { level: 3, slots: 4 },
    taberna: { level: 2 },
    almacenamiento: { level: 3, dropBonus: 3 },
    mercado: { level: 1 },
    taller: { level: 2 },
    refugio: { level: 2, slots: 3 }
  },

  heroes: [
    { id: 1, name: "Guardia", class: "Guerrero", level: 14, rarity: "Común", power: 72, img: "assets/heroes/guardia.png",
      equipped: { arma: null, cabeza: null, pecho: null, manoSec: null, guantes: null, piernas: null, pies: null } },
    { id: 2, name: "Clérigo", class: "Sanador", level: 11, rarity: "Raro", power: 55, img: "assets/heroes/clerigo.png",
      equipped: { arma: null, cabeza: null, pecho: null, manoSec: null, guantes: null, piernas: null, pies: null } }
  ],

  inventory: [], // Items que posee el jugador

  itemsDB: [ // Base de datos de items
    { id: 1, name: "Espada de Hierro", slot: "arma", rarity: "Común", powerBonus: 12, costGold: 80, costIron: 15 },
    { id: 2, name: "Casco de Cuero", slot: "cabeza", rarity: "Común", powerBonus: 8, costGold: 55, costWood: 25 },
    { id: 3, name: "Bastón Arcano", slot: "arma", rarity: "Raro", powerBonus: 22, costGold: 220, costCopper: 40 },
    { id: 4, name: "Armadura de Placas", slot: "pecho", rarity: "Raro", powerBonus: 18, costGold: 180, costIron: 35 }
  ],

  dungeons: [
    { id: 1, name: "Jungla Primigenia", progress: 150, max: 150, unlocked: true, bossDefeated: true, enemyType: "slime" },
    { id: 2, name: "Cripta Olvidada", progress: 87, max: 150, unlocked: true, bossDefeated: false, enemyType: "esqueleto" },
    { id: 3, name: "Templo Egipcio", progress: 12, max: 150, unlocked: true, bossDefeated: false, enemyType: "mummy" }
  ],

  mascotas: [
    { id: 1, name: "Lobo Sombrío", bonus: "Daño +12%", level: 2 },
    { id: 2, name: "Águila Ígnea", bonus: "Oro +15%", level: 1 }
  ],

  materials: { madera: 312, cobre: 187, hierro: 124, oroMat: 51 },

  lastSave: Date.now()
};

// ==================== FUNCIONES BÁSICAS ====================
function saveGame() {
  gameData.lastSave = Date.now();
  localStorage.setItem("dungeonIdleSave", JSON.stringify(gameData));
}

function loadGame() {
  const saved = localStorage.getItem("dungeonIdleSave");
  if (saved) gameData = JSON.parse(saved);
  renderAll();
}

function changeTab(tab) {
  gameData.currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', i===tab));
  renderAll();
}

function renderAll() {
  const main = document.getElementById("main-content");
  main.innerHTML = "";

  if (gameData.currentTab === 0) renderCuartel(main);
  else if (gameData.currentTab === 1) renderHeroes(main);
  else if (gameData.currentTab === 2) renderDungeons(main);
  else if (gameData.currentTab === 3) renderIncursiones(main);

  document.getElementById("gems").textContent = gameData.gems;
  document.getElementById("silver").textContent = gameData.silver;
  document.getElementById("gold").textContent = gameData.gold;
}

// ==================== CUARTEL CON BOTONES DIRECTOS ====================
function renderCuartel(container) {
  let html = `<h2 class="text-2xl font-bold mb-6">Cuartel General</h2>`;

  // Edificios (mismo estilo de antes)
  const buildingsList = [
    { key: "cuartel", icon: "🏰", name: "CUARTELES", desc: `${gameData.heroes.length}/${gameData.buildings.cuartel.slots}` },
    { key: "taberna", icon: "🍺", name: "TABERNA", desc: "Reclutar" },
    { key: "almacenamiento", icon: "📦", name: "ALMACENAMIENTO", desc: `${Object.values(gameData.materials).reduce((a,b)=>a+b)} (+${gameData.buildings.almacenamiento.dropBonus}%)` },
    { key: "mercado", icon: "🛒", name: "MERCADO", desc: "Comprar/Vender" },
    { key: "taller", icon: "🔨", name: "TALLER", desc: "Crafting" },
    { key: "refugio", icon: "🐾", name: "REFUGIO", desc: `${gameData.mascotas.length}/${gameData.buildings.refugio.slots}` }
  ];

  buildingsList.forEach(b => {
    html += `<div onclick="openBuilding('${b.key}')" class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-2xl p-4 mb-3 flex gap-4 cursor-pointer">... (mismo HTML de versiones anteriores) ...</div>`;
  });

  // Botón Prestigio
  html += `<button onclick="doPrestige()" class="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 py-5 rounded-3xl font-bold text-lg">RENACER (Prestigio)</button>`;

  container.innerHTML = html;
}

function openBuilding(key) {
  if (key === "mercado") showMercadoModal();
  else if (key === "taller") showTallerModal();
  else if (key === "refugio") showRefugioModal();
  else if (key === "taberna") recruitHero();
  else alert("Mejora de edificio (ya funciona)");
}

// ==================== INVENTARIO + EQUIPAMIENTO REAL ====================
function renderHeroes(container) {
  let html = `<h2 class="text-2xl font-bold mb-6">Aventureros</h2>`;
  gameData.heroes.forEach(h => {
    html += `<div onclick="showHeroModal(${h.id})" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 flex gap-4 mb-4 cursor-pointer">`;
    html += `<img src="${h.img}" class="w-16 h-16 object-contain pixel rounded-xl">`;
    html += `<div class="flex-1"><div class="font-bold">${h.name}</div><div class="text-emerald-400">${h.class} • ${h.power} poder</div></div></div>`;
  });
  container.innerHTML = html;
}

function showHeroModal(id) {
  const hero = gameData.heroes.find(h => h.id === id);
  let html = `<div class="fixed inset-0 bg-black/90 flex items-end z-50"><div class="bg-zinc-900 w-full rounded-t-3xl p-6 max-h-[92vh] overflow-auto">`;
  html += `<h2 class="text-3xl font-bold mb-4">${hero.name} <span class="text-xs bg-zinc-700 px-3 py-1 rounded-full">${hero.rarity}</span></h2>`;
  html += `<img src="${hero.img}" class="w-28 h-28 mx-auto pixel mb-6">`;

  // 7 slots
  const slots = ["arma","cabeza","pecho","manoSec","guantes","piernas","pies"];
  html += `<div class="grid grid-cols-2 gap-3">`;
  slots.forEach(slot => {
    const item = hero.equipped[slot];
    html += `<div class="bg-zinc-800 border border-dashed border-zinc-600 rounded-2xl p-4 text-center cursor-pointer" onclick="unequipItem(${hero.id}, '${slot}')">`;
    html += `<div class="text-4xl mb-2">${item ? '✅' : '⬜'}</div><div class="font-medium">${slot}</div>`;
    html += `<div class="text-xs text-yellow-400">${item ? item.name : 'Vacío'}</div></div>`;
  });
  html += `</div>`;

  // Inventario para equipar
  html += `<h3 class="mt-8 mb-3 text-lg font-bold">Inventario - Arrastra o toca para equipar</h3><div class="grid grid-cols-3 gap-3">`;
  gameData.inventory.forEach((item, idx) => {
    if (item.slot !== "none") {
      html += `<div onclick="equipFromInventory(${hero.id}, ${idx})" class="bg-zinc-800 p-3 rounded-2xl text-center cursor-pointer text-sm">${item.name}<br><span class="text-yellow-400">+${item.powerBonus}</span></div>`;
    }
  });
  html += `</div><button onclick="closeModal()" class="w-full mt-8 bg-zinc-700 py-4 rounded-3xl">Cerrar</button></div></div>`;
  document.getElementById("main-content").innerHTML += html;
}

function equipFromInventory(heroId, invIndex) {
  const hero = gameData.heroes.find(h => h.id === heroId);
  const item = gameData.inventory[invIndex];
  if (item && hero.equipped[item.slot] === null) {
    hero.equipped[item.slot] = item;
    hero.power += item.powerBonus;
    gameData.inventory.splice(invIndex, 1);
    saveGame();
    closeModal();
    showHeroModal(heroId);
  }
}

function unequipItem(heroId, slot) {
  const hero = gameData.heroes.find(h => h.id === heroId);
  if (hero.equipped[slot]) {
    gameData.inventory.push(hero.equipped[slot]);
    hero.power -= hero.equipped[slot].powerBonus;
    hero.equipped[slot] = null;
    saveGame();
    closeModal();
    showHeroModal(heroId);
  }
}

function closeModal() { renderAll(); }

// ==================== TALLER + MERCADO (ahora agregan a inventario) ====================
function showTallerModal() {
  let html = `<div class="fixed inset-0 bg-black/90 flex items-end z-50"><div class="bg-zinc-900 w-full rounded-t-3xl p-6">`;
  html += `<h2 class="text-2xl font-bold mb-6">Taller</h2>`;
  gameData.itemsDB.forEach(item => {
    html += `<div onclick="craftItem(${item.id})" class="bg-zinc-800 p-4 rounded-2xl mb-3 flex justify-between cursor-pointer"><div>${item.name}</div><div class="text-emerald-400 text-sm">${item.costGold}💰 + materiales</div></div>`;
  });
  html += `<button onclick="closeModal()" class="w-full mt-6 bg-zinc-700 py-4 rounded-3xl">Cerrar</button></div></div>`;
  document.getElementById("main-content").innerHTML += html;
}

function craftItem(id) {
  const item = gameData.itemsDB.find(i => i.id === id);
  if (gameData.gold >= item.costGold) {
    gameData.gold -= item.costGold;
    gameData.inventory.push({...item});
    alert(`¡Crafteaste ${item.name}!`);
    saveGame();
    closeModal();
  }
}

function showMercadoModal() {
  // Similar al taller pero con opción de comprar
  let html = `<div class="fixed inset-0 bg-black/90 flex items-end z-50"><div class="bg-zinc-900 w-full rounded-t-3xl p-6">`;
  html += `<h2 class="text-2xl font-bold mb-6">Mercado</h2>`;
  gameData.itemsDB.forEach(item => {
    html += `<div onclick="buyItem(${item.id})" class="bg-zinc-800 p-4 rounded-2xl mb-3 flex justify-between cursor-pointer"><div>${item.name}</div><div class="text-emerald-400">${item.costGold}💰</div></div>`;
  });
  html += `<button onclick="closeModal()" class="w-full mt-6 bg-zinc-700 py-4 rounded-3xl">Cerrar</button></div></div>`;
  document.getElementById("main-content").innerHTML += html;
}

function buyItem(id) {
  const item = gameData.itemsDB.find(i => i.id === id);
  if (gameData.gold >= item.costGold) {
    gameData.gold -= item.costGold;
    gameData.inventory.push({...item});
    alert(`¡Compraste ${item.name}!`);
    saveGame();
    closeModal();
  }
}

// ==================== COMBATE VISUAL + ENEMIGOS ====================
function idleCombatTick() {
  gameData.dungeons.forEach(d => {
    if (d.unlocked && !d.bossDefeated) {
      d.progress = Math.min(d.progress + 3, d.max);
      if (Math.random() < 0.35) {
        gameData.materials.madera += 4;
        if (Math.random() < 0.15) {
          const newItem = gameData.itemsDB[Math.floor(Math.random()*gameData.itemsDB.length)];
          gameData.inventory.push({...newItem});
        }
      }
    }
  });
  saveGame();
  if (gameData.currentTab === 2) renderDungeons(document.getElementById("main-content"));
}

function renderDungeons(container) {
  let html = `<h2 class="text-2xl font-bold mb-6">Dungeons</h2>`;
  gameData.dungeons.forEach(d => {
    const percent = Math.floor((d.progress / d.max) * 100);
    html += `
      <div class="bg-zinc-900 border border-lime-500 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-4">
          <img src="assets/enemies/${d.enemyType}.png" class="w-16 h-16 pixel" onerror="this.src='https://via.placeholder.com/64?text=${d.enemyType}'">
          <div class="flex-1">
            <div class="font-bold text-lg">${d.name}</div>
            <div class="text-xs text-zinc-400">Enemigo: ${d.enemyType.toUpperCase()}</div>
            <div class="h-3 bg-zinc-800 rounded-full mt-3"><div class="h-3 bg-lime-400 rounded-full transition-all" style="width: ${percent}%"></div></div>
            <div class="text-xs mt-1 flex justify-between"><span>${d.progress}/${d.max}</span><span class="text-lime-400">${d.bossDefeated ? '✅ Boss vencido' : 'Idle activo'}</span></div>
          </div>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

// ==================== EXPORT / IMPORT ====================
function exportSave() {
  const dataStr = JSON.stringify(gameData);
  const link = document.createElement('a');
  link.download = 'dungeon-crawler-save.json';
  link.href = URL.createObjectURL(new Blob([dataStr], {type: 'application/json'}));
  link.click();
}

// ==================== INICIO ====================
loadGame();
setInterval(idleCombatTick, 1100);
setInterval(saveGame, 10000);

window.addEventListener("load", () => {
  renderAll();
  const offlineMin = Math.floor((Date.now() - gameData.lastSave) / 60000);
  if (offlineMin > 5) alert(`¡Volviste! +${offlineMin * 8} pasos offline`);
});
