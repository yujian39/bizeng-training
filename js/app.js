/**
 * app.js — 面试商务英语训练平台主逻辑
 * 全局状态管理、导航、路由、localStorage
 */
const App = window.App = {
  currentUnit: null,
  currentMod: 'read',
  units: [],
  progress: {},      // {unitId: {completed:bool, quizScore:number}}
  favorites: [],      // [unitId, ...]
  wrongBook: [],       // [{q, answer, userAnswer, unitId}, ...]

  /** 初始化 */
  async init() {
    this.loadUnits();
    this.loadProgress();
    this.renderNav();
    this.bindEvents();
    console.log('App ready:', this.units.length, 'units loaded');
  },

  /** 加载所有场景的 JSON 数据 */
  loadUnits() {
    // 直接从预打包的 data.js 加载，避免 fetch CORS 问题
    const raw = window.__UNITS_DATA__;
    if (raw && Array.isArray(raw)) {
      this.units = raw;
    } else {
      console.error('__UNITS_DATA__ not found! Make sure data.js is loaded before app.js');
      this.units = [];
    }
    this.units.sort((a,b) => a.id - b.id);
  },

  /** localStorage 读写 */
  loadProgress() {
    try {
      this.progress = JSON.parse(localStorage.getItem('bizeng_progress') || '{}');
      this.favorites = JSON.parse(localStorage.getItem('bizeng_favs') || '[]');
      this.wrongBook = JSON.parse(localStorage.getItem('bizeng_wrong') || '[]');
    } catch(e) {
      this.progress = {}; this.favorites = []; this.wrongBook = [];
    }
    this.updateBadges();
  },
  saveProgress() {
    localStorage.setItem('bizeng_progress', JSON.stringify(this.progress));
    localStorage.setItem('bizeng_favs', JSON.stringify(this.favorites));
    localStorage.setItem('bizeng_wrong', JSON.stringify(this.wrongBook));
    this.updateBadges();
  },

  /** 更新顶部统计 */
  updateBadges() {
    const done = Object.keys(this.progress).filter(k => this.progress[k]?.completed).length;
    document.getElementById('prog-badge').textContent = `📊 ${done}/${this.units.length}`;
    document.getElementById('favBadge').textContent = `(${this.favorites.length})`;
  },

  /** 渲染导航 */
  renderNav() {
    const nav = document.getElementById('sceneNav');
    nav.innerHTML = this.units.map(u => {
      const done = this.progress[u.id]?.completed;
      const fav = this.favorites.includes(u.id);
      return `<div class="nav-item" data-id="${u.id}" onclick="App.selectUnit(${u.id})">
        <span>${fav ? '⭐' : ''} ${u.id} ${u.title}</span>
        <span>${done ? '<span class="done">✅</span>' : ''}</span>
      </div>`;
    }).join('');
  },

  /** 选择场景 */
  selectUnit(id) {
    this.currentUnit = this.units.find(u => u.id === id);
    if (!this.currentUnit) return;

    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', +el.dataset.id === id));

    // 更新场景头部
    document.getElementById('sceneTitle').textContent = `场景 ${id}: ${this.currentUnit.title}`;
    document.getElementById('sceneDiff').textContent = this.currentUnit.difficulty || '🔵中级';
    document.getElementById('sceneRoles').textContent = `${this.currentUnit.roles.A} ↔ ${this.currentUnit.roles.B}`;
    document.getElementById('sceneMeta').style.display = 'flex';
    document.getElementById('favBtn').textContent = this.favorites.includes(id) ? '⭐ 已收藏' : '⭐ 收藏';
    document.getElementById('favBtn').classList.toggle('faved', this.favorites.includes(id));

    // 渲染当前模块
    this.showModule(this.currentMod);
  },

  /** 收藏切换 */
  toggleFav() {
    const id = this.currentUnit?.id;
    if (!id) return;
    const idx = this.favorites.indexOf(id);
    if (idx >= 0) this.favorites.splice(idx, 1);
    else this.favorites.push(id);
    this.saveProgress();
    this.renderNav();
    this.selectUnit(id); // refresh header
  },

  /** 标记完成 */
  markComplete(score) {
    if (!this.currentUnit) return;
    const id = this.currentUnit.id;
    if (!this.progress[id]) this.progress[id] = {};
    this.progress[id].completed = true;
    if (score != null) {
      if (!this.progress[id].scores) this.progress[id].scores = [];
      this.progress[id].scores.push(score);
      const avg = this.progress[id].scores.reduce((a,b)=>a+b,0) / this.progress[id].scores.length;
      document.getElementById('quiz-badge').textContent = `🎯 ${Math.round(avg)}分`;
    }
    this.saveProgress();
    this.renderNav();
  },

  /** 添加错题 */
  addWrong(item) {
    this.wrongBook.push({...item, unitId: this.currentUnit?.id, time: Date.now()});
    if (this.wrongBook.length > 500) this.wrongBook = this.wrongBook.slice(-500);
    this.saveProgress();
  },

  /** 模块切换 */
  showModule(mod) {
    this.currentMod = mod;
    document.querySelectorAll('.mod-tab').forEach(t => t.classList.toggle('active', t.dataset.mod === mod));

    if (!this.currentUnit) {
      document.getElementById('modContent').innerHTML = `<div class="welcome"><h1>👋 请先选择一个场景</h1></div>`;
      return;
    }

    const content = document.getElementById('modContent');
    try {
      switch (mod) {
        case 'read': Reader.render(this.currentUnit); break;
        case 'listen': Listener.render(this.currentUnit); break;
        case 'speak': Speaker.render(this.currentUnit); break;
        case 'vocab': Exercises.renderVocab(this.currentUnit); break;
        case 'grammar': Exercises.renderGrammar(this.currentUnit); break;
        case 'write': Exercises.renderWriting(this.currentUnit); break;
        case 'quiz': Quiz.render(this.currentUnit); break;
      }
    } catch(e) {
      console.error('Module render error:', mod, e);
      content.innerHTML = `<div style="padding:40px;text-align:center;color:var(--err)"><h3>⚠️ 模块加载出错</h3><p>${e.message}</p><p style="font-size:12px;color:var(--tx2)">请打开控制台 (F12) 查看详细信息</p></div>`;
    }
  },

  /** 事件绑定 */
  bindEvents() {
    // 模块切换
    document.getElementById('modbar').addEventListener('click', e => {
      const tab = e.target.closest('.mod-tab');
      if (!tab) return;
      this.showModule(tab.dataset.mod);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
