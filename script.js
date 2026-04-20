// ==================== DATOS DEL JUEGO ====================
let gameData = {
  gems: 15,
  silver: 2,
  gold: 78,
  currentTab: 0,

  buildings: {
    cuartel: { level: 1, slots: 2 },
    taberna: { level: 1 },
    almacenamiento: { level: 1, dropBonus: 1 },
    mercado: { level: 1 },
    taller: { level: 1 },
    refugio: { level: 1 }
  },

  heroes: [
    { id: 1, name: "Guardia", class: "Guerrero", level: 10, rarity: "Común", power: 45, equipped: {} },
    { id: 2, name: "Clérigo", class: "Sanador", level: 8, rarity: "Raro", power: 38, equipped: {} }
  ],

  dungeons: [
    { id: 1, name: "Jungla Primigenia", progress: 0, max: 150, unlocked: true, bossDefeated: false }
  ],

  materials: {
    madera: 45, cobre: 23, hierro: 12, oro: 5
  },

  lastSave: Date.now()
};

// ==================== FUNCIONES BÁSICAS ====================
function saveGame() {
  gameData.lastSave = Date.now();
  localStorage.setItem("dungeonIdleSave", JSON.stringify(gameData));
  console.log("💾 Juego guardado");
}

function loadGame() {
  const saved = localStorage.getItem("dungeonIdleSave");
  if (saved) {
    gameData = JSON.parse(saved);
    console.log("📂 Juego cargado");
  }
  renderAll();
}

function changeTab(tab) {
  gameData.currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === tab);
  });
  renderAll();
}

function renderAll() {
  const main = document.getElementById("main-content");
  main.innerHTML = "";

  if (gameData.currentTab === 0) renderCuartel(main);
  else if (gameData.currentTab === 1) renderHeroes(main);
  else if (gameData.currentTab === 2) renderDungeons(main);
  else if (gameData.currentTab === 3) renderIncursiones(main);

  // Actualizar recursos
  document.getElementById("gems").textContent = gameData.gems;
  document.getElementById("silver").textContent = gameData.silver;
  document.getElementById("gold").textContent = gameData.gold;
}

// ==================== CUARTEL ====================
function renderCuartel(container) {
  let html = `<h2 class="text-2xl font-bold mb-6">Cuartel General</h2>`;

  const buildingsList = [
    { key: "cuartel", icon: "🏰", name: "CUARTELES", desc: `${gameData.heroes.length}/${gameData.buildings.cuartel.slots} aventureros` },
    { key: "taberna", icon: "🍺", name: "TABERNA", desc: "2/2 invitados" },
    { key: "almacenamiento", icon: "📦", name: "ALMACENAMIENTO", desc: `${Object.values(gameData.materials).reduce((a,b)=>a+b)} materiales` },
    { key: "mercado", icon: "🛒", name: "MERCADO", desc: "0/2 vendidos" },
    { key: "taller", icon: "🔨", name: "TALLER", desc: "0/1 completados" },
    { key: "refugio", icon: "🐾", name: "REFUGIO", desc: "2/2 mascotas" }
  ];

  buildingsList.forEach(b => {
    html += `
      <div onclick="improveBuilding('${b.key}')" class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-3 flex gap-4 cursor-pointer">
        <div class="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-3xl">${b.icon}</div>
        <div class="flex-1">
          <div class="font-bold">${b.name}</div>
          <div class="text-zinc-400 text-sm">${b.desc}</div>
        </div>
        <div class="text-yellow-400 text-xl">↑</div>
      </div>`;
  });

  container.innerHTML = html;
}

function improveBuilding(key) {
  alert(`Mejorando ${key.toUpperCase()}... (aquí irá el sistema de costo + materiales)`);
  // Vamos a implementar el sistema completo en la próxima iteración
}

// ==================== OTRAS PESTAÑAS (básicas por ahora) ====================
function renderHeroes(container) {
  let html = `<h2 class="text-2xl font-bold mb-6">Aventureros</h2>`;
  gameData.heroes.forEach(h => {
    html += `
      <div onclick="showHeroModal(${h.id})" class="bg-zinc-900 border border-zinc-700 rounded-xl p-3 flex gap-3 mb-3 cursor-pointer">
        <div class="w-14 h-14 bg-zinc-700 rounded-lg flex items-center justify-center text-4xl">🧙</div>
        <div>
          <div class="font-bold">${h.name} <span class="text-xs text-amber-400">${h.rarity}</span></div>
          <div class="text-sm text-zinc-400">${h.class} • Nivel ${h.level}</div>
          <div class="text-yellow-400 text-xs">Poder: ${h.power}</div>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

function showHeroModal(id) {
  alert("Modal de héroe con equipamiento (próxima iteración)");
}

function renderDungeons(container) {
  let html = `<h2 class="text-2xl font-bold mb-6">Dungeons</h2>`;
  gameData.dungeons.forEach(d => {
    html += `
      <div class="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-4">
        <div class="font-bold">${d.name}</div>
        <div class="h-2 bg-zinc-800 rounded mt-2">
          <div class="h-2 bg-yellow-400 rounded" style="width: ${(d.progress/d.max)*100}%"></div>
        </div>
        <div class="text-xs text-zinc-400 mt-1">${d.progress}/${d.max} pasos</div>
      </div>`;
  });
  container.innerHTML = html;
}

function renderIncursiones(container) {
  container.innerHTML = `<h2 class="text-2xl font-bold mb-6">Incursiones</h2><p class="text-zinc-400">Se desbloquean con más poder de equipo...</p>`;
}

// ==================== INICIO ====================
loadGame();
setInterval(() => {
  saveGame();
}, 30000); // auto-save cada 30 segundos

// Offline progress (simple)
window.addEventListener("load", () => {
  const offlineTime = (Date.now() - gameData.lastSave) / 1000 / 60; // minutos
  if (offlineTime > 5) {
    alert(`¡Bienvenido de vuelta! Estuviste offline ${Math.floor(offlineTime)} minutos.`);
    // Aquí calcularemos progreso offline después
  }
});
