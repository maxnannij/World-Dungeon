// ==================== DATOS DEL JUEGO ====================
let gameData = {
  gems: 15,
  silver: 2,
  gold: 128,
  currentTab: 0,

  buildings: {
    cuartel: { level: 1, slots: 2, costGold: 150, costWood: 20 },
    taberna: { level: 1, costGold: 200, costIron: 15 },
    almacenamiento: { level: 1, dropBonus: 1, costGold: 120, costWood: 30 },
    mercado: { level: 1, costGold: 450, costCopper: 40 }, // Muy caro como pediste
    taller: { level: 1, costGold: 180, costIron: 25 },
    refugio: { level: 1, costGold: 160, costWood: 25 }
  },

  heroes: [
    { id: 1, name: "Guardia", class: "Guerrero", level: 10, rarity: "Común", power: 45, equipped: {} },
    { id: 2, name: "Clérigo", class: "Sanador", level: 8, rarity: "Raro", power: 38, equipped: {} }
  ],

  dungeons: [
    { id: 1, name: "Jungla Primigenia", progress: 45, max: 150, unlocked: true, bossDefeated: false }
  ],

  materials: {
    madera: 68, cobre: 45, hierro: 28, oroMat: 8
  },

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
  document.querySelectorAll('.tab-btn').forEach((btn, i) => btn.classList.toggle('active', i === tab));
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

// ==================== CUARTEL - MEJORAS ====================
function renderCuartel(container) {
  let html = `<h2 class="text-2xl font-bold mb-6">Cuartel General</h2>`;

  const buildingConfig = {
    cuartel: { icon: "🏰", name: "CUARTELES", desc: `${gameData.heroes.length}/${gameData.buildings.cuartel.slots} aventureros` },
    taberna: { icon: "🍺", name: "TABERNA", desc: "2/2 invitados" },
    almacenamiento: { icon: "📦", name: "ALMACENAMIENTO", desc: `${Object.values(gameData.materials).reduce((a,b)=>a+b)} materiales (+${gameData.buildings.almacenamiento.dropBonus}% drop)` },
    mercado: { icon: "🛒", name: "MERCADO", desc: "0/2 vendidos" },
    taller: { icon: "🔨", name: "TALLER", desc: "0/1 completados" },
    refugio: { icon: "🐾", name: "REFUGIO", desc: "2/2 mascotas" }
  };

  Object.keys(buildingConfig).forEach(key => {
    const b = gameData.buildings[key];
    const cfg = buildingConfig[key];
    html += `
      <div onclick="improveBuilding('${key}')" class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-2xl p-4 mb-4 flex gap-4 cursor-pointer active:scale-95 transition">
        <div class="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-4xl">${cfg.icon}</div>
        <div class="flex-1">
          <div class="font-bold text-lg">${cfg.name} <span class="text-yellow-400 text-sm">Nv.${b.level}</span></div>
          <div class="text-zinc-400 text-sm">${cfg.desc}</div>
        </div>
        <div class="text-right">
          <div class="text-amber-400 text-xl">↑</div>
          <div class="text-xs text-zinc-500 mt-1">Mejorar</div>
        </div>
      </div>`;
  });

  // Botón Reclamar Todo
  html += `
    <button onclick="claimAllMaterials()" class="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-bold text-lg mt-6">
      Reclamar Todo
    </button>`;

  container.innerHTML = html;
}

function improveBuilding(key) {
  const b = gameData.buildings[key];
  let costGold = b.costGold || 100;
  let costMat = {};

  if (key === "cuartel") costMat = { madera: b.level * 15 };
  else if (key === "almacenamiento") costMat = { madera: b.level * 20 };
  else if (key === "mercado") costMat = { cobre: b.level * 35 }; // Muy caro
  else if (key === "taller" || key === "refugio") costMat = { hierro: b.level * 18 };
  else costMat = { madera: b.level * 12 };

  // Verificar si puede pagar
  if (gameData.gold < costGold) {
    alert("❌ Oro insuficiente");
    return;
  }
  for (let mat in costMat) {
    if (!gameData.materials[mat] || gameData.materials[mat] < costMat[mat]) {
      alert(`❌ Falta ${mat}`);
      return;
    }
  }

  // Pagar y subir nivel
  gameData.gold -= costGold;
  Object.keys(costMat).forEach(m => gameData.materials[m] -= costMat[m]);

  b.level++;

  // Bonos específicos
  if (key === "cuartel") b.slots++;
  if (key === "almacenamiento") b.dropBonus += 1;

  // Aumentar costo para próximo nivel
  b.costGold = Math.floor(costGold * 1.6);

  saveGame();
  renderAll();
  alert(`¡${key.toUpperCase()} mejorado a nivel ${b.level}!`);
}

function claimAllMaterials() {
  const gained = Math.floor(Math.random() * 25) + 15;
  gameData.materials.madera += gained;
  alert(`¡Reclamaste ${gained} materiales!`);
  saveGame();
  renderAll();
}

// ==================== HÉROES (mejorado) ====================
function renderHeroes(container) {
  let html = `<h2 class="text-2xl font-bold mb-6">Aventureros (${gameData.heroes.length}/${gameData.buildings.cuartel.slots})</h2>`;
  
  gameData.heroes.forEach(h => {
    html += `
      <div onclick="showHeroModal(${h.id})" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 flex gap-4 mb-4 cursor-pointer">
        <div class="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center text-5xl shadow-inner">🛡️</div>
        <div class="flex-1">
          <div class="font-bold">${h.name} <span class="text-xs px-2 py-0.5 bg-zinc-700 rounded">${h.rarity}</span></div>
          <div class="text-emerald-400">${h.class} • Nv.${h.level}</div>
          <div class="text-yellow-400">Poder: ${h.power}</div>
        </div>
      </div>`;
  });

  container.innerHTML = html;
}

function showHeroModal(id) {
  const hero = gameData.heroes.find(h => h.id === id);
  alert(`🧙 ${hero.name} (${hero.class})\nPoder: ${hero.power}\n\nEquipamiento: Próximamente 7 slots`);
}

// ==================== DUNGEONS & INCURSIONES (básico) ====================
function renderDungeons(container) {
  let html = `<h2 class="text-2xl font-bold mb-6">Dungeons</h2>`;
  gameData.dungeons.forEach(d => {
    const percent = Math.floor((d.progress / d.max) * 100);
    html += `
      <div class="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-4">
        <div class="font-bold text-lg">${d.name}</div>
        <div class="h-3 bg-zinc-800 rounded-full mt-3 overflow-hidden">
          <div class="h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full" style="width: ${percent}%"></div>
        </div>
        <div class="flex justify-between text-xs text-zinc-400 mt-1">
          <span>${d.progress}/${d.max} pasos</span>
          <span class="text-emerald-400">Progreso idle activo</span>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

function renderIncursiones(container) {
  container.innerHTML = `
    <h2 class="text-2xl font-bold mb-6">Incursiones</h2>
    <div class="bg-zinc-900 border border-dashed border-zinc-600 rounded-3xl p-8 text-center">
      <p class="text-zinc-400">Desbloquea con más poder de equipo</p>
      <p class="text-5xl mt-6">⚡</p>
    </div>`;
}

// ==================== EXPORT / IMPORT ====================
function exportSave() {
  const dataStr = JSON.stringify(gameData);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = 'dungeon-idle-save.json';
  link.click();
}

function importSave() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      gameData = JSON.parse(ev.target.result);
      saveGame();
      renderAll();
      alert("✅ Progreso cargado correctamente");
    };
    reader.readAsText(file);
  };
  input.click();
}

// ==================== INICIO ====================
loadGame();
setInterval(saveGame, 20000);

// Progreso offline simple
const offlineMin = Math.floor((Date.now() - gameData.lastSave) / 60000);
if (offlineMin > 3) {
  const extraGold = Math.floor(offlineMin * 1.2);
  gameData.gold += extraGold;
  alert(`¡Volviste después de ${offlineMin} minutos!\nGanaste +${extraGold} oro offline`);
}

// Agregar botones Export/Import en el menú (opcional por ahora)
