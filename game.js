/**
 * FOLDER RUN 2.0 - REFATORED (OOP)
 */

// =========================
// 1. CONFIG & DATA
// =========================
const MAPS = [
  { name:"Cidade", desc:"Azul urbano", bgTop:"#87CEEB", bgBot:"#1E90FF" },
  { name:"Deserto", desc:"Areia quente", bgTop:"#FFD700", bgBot:"#FFA500" },
  { name:"Praia",  desc:"Mar + sol",   bgTop:"#1E90FF", bgBot:"#FFD700" },
  { name:"Noite",  desc:"Neon escuro", bgTop:"#0b1020", bgBot:"#1f2937" },
];

const CARS = [
  { name:"Vermelho Clássico", color:"#ff2d2d" },
  { name:"Azul Turbo",       color:"#2563eb" },
  { name:"Verde Ácido",      color:"#22c55e" },
  { name:"Amarelo Nitro",    color:"#facc15" },
  { name:"Roxo Neon",        color:"#a855f7" },
];

const WEAPONS = [
  { name:"Padrão",    desc:"Tiro único, equilibrado", cooldown: 220, spread: 0, pierce: 0 },
  { name:"Rápido",    desc:"Menor cooldown",          cooldown: 120, spread: 0, pierce: 0 },
  { name:"Duplo",     desc:"2 tiros com leve spread", cooldown: 220, spread: 10, pierce: 0 },
  { name:"Perfura 1", desc:"Atravessa 1 inimigo",     cooldown: 240, spread: 0, pierce: 1 },
];

// =========================
// 2. UTILS
// =========================
const $ = (id) => document.getElementById(id);

class AudioSys {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
  playTone(freq=440, dur=0.06, type="square", gain=0.05) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + dur);
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function getLanesX(count) {
  const w = innerWidth;
  const left = w * 0.18;
  const right = w * 0.82;
  const step = (right - left) / (count - 1);
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(left + i * step);
  return arr;
}

// =========================
// 3. UI MANAGER
// =========================
class UIManager {
  constructor(game) {
    this.game = game;
    this.els = {
      opening: $("openingScreen"),
      start: $("startScreen"),
      gameRoot: $("gameRoot"),
      end: $("endScreen"),
      hudScore: $("hudScore"),
      hudLives: $("hudLives"),
      hudCombo: $("hudCombo"),
      hudLevel: $("hudLevel"),
      toast: $("toast"),
      shopGrid: $("shopGrid"),
      mapGrid: $("mapGrid"),
      trophyList: $("trophyList"),
      endTitle: $("endTitle"),
      endMsg: $("endMsg"),
      endScore: $("endScore"),
      btnPause: $("btnPause")
    };
    
    this.modals = {
      shop: $("shopModal"),
      map: $("mapModal"),
      trophy: $("trophyModal")
    };

    this.bindEvents();
  }

  bindEvents() {
    // Navigations
    $("openContinue").onclick = () => this.game.setMode("start");
    $("startButton").onclick = () => this.game.startGame();
    $("btnRestart").onclick = () => this.game.resetGame();
    $("endPlayAgain").onclick = () => this.game.startGame();
    $("endBack").onclick = () => this.game.setMode("start");
    $("btnPause").onclick = () => this.game.togglePause();

    // Modals Open
    const openShop = () => { this.buildShop(); this.showModal("shop"); };
    const openMaps = () => { this.buildMaps(); this.showModal("map"); };
    const openTrophies = () => { this.buildTrophies(); this.showModal("trophy"); };

    $("btnShopOpen").onclick = openShop;
    $("btnShopOpen2").onclick = openShop;
    $("btnMapOpen").onclick = openMaps;
    $("btnMapOpen2").onclick = openMaps;
    $("btnTrophyOpen").onclick = openTrophies;
    $("btnTrophyOpen2").onclick = openTrophies;

    // Modals Close
    $("shopClose").onclick = () => this.hideModal("shop");
    $("mapClose").onclick = () => this.hideModal("map");
    $("trophyClose").onclick = () => this.hideModal("trophy");
    
    // Click outside
    Object.values(this.modals).forEach(m => {
      m.addEventListener("pointerdown", e => { if(e.target === m) m.classList.add("hidden"); });
    });
  }

  setScreen(mode) {
    this.els.opening.classList.toggle("hidden", mode !== "opening");
    this.els.start.classList.toggle("hidden", mode !== "start");
    this.els.gameRoot.classList.toggle("hidden", mode !== "game");
    this.els.end.classList.toggle("hidden", mode !== "end");
  }

