/**
 * reader.js — 阅读模块：对话卡片、中英切换、词汇弹窗
 */
const Reader = window.Reader = {
  lang: 'bilingual', // 'en' | 'zh' | 'bilingual'

  render(unit) {
    const langToggle = `
      <div class="lang-tg">
        <button class="${this.lang==='bilingual'?'active':''}" onclick="Reader.setLang('bilingual')">中英对照</button>
        <button class="${this.lang==='en'?'active':''}" onclick="Reader.setLang('en')">仅英文</button>
        <button class="${this.lang==='zh'?'active':''}" onclick="Reader.setLang('zh')">仅中文</button>
      </div>`;

    const enLines = unit.dialogueEN || [];
    const zhLines = unit.dialogueZH || [];
    // 交替对话：奇数行=角色A，偶数行=角色B (most scenes)
    const maxLen = Math.max(enLines.length, zhLines.length);
    let cards = '';
    for (let i = 0; i < maxLen; i++) {
      const en = enLines[i] || '';
      const zh = zhLines[i] || '';
      const role = i % 2 === 0 ? 'A' : 'B';
      const roleName = role === 'A' ? unit.roles.A : unit.roles.B;

      const enHtml = this.lang === 'zh' ? '' : `<div class="en-txt">${this.highlightVocab(en, unit)}</div>`;
      const zhHtml = this.lang === 'en' ? '' : `<div class="zh-txt">${zh}</div>`;

      if (en || zh) {
        cards += `<div class="di-card role-${role}">
          <div class="role-tag">${roleName}</div>
          ${enHtml}${zhHtml}
        </div>`;
      }
    }

    const vocabSection = this.renderVocabTable(unit);
    const sentenceSection = this.renderSentences(unit);
    const cultureHtml = unit.cultureNote ? `<div class="culture-box"><h4>🌍 文化注释</h4><p>${unit.cultureNote}</p></div>` : '';
    const tipHtml = unit.interviewTip ? `<div class="tip-box"><h4>💡 面试技巧</h4><p>${unit.interviewTip}</p></div>` : '';

    document.getElementById('modContent').innerHTML = `
      ${langToggle}
      ${cards}
      ${sentenceSection}
      ${vocabSection}
      ${tipHtml}
      ${cultureHtml}`;

    // 绑定词汇弹窗事件
    this.bindVocabTooltip(unit);
  },

  setLang(l) { this.lang = l; if (App.currentUnit) this.render(App.currentUnit); },

  /** 高亮词汇 */
  highlightVocab(text, unit) {
    let txt = text;
    if (!unit.vocabulary || !unit.vocabulary.length) return txt;
    // 按词汇长度降序，避免短词先匹配
    const sorted = [...unit.vocabulary].sort((a,b) => b.en.length - a.en.length);
    for (const v of sorted) {
      const word = v.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      txt = txt.replace(regex, (match) => {
        return `<span class="vocab-hl" data-vocab="${v.en.toLowerCase()}">${match}</span>`;
      });
    }
    return txt;
  },

  /** 词汇弹窗 */
  bindVocabTooltip(unit) {
    const tp = document.getElementById('vocabTp');
    document.querySelectorAll('.vocab-hl').forEach(el => {
      el.addEventListener('mouseenter', e => {
        const key = el.dataset.vocab;
        const v = unit.vocabulary.find(x => x.en.toLowerCase() === key);
        if (v) {
          tp.innerHTML = `<div class="wd">${v.en}</div>
            <div class="ph">${v.phonetic||''}</div>
            <div class="ps">${v.pos||''}</div>
            <div class="zm">${v.zh||''}</div>`;
          tp.style.display = 'block';
        }
      });
      el.addEventListener('mousemove', e => {
        tp.style.left = (e.clientX + 16) + 'px';
        tp.style.top = (e.clientY + 16) + 'px';
      });
      el.addEventListener('mouseleave', () => { tp.style.display = 'none'; });
    });
  },

  /** 词汇表 */
  renderVocabTable(unit) {
    if (!unit.vocabulary?.length) return '';
    const rows = unit.vocabulary.map(v => `<tr>
      <td><b>${v.en}</b></td>
      <td>${v.phonetic||''}</td>
      <td>${v.pos||''}</td>
      <td>${v.zh||''}</td>
    </tr>`).join('');
    return `<h3 style="margin:20px 0 12px">🔤 重点词汇 (${unit.vocabulary.length}个)</h3>
      <table class="vocab-tbl"><thead><tr><th>英文</th><th>音标</th><th>词性</th><th>释义</th></tr></thead><tbody>${rows}</tbody></table>`;
  },

  /** 核心句型 */
  renderSentences(unit) {
    if (!unit.coreSentences?.length) return '';
    const cards = unit.coreSentences.map(s => `<div class="sent-card">
      <div class="orig">"${s.original}"</div>
      <div class="func">💬 ${s.function}</div>
      <div class="alt">🔄 ${s.alternative}</div>
    </div>`).join('');
    return `<h3 style="margin:20px 0 12px">💬 核心句型 (${unit.coreSentences.length}句)</h3>${cards}`;
  }
};
