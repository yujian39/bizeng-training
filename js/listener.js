/**
 * listener.js — 听力模块：音频播放、调速、听写
 */
const Listener = window.Listener = {
  audio: null,
  speed: 1,
  mode: 'play', // 'play' | 'dictation'

  render(unit) {
    const audioPath = `audio/${unit.id}-en.mp3`;
    const zhAudioPath = `audio/${unit.id}-zh.mp3`;

    document.getElementById('modContent').innerHTML = `
      <div class="ap">
        <div class="ctl">
          <button class="btn-play" onclick="Listener.play('${audioPath}')">▶ 播放英文</button>
          <button class="btn-play" style="background:var(--suc)" onclick="Listener.play('${zhAudioPath}')">▶ 播放中文</button>
          <button class="btn-play" style="background:var(--warn)" onclick="Listener.playSentence()">▶ 逐句播放</button>
          <button class="btn-spd ${this.speed===0.75?'active':''}" onclick="Listener.setSpeed(0.75)">0.75x</button>
          <button class="btn-spd ${this.speed===1?'active':''}" onclick="Listener.setSpeed(1)">1x</button>
          <button class="btn-spd ${this.speed===1.25?'active':''}" onclick="Listener.setSpeed(1.25)">1.25x</button>
          <div class="bar" id="progBar" onclick="Listener.seek(event)">
            <div class="bar-fill" id="progFill"></div>
          </div>
          <span id="timeDisplay">00:00 / 00:00</span>
        </div>
      </div>
      <div style="margin:12px 0">
        <button class="btn-out" onclick="Listener.toggleMode()">切换模式: ${this.mode==='play'?'🎧 播放':'✍️ 听写'}</button>
      </div>
      ${this.mode==='dictation' ? this.renderDictation(unit) : this.renderSentences(unit)}
    `;

    // 初始化逐句数据
    this._sentences = unit.dialogueEN.filter(s => s.trim());
    this._sentenceIdx = 0;
  },

  /** 渲染逐句播放区 */
  renderSentences(unit) {
    return (unit.dialogueEN||[]).map((s,i) =>
      `<div class="di-card role-${i%2===0?'A':'B'}" style="cursor:pointer" onclick="Listener.playSentence(${i})">
        <div class="role-tag">${i%2===0?unit.roles.A:unit.roles.B}</div>
        <div class="en-txt">${s}</div>
      </div>`).join('');
  },

  /** 听写模式 */
  renderDictation(unit) {
    const s = (unit.dialogueEN||[]).join(' ');
    return `<div class="dict">
      <div class="sent-en">🎧 点击播放，听写英文内容：</div>
      <textarea id="dictInput" placeholder="在这里输入你听到的英文..."></textarea>
      <button class="btn btn-pri" style="margin-top:8px" onclick="Listener.checkDictation()">✅ 提交对比</button>
      <div class="cmp" id="dictResult"></div>
    </div>`;
  },

  toggleMode() {
    this.mode = this.mode==='play' ? 'dictation' : 'play';
    this.render(App.currentUnit);
  },

  /** 音频播放 */
  play(src) {
    if (this.audio) { this.audio.pause(); this.audio = null; }
    this.audio = new Audio(src);
    this.audio.playbackRate = this.speed;
    this.audio.play().catch(e => {
      console.warn('Audio play failed (maybe file missing):', e.message);
    });
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('loadedmetadata', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.updateProgress());
  },

  playSentence(idx) {
    if (idx != null) this._sentenceIdx = idx;
    const utt = new SpeechSynthesisUtterance(this._sentences[this._sentenceIdx]);
    utt.lang = 'en-US';
    utt.rate = this.speed;
    speechSynthesis.cancel();
    speechSynthesis.speak(utt);
    this._sentenceIdx = (this._sentenceIdx + 1) % this._sentences.length;
  },

  setSpeed(s) {
    this.speed = s;
    if (this.audio) this.audio.playbackRate = s;
    this.render(App.currentUnit);
  },

  seek(e) {
    if (!this.audio) return;
    const bar = document.getElementById('progBar');
    const ratio = e.offsetX / bar.offsetWidth;
    this.audio.currentTime = ratio * this.audio.duration;
  },

  updateProgress() {
    if (!this.audio) return;
    const pct = this.audio.duration ? (this.audio.currentTime / this.audio.duration) * 100 : 0;
    document.getElementById('progFill').style.width = pct + '%';
    const cur = this.formatTime(this.audio.currentTime);
    const dur = this.formatTime(this.audio.duration || 0);
    document.getElementById('timeDisplay').textContent = `${cur} / ${dur}`;
  },

  formatTime(s) {
    const m = Math.floor(s/60), sec = Math.floor(s%60);
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  },

  /** 听写对比 */
  checkDictation() {
    const input = document.getElementById('dictInput').value.trim();
    const original = (App.currentUnit.dialogueEN||[]).join(' ');
    const inputWords = input.toLowerCase().split(/\s+/).filter(Boolean);
    const origWords = original.toLowerCase().split(/\s+/).filter(Boolean);
    let html = '';
    const origSet = new Set(origWords);
    for (const w of origWords) {
      if (inputWords.includes(w)) {
        html += `<span class="ok-word">${w}</span> `;
      } else {
        html += `<span class="ko-word">${w}</span> `;
      }
    }
    const matchCount = origWords.filter(w => inputWords.includes(w)).length;
    const accuracy = Math.round((matchCount / origWords.length) * 100);
    document.getElementById('dictResult').innerHTML = `
      <p style="margin-bottom:8px">准确率: <b style="font-size:20px;color:var(--pri)">${accuracy}%</b> (${matchCount}/${origWords.length} words)</p>
      <p style="margin-bottom:4px"><b>对照:</b></p>
      <p>${html}</p>`;
  }
};