  updateHUD(score, lives, combo, level) {
    this.els.hudScore.textContent = `Score: ${score}`;
    this.els.hudLives.textContent = `Vidas: ${lives}`;
    this.els.hudCombo.textContent = `Combo: x${combo}`;
    this.els.hudLevel.textContent = `Nível: ${level}`;
  }

  showToast(msg, ms=1400) {
    const t = this.els.toast;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this._tt);
    this._tt = setTimeout(() => t.classList.remove("show"), ms);
  }

  updatePauseBtn(paused) {
    this.els.btnPause.textContent = paused ? "Retomar" : "Pausar";
    this.showToast(paused ? "Pausado" : "Valendo!", 900);
  }

  showEnd(title, msg, stats) {
    this.els.endTitle.textContent = title;
    this.els.endMsg.textContent = msg;
    this.els.endScore.textContent = `Score: ${stats.score} · Abates: ${stats.kills} · Moedas: ${stats.coins}`;
    this.setScreen("end");
  }

  // Builders
  showModal(key) {
    this.modals[key].classList.remove("hidden");
    this.game.setPaused(true);
  }
  hideModal(key) {
    this.modals[key].classList.add("hidden");
    if(this.game.mode === "game") this.game.setPaused(false);
  }

  buildShop() {
    this.els.shopGrid.innerHTML = "";
    // Cars
    CARS.forEach(car => {
      const el = document.createElement("div");
      el.className = "opt";
      el.innerHTML = `<div><strong>${car.name}</strong></div><small>Cor</small><div class="swatch" style="background:${car.color}"></div>`;
      el.onclick = () => { this.game.config.playerColor = car.color; this.showToast("Carro: " + car.name); };
      this.els.shopGrid.appendChild(el);
    });
    // Weapons
    WEAPONS.forEach(w => {
      const el = document.createElement("div");
      el.className = "opt";
      el.innerHTML = `<div><strong>Arma: ${w.name}</strong></div><small>${w.desc}</small>
        <div style="margin-top:10px"><span class="tag">${w.cooldown}ms</span></div>`;
      el.onclick = () => { this.game.config.weapon = w; this.showToast("Arma: " + w.name); };
      this.els.shopGrid.appendChild(el);
    });
  }

  buildMaps() {
    this.els.mapGrid.innerHTML = "";
    MAPS.forEach(m => {
      const el = document.createElement("div");
      el.className = "opt";
      el.innerHTML = `<div><strong>${m.name}</strong></div><small>${m.desc}</small>
        <div class="swatch" style="background:linear-gradient(${m.bgTop}, ${m.bgBot})"></div>`;
      el.onclick = () => { this.game.config.map = m; this.showToast("Mapa: " + m.name); };
      this.els.mapGrid.appendChild(el);
    });
  }

  buildTrophies() {
    const list = [
      { id:"bronze", name:"Bronze", desc:"200+ pontos" },
      { id:"silver", name:"Prata",  desc:"1000+ pontos" },
      { id:"gold",   name:"Ouro",   desc:"3000+ pontos" },
      { id:"killer", name:"Killer", desc:"50 abates" },
      { id:"combo8", name:"Combo",  desc:"Combo x8" },
      { id:"clean",  name:"Clean",  desc:"1500+ sem dano" },
    ];
    this.els.trophyList.innerHTML = list.map(it => {
      const ok = this.game.trophies.has(it.id);
      return `<div class="opt" style="opacity:${ok?1:0.65}"><div><strong>${ok?"✅ ":"⬜ "}${it.name}</strong></div><small>${it.desc}</small></div>`;
    }).join("");
  }
}

// =========================
// 4. ENTITIES
// =========================
class Entity {
  constructor(x, y, w, h, color) {
    this.x = x; 
    this.y = y;
    this.w = w; 
    this.h = h;
    this.color = color;
    this.markedForDeletion = false;
  }
  update(dt) {}
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
  getRect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}

class Player extends Entity {
  constructor(game) {
    super(0, 0, 60, 100, game.config.playerColor);
    this.game = game;
    this.lane = 1;
    this.laneCount = 3;
    this.lastShot = 0;
    this.y = innerHeight - 140;
  }

  update(dt) {
    const lanes = getLanesX(this.laneCount);
    const targetX = lanes[this.lane] - this.w / 2;
    this.x = targetX;
    this.y = innerHeight - 140;
    this.color = this.game.config.playerColor;
  }

  move(dir) {
    if (this.game.paused || this.game.mode !== "game") return;
    this.lane = Math.max(0, Math.min(this.laneCount - 1, this.lane + dir));
    this.game.audio.playTone(280, 0.03, "square", 0.03);
  }

