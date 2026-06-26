/**
 * exercises.js — 词汇+语法+写作练习模块
 */
const Exercises = window.Exercises = {

  /** 词汇练习 */
  renderVocab(unit) {
    const v = unit.vocabulary || [];
    const ex = unit.exercises || {};

    // 闪卡
    const flashHtml = v.length ? `
      <h4 style="margin:16px 0 8px">🃏 词汇闪卡 (点击翻转)</h4>
      <div class="flash-grid">
        ${v.slice(0,12).map(item => `
          <div class="flash" onclick="this.classList.toggle('flipped')">
            <div class="flash-inner">
              <div class="flash-front"><div class="wd">${item.en}</div><div class="ph">${item.phonetic||''}</div></div>
              <div class="flash-back"><div class="mn">${item.zh}</div><div style="font-size:12px;color:var(--tx2);margin-top:4px">${item.pos||''}</div></div>
            </div>
          </div>`).join('')}
      </div>` : '';

    // 选择题
    const choiceHtml = (ex.vocabChoice||[]).length ? `
      <h4 style="margin:20px 0 8px">📝 词汇选择题</h4>
      ${(ex.vocabChoice||[]).map((q, qi) => `
        <div class="ch-q" id="vcq-${qi}">
          <div class="q-txt">${qi+1}. ${q.question}</div>
          <div class="opts">${q.options.map((o, oi) => `
            <div class="opt" onclick="Exercises.selectOpt('vcq-${qi}',${oi},${q.answer},'${qi}')">${String.fromCharCode(65+oi)}. ${o}</div>
          `).join('')}</div>
          <div class="fb" id="vfb-${qi}"></div>
        </div>`).join('')}` : '';

    // 填空
    const fillHtml = (ex.fillBlank||[]).length ? `
      <h4 style="margin:20px 0 8px">✏️ 填空练习</h4>
      ${(ex.fillBlank||[]).map((q, fi) => `
        <div class="fill-q">
          <div class="sent">${q.sentence}</div>
          <input type="text" id="fill-${fi}" placeholder="输入答案...">
          <button class="btn-chk" onclick="Exercises.checkFill('fill-${fi}','${q.answer}')">✅ 检查</button>
          <div class="hint">💡 提示: ${q.hint||''}</div>
        </div>`).join('')}` : '';

    document.getElementById('modContent').innerHTML = `
      <h3>🔤 词汇练习 — ${unit.title}</h3>
      ${flashHtml}
      ${choiceHtml}
      ${fillHtml}
    `;
  },

  /** 语法练习 */
  renderGrammar(unit) {
    const ex = unit.exercises || {};
    const gramCards = (unit.grammar||[]).map(g => `
      <div class="gram-card">
        <h4>${g.title}</h4>
        <div class="struc">${g.structure}</div>
        <div class="eg">📌 ${g.example}</div>
        <div class="expl">📖 ${g.explanation}</div>
        <div class="prac">✏️ ${g.practice}</div>
      </div>`).join('');

    const gramChoiceHtml = (ex.grammarChoice||[]).length ? `
      <h4 style="margin:20px 0 8px">📝 语法选择题</h4>
      ${(ex.grammarChoice||[]).map((q, qi) => `
        <div class="ch-q" id="gcq-${qi}">
          <div class="q-txt">${qi+1}. ${q.question}</div>
          <div class="opts">${q.options.map((o, oi) => `
            <div class="opt" onclick="Exercises.selectOpt('gcq-${qi}',${oi},${q.answer},'g${qi}')">${String.fromCharCode(65+oi)}. ${o}</div>
          `).join('')}</div>
          <div class="fb" id="gfb-${qi}"></div>
        </div>`).join('')}` : '';

    // 句型重组
    const reorderHtml = (ex.sentenceReorder||[]).length ? `
      <h4 style="margin:20px 0 8px">🧩 句型重组</h4>
      ${(ex.sentenceReorder||[]).map((q, ri) => `
        <div class="fill-q" id="reo-${ri}">
          <div class="sent">请将打乱的单词排列成正确句子：</div>
          <div class="reo-area" id="reoWords-${ri}"></div>
          <div class="reo-ans" id="reoAns-${ri}"></div>
          <button class="btn-chk" style="margin-top:8px" onclick="Exercises.checkReorder(${ri},'${q.answer.replace(/'/g,"\\'")}', '${JSON.stringify(q.scrambled).replace(/"/g,'&quot;')}')">✅ 检查</button>
        </div>`).join('')}
      </div>` : '';

    document.getElementById('modContent').innerHTML = `
      <h3>📝 语法学习 — ${unit.title}</h3>
      ${gramCards}
      ${gramChoiceHtml}
      ${reorderHtml}
    `;

    // 初始化句型重组
    (ex.sentenceReorder||[]).forEach((q, ri) => {
      const wordsArea = document.getElementById(`reoWords-${ri}`);
      const ansArea = document.getElementById(`reoAns-${ri}`);
      if (!wordsArea) return;
      const scrambled = [...q.scrambled].sort(() => Math.random() - 0.5);
      wordsArea.innerHTML = scrambled.map(w =>
        `<span class="reo-word" data-reo="${ri}" data-word="${w}" onclick="Exercises.pickWord(this)">${w}</span>`
      ).join('');
    });
  },

  /** 写作练习 */
  renderWriting(unit) {
    const prompts = {
      20: '你正在参加一场英文面试，面试官和你寒暄。请写一段英文回复，回应问候并做简短自我介绍。',
      21: '请用英文写一段1分钟的自我介绍，包含教育背景和工作经历。',
      26: '请用英文描述你最大的工作成就，包含具体数字。',
      27: '请用英文描述一次你从失败中学到的教训。',
      36: '请用英文描述你的一个缺点，并说明你是如何改进的。',
      38: '面试结束后，面试官问"Do you have any questions for me?"请写2-3个你会问的问题。',
      39: '请写一封英文感谢邮件，感谢面试官的时间，并重申你对岗位的兴趣。',
    };
    const prompt = prompts[unit.id] || `请用英文写一段对话回复，场景为"${unit.title}"。`;
    const refSentences = (unit.coreSentences||[]).slice(0,3).map(s => s.original).join(' / ');

    document.getElementById('modContent').innerHTML = `
      <h3>✍️ 写作练习 — ${unit.title}</h3>
      <div class="wr-area">
        <div class="prompt">📝 ${prompt}</div>
        <textarea id="writingInput" placeholder="在这里用英文写你的回答..."></textarea>
        <button class="btn btn-pri" style="margin-top:8px" onclick="Exercises.showRef()">💡 查看参考句型</button>
        <div class="ref" id="writingRef"><b>参考句型:</b> ${refSentences}</div>
      </div>
    `;
  },

  showRef() {
    document.getElementById('writingRef').style.display = 'block';
  },

  /** 选择题交互 */
  selectOpt(qId, chosen, answer, fbId) {
    const container = document.getElementById(qId);
    if (!container) return;
    const opts = container.querySelectorAll('.opt');
    // 检查是否已经回答过
    if (container.dataset.answered) return;
    container.dataset.answered = '1';

    opts.forEach((o, i) => {
      if (i === answer) o.classList.add('ok');
      else if (i === chosen) o.classList.add(chosen === answer ? 'ok' : 'ko');
      o.style.pointerEvents = 'none';
    });

    const fb = document.getElementById(`vfb-${fbId}`) || document.getElementById(`gfb-${fbId}`);
    if (!fb) return;
    fb.classList.add('show');
    if (chosen === answer) {
      fb.classList.add('y');
      fb.textContent = '✅ 正确！';
    } else {
      fb.classList.add('n');
      fb.textContent = `❌ 错误！正确答案是 ${String.fromCharCode(65+answer)}.`;
      App.addWrong({q: fbId, answer, userAnswer: chosen, unitId: App.currentUnit?.id});
    }
  },

  /** 填空检查 */
  checkFill(inputId, answer) {
    const input = document.getElementById(inputId);
    const val = input.value.trim().toLowerCase();
    if (val === answer.toLowerCase()) {
      input.className = 'ok';
    } else {
      input.className = 'ko';
      setTimeout(() => { input.className = ''; input.value = ''; }, 1500);
    }
  },

  /** 句型重组-点选单词 */
  pickedWords: {},
  pickWord(el) {
    const ri = el.dataset.reo;
    const word = el.dataset.word;
    if (!this.pickedWords[ri]) this.pickedWords[ri] = [];
    this.pickedWords[ri].push(word);
    el.classList.add('picked');
    el.style.pointerEvents = 'none';

    const ansArea = document.getElementById(`reoAns-${ri}`);
    ansArea.innerHTML = this.pickedWords[ri].map((w, i) =>
      `<span class="picked-word" onclick="Exercises.unpickWord(${ri},${i})">${w}</span>`
    ).join(' ');
  },
  unpickWord(ri, idx) {
    this.pickedWords[ri].splice(idx, 1);
    // 重新渲染
    const ansArea = document.getElementById(`reoAns-${ri}`);
    ansArea.innerHTML = this.pickedWords[ri].map((w, i) =>
      `<span class="picked-word" onclick="Exercises.unpickWord(${ri},${i})">${w}</span>`
    ).join(' ');
    // 恢复原词
    const words = document.querySelectorAll(`.reo-word[data-reo="${ri}"]`);
    // 简单刷新：取消pick重新渲染（简化处理）
  },

  checkReorder(ri, answer, scrambledJson) {
    const userAns = (this.pickedWords[ri] || []).join(' ').toLowerCase();
    const correct = answer.toLowerCase();
    if (userAns === correct) {
      document.getElementById(`reoAns-${ri}`).innerHTML += ' ✅ 正确！';
    } else {
      document.getElementById(`reoAns-${ri}`).innerHTML += ` ❌ 正确答案: ${answer}`;
    }
  }
};
