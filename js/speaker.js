/**
 * speaker.js — 口语模块：录音、语音识别、对比评分
 */
const Speaker = window.Speaker = {
  recognition: null,
  isRecording: false,

  render(unit) {
    const allText = (unit.dialogueEN||[]).join(' ');
    document.getElementById('modContent').innerHTML = `
      <div class="rec">
        <p style="margin-bottom:12px;color:var(--tx2)">🎤 朗读以下英文对话，点击录音按钮开始</p>
        <div class="di-card" style="text-align:left;margin-bottom:16px">
          <div class="en-txt" style="font-size:16px;line-height:1.8">${(unit.dialogueEN||[]).join('<br><br>')}</div>
        </div>
        <button class="btn-rec" id="btnRec" onclick="Speaker.toggleRecord()">🎤</button>
        <p id="recStatus" style="margin-top:8px;color:var(--tx2)">点击开始录音</p>
        <div class="result" id="recResult" style="display:none">
          <div class="acc" id="recAccuracy"></div>
          <p style="color:var(--tx2)">识别结果 vs 原文</p>
          <div id="recCompare" style="text-align:left;margin-top:8px;font-size:14px"></div>
        </div>
      </div>
      <div style="margin-top:12px">
        <h4>🎭 角色扮演模式</h4>
        <p style="color:var(--tx2);margin:8px 0">选择一个角色，逐句跟读练习</p>
        <div style="display:flex;gap:8px">
          <button class="btn btn-pri" onclick="Speaker.rolePlay('A')">扮演 ${unit.roles.A}</button>
          <button class="btn btn-suc" onclick="Speaker.rolePlay('B')">扮演 ${unit.roles.B}</button>
        </div>
        <div id="rpArea" style="margin-top:12px"></div>
      </div>
    `;

    // 初始化 Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      document.getElementById('btnRec').disabled = true;
      document.getElementById('recStatus').textContent = '⚠️ 您的浏览器不支持语音识别，请使用 Chrome 或 Edge';
    }
  },

  toggleRecord() {
    if (this.isRecording) {
      this.stopRecord();
    } else {
      this.startRecord();
    }
  },

  startRecord() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    this.recognition = new SR();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.continuous = true;

    this.recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      this.evaluate(transcript);
    };

    this.recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      if (e.error === 'no-speech') {
        document.getElementById('recStatus').textContent = '⏳ 未检测到语音，请再试一次';
      }
    };

    this.recognition.start();
    this.isRecording = true;
    document.getElementById('btnRec').classList.add('ing');
    document.getElementById('recStatus').textContent = '🔴 正在录音... 读完点击停止';
    document.getElementById('recResult').style.display = 'none';
  },

  stopRecord() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.isRecording = false;
    document.getElementById('btnRec').classList.remove('ing');
    document.getElementById('recStatus').textContent = '✅ 录音完成，点击重新录音';
  },

  evaluate(transcript) {
    const original = (App.currentUnit.dialogueEN||[]).join(' ').toLowerCase();
    const spoken = transcript.toLowerCase();
    const origWords = original.split(/\s+/).filter(Boolean);
    const spokenWords = spoken.split(/\s+/).filter(Boolean);

    let correct = 0;
    for (const w of origWords) {
      if (spokenWords.includes(w)) correct++;
    }
    const accuracy = Math.round((correct / origWords.length) * 100);

    // 逐词对比
    let compareHtml = '';
    for (const w of origWords) {
      if (spokenWords.includes(w)) {
        compareHtml += `<span class="ok-word" style="margin:1px">${w}</span> `;
      } else {
        compareHtml += `<span class="ko-word" style="margin:1px">${w}</span> `;
      }
    }

    document.getElementById('recResult').style.display = 'block';
    document.getElementById('recAccuracy').textContent = `${accuracy}%`;
    document.getElementById('recCompare').innerHTML = `
      <p style="color:var(--tx2);font-size:12px;margin-bottom:4px">你说的是: "${transcript}"</p>
      ${compareHtml}`;
  },

  /** 角色扮演 */
  rolePlay(role) {
    const unit = App.currentUnit;
    const lines = unit.dialogueEN || [];
    // 根据角色筛选：角色A=偶数行，角色B=奇数行
    const roleLines = lines.filter((_, i) => (role === 'A' ? i % 2 === 0 : i % 2 === 1));
    const html = roleLines.map((l, i) => `
      <div style="margin:8px 0;padding:8px;background:var(--card);border-radius:6px;cursor:pointer"
           onclick="Speaker.speakLine('${l.replace(/'/g,"\\'")}')">
        <b>${i+1}.</b> ${l}
      </div>`).join('');
    document.getElementById('rpArea').innerHTML = html;
  },

  speakLine(text) {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 0.85; // 稍慢便于跟读
    speechSynthesis.cancel();
    speechSynthesis.speak(utt);
  }
};