  shoot() {
    if (this.game.paused || this.game.mode !== "game") return;
    const now = performance.now();
    const weapon = this.game.config.weapon;
    
    if (now - this.lastShot < weapon.cooldown) return;
    this.lastShot = now;

    const cx = this.x + this.w/2;
    const cy = this.y + 20;

    const createBullet = (vx) => {
      this.game.bullets.push(new Bullet(cx, cy, 0, -780, vx, weapon.pierce));
    };

    if (weapon.name === "Duplo") {
      createBullet(-weapon.spread);
      createBullet(weapon.spread);
    } else {
      createBullet(0);
    }
    
    this.game.stats.shots++;
    this.game.audio.playTone(860, 0.04, "square", 0.045);
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeStyle = "rgba(255,255,255,.75)";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x+1, this.y+1, this.w-2, this.h-2);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillRect(this.x+10, this.y+12, this.w-20, 20);
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.fillRect(this.x+12, this.y+this.h-20, this.w-24, 8);
  }
}

class Enemy extends Entity {
  constructor(lane, x, y, speed, color, hp) {
    super(x, y, 64, 104, color);
    this.lane = lane;
    this.speed = speed;
    this.hp = hp;
    this.maxHp = hp;
    this.x -= this.w / 2;
  }

  update(dt) {
    this.y += this.speed * dt;
    if (this.y > innerHeight + 150) this.markedForDeletion = true;
  }

  draw(ctx) {
    super.draw(ctx);
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x+1, this.y+1, this.w-2, this.h-2);

    if (this.hp > 1) {
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(this.x, this.y - 10, this.w, 6);
      ctx.fillStyle = "rgba(245,158,11,.9)";
      const pct = this.hp / this.maxHp; 
      ctx.fillRect(this.x, this.y - 10, this.w * pct, 6);
    }
  }
}

class Coin extends Entity {
  constructor(lane, x, y, speed) {
    super(x, y, 20, 20, "#fbbf24");
    this.lane = lane;
    this.speed = speed;
    this.r = 10;
  }
  update(dt) {
    this.y += this.speed * dt;
    if (this.y > innerHeight + 100) this.markedForDeletion = true;
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

class Bullet extends Entity {
  constructor(x, y, vx, vy, spreadX, pierce) {
    super(x, y, 10, 10, "#fff");
    this.vx = vx + spreadX;
    this.vy = vy;
    this.pierce = pierce;
    this.r = 5;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y < -50) this.markedForDeletion = true;
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,.95)";
    ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
    ctx.fill();
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y; this.color = color;
    this.vx = (Math.random()*2-1)*260;
    this.vy = (Math.random()*2-1)*260;
    this.life = 0.3 + Math.random()*0.2;
    this.markedForDeletion = false;
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) this.markedForDeletion = true;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.92; this.vy *= 0.92;
  }
  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life / 0.5);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, 3, 3);
    ctx.globalAlpha = 1;
  }
}

// =========================
// 5. INPUT HANDLER
// =========================
class InputHandler {
  constructor(game) {
    this.game = game;
    window.addEventListener("keydown", e => this.onKey(e));
    window.addEventListener("resize", () => this.game.resize());
    game.canvas.addEventListener("pointerdown", e => this.onTap(e));
  }

  onKey(e) {
    const code = e.code;
    const mode = this.game.mode;

    if (mode === "opening" && (code === "Enter" || code === "Space")) {
      this.game.setMode("start");
      return;
    }
    if (mode === "start" && (code === "Enter" || code === "Space")) {
      this.game.startGame();
      return;
    }
    if (mode === "game") {
      if (code === "ArrowLeft" || code === "KeyA") this.game.player.move(-1);
      if (code === "ArrowRight"|| code === "KeyD") this.game.player.move(1);
      if (code === "Space" || code === "KeyJ" || code === "KeyK") {
        e.preventDefault();
        this.game.player.shoot();
      }
      if (code === "KeyP" || code === "Escape") this.game.togglePause();
      if (code === "KeyR") this.game.resetGame();
    }
  }

  onTap(e) {
    this.game.audio.init();
    if (this.game.mode !== "game") return;
    if (e.clientY < innerHeight * 0.4) {
      this.game.player.shoot();
    } else {
      if (e.clientX < innerWidth / 2) this.game.player.move(-1);
      else this.game.player.move(1);
    }
  }
}

