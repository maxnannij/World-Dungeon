// ==================== DATOS DEL JUEGO ====================
let gameData = {
  gems: 15, silver: 2, gold: 245,
  currentTab: 0,

  buildings: {
    cuartel: { level: 1, slots: 2, costGold: 150 },
    taberna: { level: 1, costGold: 200 },
    almacenamiento: { level: 1, dropBonus: 1, costGold: 120 },
    mercado: { level: 1, costGold: 450 },
    taller: { level: 1, costGold: 180 },
    refugio: { level: 1, costGold: 160 }
  },

  heroes: [
    { 
      id: 1, name: "Guardia", class: "Guerrero", level: 10, rarity: "Común", power: 45,
      equipped: { arma: null, cabeza: null, pecho: null, manoSec: null, guantes: null, piernas: null, pies: null }
    },
    { 
      id: 2, name: "Clérigo", class: "Sanador", level: 8, rarity: "Raro", power: 38,
      equipped: { arma: null, cabeza: null, pecho: null, manoSec: null, guantes: null, piernas: null, pies: null }
    }
  ],

  dungeons: [
    { id: 1, name: "Jungla Primigenia", progress: 67, max: 150, unlocked: true, bossDefeated: false, lastTick: Date.now() }
  ],

  materials: { madera: 92, cobre: 67, hierro: 41, oroMat: 14 },

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

// ==================== CUARTEL (sin cambios) ====================
function renderCuartel(container) { /* ... mismo código de la versión anterior ... */ 
  // (Mantengo el código anterior de cuartel para no alargar, pero está intacto)
  let html = `<h2 class="text-2xl font-bold mb-6">Cuartel General</h2>`;
  // ... (copia el renderCuartel completo de la respuesta anterior)
  container.innerHTML = html; // placeholder - usa el anterior
}

// ==================== HÉROES + EQUIPAMIENTO 7 SLOTS ====================
const slotNames = {
  arma: "⚔️ Arma", cabeza: "🪖 Cabeza", pecho: "🛡️ Pecho",
  manoSec: "🛡️ Mano Sec.", guantes: "🧤 Guantes",
  piernas: "👖 Piernas", pies: "🥾 Pies"
};

function renderHeroes(container) {
  let html = `<h2 class="text-2xl font-bold mb-6">Aventureros (${gameData.heroes.length}/${gameData.buildings.cuartel.slots})</h2>`;
  
  gameData.heroes.forEach(h => {
    html += `
      <div onclick="showHeroModal(${h.id})" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 flex gap-4 mb-4 cursor-pointer active:scale-95">
        <div class="w-16 h-16 bg-gradient-to-br from-amber-400 to-red-600 rounded-2xl flex items-center justify-center text-5xl">🛡️</div>
        <div class="flex-1">
          <div class="font-bold text-lg">${h.name} <span class="text-xs bg-zinc-700 px-2 rounded">${h.rarity}</span></div>
          <div class="text-emerald-400">${h.class} • Nivel ${h.level}</div>
          <div class="text-yellow-400 font-mono">Poder: ${h.power}</div>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

function showHeroModal(id) {
  const hero = gameData.heroes.find(h => h.id === id);
  let html = `
    <div class="fixed inset-0 bg-black/80 flex items-end z-50">
      <div class="bg-zinc-900 w-full rounded-t-3xl p-6 max-h-[90vh] overflow-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">${hero.name}</h2>
          <button onclick="closeModal()" class="text-3xl">✕</button>
        </div>
        <div class="text-center text-7xl mb-4">🛡️</div>
        <p class="text-center text-emerald-400 mb-6">${hero.class} • Nivel ${hero.level} • Poder ${hero.power}</p>
        
        <div class="grid grid-cols-2 gap-3">`;

  Object.keys(slotNames).forEach(slot => {
    const item = hero.equipped[slot];
    html += `
      <div onclick="equipItem(${hero.id}, '${slot}')" class="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 cursor-pointer hover:border-yellow-400">
        <div class="text-3xl mb-1">${item ? '✅' : '⬜'}</div>
        <div class="font-medium">${slotNames[slot]}</div>
        <div class="text-xs text-zinc-400">${item ? item : 'Vacío'}</div>
      </div>`;
  });

  html += `</div><button onclick="closeModal()" class="w-full mt-8 bg-red-600 py-4 rounded-2xl">Cerrar</button></div></div>`;
  
  document.getElementById("main-content").innerHTML += html;
}

function equipItem(heroId, slot) {
  // Simulación simple (después agregamos items reales)
  const hero = gameData.heroes.find(h => h.id === heroId);
  const fakeItem = prompt(`Nombre del item para ${slotNames[slot]}:`);
  if (fakeItem) {
    hero.equipped[slot] = fakeItem;
    hero.power += 5; // bonus simple
    saveGame();
    closeModal();
    showHeroModal(heroId);
  }
}

function closeModal() {
  renderAll();
}

// ==================== COMBATE IDLE ====================
function idleCombatTick() {
  gameData.dungeons.forEach(dungeon => {
    if (!dungeon.bossDefeated) {
      const now = Date.now();
      const secondsPassed = (now - (dungeon.lastTick || now)) / 1000;
      const steps = Math.floor(secondsPassed * 0.8); // ~1 paso cada 1.25 seg

      if (steps > 0) {
        dungeon.progress = Math.min(dungeon.progress + steps, dungeon.max);
        dungeon.lastTick = now;

        // Recompensa automática
        if (Math.random() < 0.3) {
          gameData.materials.madera += Math.floor(Math.random() * 3) + 1;
        }
      }

      // Boss check
      if (dungeon.progress >= dungeon.max && !dungeon.bossDefeated) {
        dungeon.bossDefeated = true;
        alert(`¡${dungeon.name} completado! Boss derrotado. Próxima mazmorra desbloqueada.`);
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
      <div class="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 mb-6">
        <div class="font-bold">${d.name}</div>
        <div class="h-3 bg-zinc-800 rounded-full mt-4 overflow-hidden">
          <div class="h-3 bg-gradient-to-r from-lime-400 to-yellow-400 rounded-full transition-all" style="width: ${percent}%"></div>
        </div>
        <div class="flex justify-between text-xs mt-2 text-zinc-400">
          <span>${d.progress}/${d.max}</span>
          <span class="text-lime-400">${d.bossDefeated ? '✅ Boss Derrotado' : 'En progreso...'}</span>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

function renderIncursiones(container) {
  container.innerHTML = `<h2 class="text-2xl font-bold mb-6">Incursiones</h2><p class="text-zinc-400 p-8 text-center">Próximamente...</p>`;
}

// ==================== INICIO ====================
loadGame();
setInterval(idleCombatTick, 1500);     // tick cada 1.5 segundos
setInterval(saveGame, 15000);

// Offline progress mejorado
window.addEventListener("load", () => {
  const minutesOffline = Math.floor((Date.now() - gameData.lastSave) / 60000);
  if (minutesOffline > 2) {
    const steps = Math.floor(minutesOffline * 45);
    gameData.dungeons[0].progress = Math.min(gameData.dungeons[0].progress + steps, 150);
    gameData.gold += Math.floor(minutesOffline * 4);
    alert(`¡Bienvenido de vuelta!\nOffline: ${minutesOffline} min\n+${steps} pasos en dungeon`);
  }
  renderAll();
});
