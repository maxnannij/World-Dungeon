// ==================== DATOS DEL JUEGO ====================
let gameData = {
  gems: 15, silver: 2, gold: 487,
  currentTab: 0,
  prestige: 0,
  almasEternas: 0,
  lastTabernaClaim: Date.now() - 1000*60*60*18, // para testing rápido

  buildings: {
    cuartel: { level: 2, slots: 3 },
    taberna: { level: 1 },
    almacenamiento: { level: 2, dropBonus: 2 },
    mercado: { level: 1 },
    taller: { level: 1 },
    refugio: { level: 1, slots: 2 }
  },

  heroes: [ /* mismos 2 héroes de antes + equipped */ ],

  mascotas: [
    { id: 1, name: "Lobo Sombrío", bonus: "Daño +8%", level: 1 },
    { id: 2, name: "Águila de Fuego", bonus: "Oro +12%", level: 1 }
  ],

  items: [ /* mismos items + 2 nuevos */ 
    { id: 4, name: "Poción de Vida", slot: "none", rarity: "Común", powerBonus: 0, costGold: 25, costWood: 10 }
  ],

  dungeons: [
    { id: 1, name: "Jungla Primigenia", progress: 142, max: 150, unlocked: true, bossDefeated: true, enemyType: "slime" },
    { id: 2, name: "Cripta Olvidada", progress: 23, max: 150, unlocked: true, bossDefeated: false, enemyType: "esqueleto" },
    { id: 3, name: "Templo Egipcio", progress: 0, max: 150, unlocked: false, bossDefeated: false, enemyType: "mummy" }
  ],

  materials: { madera: 231, cobre: 134, hierro: 98, oroMat: 37 },

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

function renderAll() { /* mismo que antes */ }

// ==================== MERCADO ====================
function showMercadoModal() {
  let html = `<div class="fixed inset-0 bg-black/90 flex items-end z-50"><div class="bg-zinc-900 w-full rounded-t-3xl p-6">`;
  html += `<h2 class="text-2xl font-bold mb-4">Mercado (Nv.${gameData.buildings.mercado.level})</h2>`;
  
  gameData.items.forEach(item => {
    html += `
      <div class="flex justify-between items-center bg-zinc-800 p-3 rounded-2xl mb-2">
        <div>${item.name} <span class="text-xs text-yellow-400">${item.rarity}</span></div>
        <div class="text-right">
          <button onclick="buyItem(${item.id})" class="bg-emerald-600 px-4 py-1 rounded-xl text-sm">Comprar ${item.costGold}💰</button>
        </div>
      </div>`;
  });

  html += `<button onclick="closeModal()" class="w-full mt-6 bg-zinc-700 py-4 rounded-2xl">Cerrar</button></div></div>`;
  document.getElementById("main-content").innerHTML += html;
}

function buyItem(id) {
  const item = gameData.items.find(i => i.id === id);
  if (gameData.gold >= item.costGold) {
    gameData.gold -= item.costGold;
    alert(`¡Compraste ${item.name}! (guárdalo en inventario o equipa)`);
    saveGame();
    renderAll();
  }
}

// ==================== REFUGIO + MASCOTAS ====================
function showRefugioModal() {
  let html = `<div class="fixed inset-0 bg-black/90 flex items-end z-50"><div class="bg-zinc-900 w-full rounded-t-3xl p-6">`;
  html += `<h2 class="text-2xl font-bold mb-4">Refugio - Mascotas (${gameData.mascotas.length}/${gameData.buildings.refugio.slots})</h2>`;
  
  gameData.mascotas.forEach(m => {
    html += `<div class="bg-zinc-800 p-4 rounded-2xl mb-3 flex justify-between"><div>${m.name}<br><span class="text-xs text-orange-400">${m.bonus}</span></div><div class="text-3xl">🐺</div></div>`;
  });

  html += `<button onclick="closeModal()" class="w-full mt-6 bg-zinc-700 py-4 rounded-2xl">Cerrar</button></div></div>`;
  document.getElementById("main-content").innerHTML += html;
}

// ==================== COMBATE CON ENEMIGOS ====================
function idleCombatTick() {
  gameData.dungeons.forEach(d => {
    if (d.unlocked && !d.bossDefeated) {
      d.progress = Math.min(d.progress + 2, d.max); // idle más rápido para testing

      if (Math.random() < 0.4) {
        gameData.materials.madera += 3;
        if (Math.random() < 0.2) gameData.mascotas.push({id: Date.now(), name: "Nueva mascota", bonus: "+5% todo", level: 1});
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
      <div class="bg-zinc-900 border ${d.unlocked ? 'border-lime-500' : 'border-zinc-700'} rounded-3xl p-5 mb-4">
        <div class="flex items-center gap-3">
          <div class="text-5xl">🌿</div> <!-- cambiar por imagen real -->
          <div class="flex-1">
            <div class="font-bold">${d.name}</div>
            <div class="text-xs text-zinc-400">Enemigo: ${d.enemyType}</div>
            <div class="h-3 bg-zinc-800 rounded-full mt-2"><div class="h-3 bg-lime-400 rounded-full" style="width:${percent}%"></div></div>
          </div>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

// ==================== PRESTIGIO ====================
function doPrestige() {
  if (confirm("¿Renacer? Pierdes todo pero ganas 1 Alma Eterna por cada dungeon completado.")) {
    gameData.almasEternas += gameData.dungeons.filter(d => d.bossDefeated).length;
    // reset parcial
    gameData.gold = 50;
    gameData.dungeons.forEach(d => { d.progress = 0; d.unlocked = d.id === 1; });
    alert(`¡Renaciste! +${gameData.almasEternas} Almas Eternas permanentes`);
    saveGame();
    renderAll();
  }
}

// ==================== INICIO ====================
loadGame();
setInterval(idleCombatTick, 1200);
setInterval(saveGame, 12000);

window.addEventListener("load", () => {
  renderAll();
  // offline progress...
});