// =========================
// 6. GAME ENGINE
// =========================
class Game {
  constructor() {
    this.canvas = $("c");
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    
    this.config = {
      playerColor: CARS[0].color,
      map: MAPS[0],
      weapon: WEAPONS[0]
    };

    this.audio = new AudioSys();
    this.ui = new UIManager(this);
    this.input = new InputHandler(this);
    this.player = new Player(this);

    this.enemies = [];
    this.coins = [];
    this.bullets = [];
    this.particles = [];

    this.mode = "opening"; 
    this.paused = false;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.combo = 1;
    this.comboTimer = 0;
    this.stats = { kills: 0, coins: 0, shots: 0 };
    this.trophies = new Set();
    
    this.lastTs = 0;
    this.spawnEnemyT = 0;
    this.spawnCoinT = 0;

    this.resize();
    this.setMode("opening");
    
    requestAnimationFrame(ts => this.loop(ts));
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(innerWidth * dpr);
    this.canvas.height = Math.floor(innerHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setMode(m) {
    this.mode = m;
    this.ui.setScreen(m);
    if(m === "start") {
      this.ui.showToast("Pronto. Modularizado.", 1200);
      this.audio.init();
    }
  }

  startGame() {
    this.audio.init();
    this.resetGame();
    this.setMode("game");
    this.paused = false;
    this.lastTs = performance.now();
  }

  resetGame() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.combo = 1;
    this.comboTimer = 0;
    this.stats = { kills: 0, coins: 0, shots: 0 };
    
    this.enemies = [];
    this.coins = [];
    this.bullets = [];
    this.particles = [];
    
    this.player.lane = 1;
    this.player.update(0);

    this.ui.updateHUD(0, 3, 1, 1);
    this.ui.showToast("Boa sorte! 😈", 1400);
  }

  togglePause() {
    this.setPaused(!this.paused);
  }

  setPaused(val) {
    this.paused = !!val;
    this.ui.updatePauseBtn(this.paused);
  }

  spawnLogic(dt) {
    this.spawnEnemyT -= dt;
    this.spawnCoinT -= dt;

    const enemyInterval = Math.max(0.45, 1.15 - this.level * 0.05);

    if (this.spawnEnemyT <= 0) {
      this.spawnEnemy();
      if (this.level >= 6 && Math.random() < 0.25) this.spawnEnemy();
      this.spawnEnemyT = enemyInterval;
    }
    if (this.spawnCoinT <= 0) {
      if (Math.random() < 0.85) this.spawnCoin();
      this.spawnCoinT = 1.35;
    }
  }

  spawnEnemy() {
    const lanes = getLanesX(this.player.laneCount);
    const lane = Math.floor(Math.random() * lanes.length);
    const x = lanes[lane];
    const speed = 240 + this.level * 22 + Math.random() * 60;
    const color = CARS[Math.floor(Math.random() * CARS.length)].color;
    const hp = 1 + (this.level >= 8 ? 1 : 0);
    this.enemies.push(new Enemy(lane, x, -120, speed, color, hp));
  }

  spawnCoin() {
    const lanes = getLanesX(this.player.laneCount);
    const lane = Math.floor(Math.random() * lanes.length);
    this.coins.push(new Coin(lane, lanes[lane], -40, 220 + this.level * 10));
  }

  spawnExplosion(x, y, color) {
    for (let i=0; i<10; i++) this.particles.push(new Particle(x, y, color));
  }

  checkCollisions() {
    const pRect = this.player.getRect();

    // Enemy vs Player
    this.enemies.forEach(e => {
      if (rectsOverlap(pRect, e.getRect())) {
        this.spawnExplosion(e.x, e.y + 40, e.color);
        e.markedForDeletion = true;
        this.takeDamage();
      }
    });

    // Coins
    this.coins.forEach(c => {
      const dx = c.x - (pRect.x + pRect.w/2);
      const dy = c.y - (pRect.y + 40);
      if ((dx*dx + dy*dy) < 42*42) {
        c.markedForDeletion = true;
        this.stats.coins++;
        this.audio.playTone(520, 0.05, "triangle", 0.055);
        this.bumpScore(50, true);
        this.ui.showToast("Moeda +50", 850);
      }
    });

    // Bullets vs Enemies
    this.bullets.forEach(b => {
      const bRect = { x: b.x - b.r, y: b.y - b.r, w: b.r*2, h: b.r*2 };
      let hit = false;
      
      for (const e of this.enemies) {
        if (rectsOverlap(bRect, e.getRect())) {
          hit = true;
          e.hp--;
          this.spawnExplosion(b.x, b.y, "#fff");
          this.audio.playTone(760, 0.03, "square", 0.04);
          
          if (e.hp <= 0) {
            this.spawnExplosion(e.x, e.y+30, e.color);
            e.markedForDeletion = true;
            this.stats.kills++;
            this.bumpScore(120, true);
            if (Math.random() < 0.25) this.coins.push(new Coin(e.lane, e.x + e.w/2, e.y, 260));
          } else {
            this.bumpScore(20, true);
          }
          
          if (b.pierce > 0) {
            b.pierce--;
            hit = false;
          }
          break;
        }
      }
      if (hit) b.markedForDeletion = true;
    });
  }

  takeDamage() {
    this.lives--;
    this.combo = 1; 
    this.comboTimer = 0;
    this.audio.playTone(140, 0.12, "sawtooth", 0.06);
    this.ui.showToast("Dano! Vidas: " + this.lives, 1100);
    this.ui.updateHUD(this.score, this.lives, this.combo, this.level);
    
    if (this.lives <= 0) {
      this.audio.playTone(80, 0.18, "sine", 0.07);
      this.ui.showEnd("Game Over", "Atropelado pela burocracia.", this.stats);
      this.mode = "end";
    }
  }

  bumpScore(pts, useCombo=true) {
    this.score += pts * (useCombo ? this.combo : 1);
    if (useCombo) {
      this.comboTimer = 1.4;
      this.combo = Math.min(12, this.combo + 1);
    }
    this.level = 1 + Math.floor(this.score / 850);
    this.checkTrophies();
    this.ui.updateHUD(this.score, this.lives, this.combo, this.level);
  }

  checkTrophies() {
    const award = (id, txt) => {
      if (!this.trophies.has(id)) {
        this.trophies.add(id);
        this.ui.showToast("Conquista: " + txt, 1600);
        this.audio.playTone(620, 0.07, "triangle", 0.06);
      }
    };
    if (this.score >= 200) award("bronze", "Bronze (200+)");
    if (this.score >= 1000) award("silver", "Prata (1000+)");
    if (this.score >= 3000) award("gold", "Ouro (3000+)");
    if (this.stats.kills >= 50) award("killer", "Killer (50 abates)");
    if (this.combo >= 8) award("combo8", "Combo x8");
    if (this.lives === 3 && this.score >= 1500) award("clean", "Clean (1500+)");
  }

  update(dt) {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) { this.comboTimer = 0; this.combo = 1; }
    }

    this.player.update(dt);
    this.spawnLogic(dt);

    [this.enemies, this.coins, this.bullets, this.particles].forEach(arr => {
      for (let i = arr.length - 1; i >= 0; i--) {
        arr[i].update(dt);
        if (arr[i].markedForDeletion) arr.splice(i, 1);
      }
    });

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].markedForDeletion && this.enemies[i].y > innerHeight) {
        this.combo = 1; this.comboTimer = 0;
      }
    }

    this.checkCollisions();

    if (this.score >= 20000 && this.mode === "game") {
      this.ui.showEnd("Vitória", "Você dominou o caos! (20000+)", this.stats);
      this.mode = "end";
    }
  }

  draw() {
    const ctx = this.ctx;
    const map = this.config.map;
    
    const g = ctx.createLinearGradient(0,0,0,innerHeight);
    g.addColorStop(0, map.bgTop);
    g.addColorStop(1, map.bgBot);
    ctx.fillStyle = g;
    ctx.fillRect(0,0,innerWidth,innerHeight);

    const roadW = innerWidth * 0.62;
    const roadX = (innerWidth - roadW) / 2;
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.fillRect(roadX, 0, roadW, innerHeight);

    const lanes = getLanesX(this.player.laneCount);
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.lineWidth = 2;
    lanes.forEach((x, i) => {
      if (i === 0 || i === lanes.length-1) return;
      ctx.setLineDash([18, 18]);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, innerHeight); ctx.stroke();
    });
    ctx.setLineDash([]);

    this.player.draw(ctx);
    this.enemies.forEach(e => e.draw(ctx));
    this.coins.forEach(c => c.draw(ctx));
    this.bullets.forEach(b => b.draw(ctx));
    this.particles.forEach(p => p.draw(ctx));

    if (this.paused) {
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(0,0,innerWidth,innerHeight);
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.font = "700 18px ui-monospace, Menlo, Monaco, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText("PAUSADO", innerWidth/2, innerHeight/2);
      ctx.textAlign = "left";
    }
  }

  loop(ts) {
    if (this.mode === "game") {
      const dt = Math.min(0.033, (ts - this.lastTs) / 1000);
      this.lastTs = ts;
      if (!this.paused) this.update(dt);
      this.draw();
    }
    requestAnimationFrame(t => this.loop(t));
  }
}

window.onload = () => { new Game(); };
