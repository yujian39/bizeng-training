/**
 * quiz.js — 综合测验模块
 * 每个场景的综合在线测验：选择+填空+翻译
 */
const Quiz = window.Quiz = {
  answers: {},
  score: 0,
  total: 0,

  render(unit) {
    const vq = unit.exercises?.vocabChoice || [];
    const fq = unit.exercises?.fillBlank || [];
    const gq = unit.exercises?.grammarChoice || [];

    // 综合测验题目
    this.answers = {};
    this.score = 0;
    this.total = vq.length + fq.length + gq.length;

    document.getElementById('modContent').innerHTML = `
      <h3>🎯 综合测验 — ${unit.title}</h3>
      <p style="color:var(--tx2);margin-bottom:16px">本测验共 ${this.total} 题，完成所有题目后点击提交查看成绩</p>
      <div id="quizQuestions"></div>
      <div style="text-align:center;margin:20px 0">
        <button class="btn btn-pri" style="font-size:16px;padding:12px 40px" onclick="Quiz.submit()">📊 提交评分</button>
      </div>
      <div id="quizResult" style="display:none"></div>
    `;

    this.buildQuestions(unit);
  },

  buildQuestions(unit) {
    const vq = unit.exercises?.vocabChoice || [];
    const fq = unit.exercises?.fillBlank || [];
    const gq = unit.exercises?.grammarChoice || [];

    let html = '';
    let qNum = 0;

    // 词汇选择
    vq.forEach((q, i) => {
      qNum++;
      html += `<div class="ch-q" id="qz-${i}">
        <div class="q-txt">${qNum}. [词汇] ${q.question}</div>
        <div class="opts">${q.options.map((o, oi) => `
          <div class="opt" onclick="Quiz.pickChoice('qz-${i}',${oi})">${String.fromCharCode(65+oi)}. ${o}</div>
        `).join('')}</div>
      </div>`;
    });

    // 填空
    fq.forEach((q, i) => {
      qNum++;
      html += `<div class="fill-q">
        <div class="sent">${qNum}. [填空] ${q.sentence}</div>
        <input type="text" id="qzf-${i}" placeholder="输入答案..." class="fill-input">
        <div class="hint">💡 ${q.hint||''}</div>
      </div>`;
    });

    // 语法选择
    gq.forEach((q, i) => {
      qNum++;
      html += `<div class="ch-q" id="qzg-${i}">
        <div class="q-txt">${qNum}. [语法] ${q.question}</div>
        <div class="opts">${q.options.map((o, oi) => `
          <div class="opt" onclick="Quiz.pickChoice('qzg-${i}',${oi})">${String.fromCharCode(65+oi)}. ${o}</div>
        `).join('')}</div>
      </div>`;
    });

    document.getElementById('quizQuestions').innerHTML = html;
  },

  pickChoice(qId, chosen) {
    const container = document.getElementById(qId);
    const opts = container.querySelectorAll('.opt');
    opts.forEach(o => o.classList.remove('sel'));
    opts[chosen].classList.add('sel');
    this.answers[qId] = chosen;
  },

  submit() {
    const unit = App.currentUnit;
    const vq = unit.exercises?.vocabChoice || [];
    const fq = unit.exercises?.fillBlank || [];
    const gq = unit.exercises?.grammarChoice || [];

    let correct = 0;
    let total = 0;
    const review = [];

    // 评分词汇选择
    vq.forEach((q, i) => {
      total++;
      const chosen = this.answers[`qz-${i}`];
      if (chosen === q.answer) {
        correct++;
      } else {
        review.push({q: q.question, correct: q.options[q.answer], yours: chosen != null ? q.options[chosen] : '(未作答)'});
      }
    });

    // 评分填空
    fq.forEach((q, i) => {
      total++;
      const val = (document.getElementById(`qzf-${i}`)?.value || '').trim().toLowerCase();
      if (val === q.answer.toLowerCase()) {
        correct++;
      } else {
        review.push({q: q.sentence, correct: q.answer, yours: val || '(未作答)'});
      }
    });

    // 评分语法选择
    gq.forEach((q, i) => {
      total++;
      const chosen = this.answers[`qzg-${i}`];
      if (chosen === q.answer) {
        correct++;
      } else {
        review.push({q: q.question, correct: q.options[q.answer], yours: chosen != null ? q.options[chosen] : '(未作答)'});
      }
    });

    this.score = total > 0 ? Math.round((correct / total) * 100) : 0;
    App.markComplete(this.score);

    // 高亮正确答案
    vq.forEach((q, i) => {
      const container = document.getElementById(`qz-${i}`);
      if (!container) return;
      const opts = container.querySelectorAll('.opt');
      opts.forEach((o, oi) => o.classList.add(oi === q.answer ? 'ok' : ''));
    });
    gq.forEach((q, i) => {
      const container = document.getElementById(`qzg-${i}`);
      if (!container) return;
      const opts = container.querySelectorAll('.opt');
      opts.forEach((o, oi) => o.classList.add(oi === q.answer ? 'ok' : ''));
    });

    // 显示结果
    const scoreText = this.score >= 80 ? '🎉 优秀!' : this.score >= 60 ? '👍 良好' : '💪 继续加油';
    let reviewHtml = '';
    if (review.length > 0) {
      reviewHtml = `<h4 style="margin-top:20px">❌ 错题回顾 (${review.length}题)</h4>` +
        review.map((r, i) => `
          <div class="fill-q" style="border-left:3px solid var(--err)">
            <div class="sent">${i+1}. ${r.q}</div>
            <p style="color:var(--suc)">✅ 正确答案: ${r.correct}</p>
            <p style="color:var(--err)">❌ 你的回答: ${r.yours}</p>
          </div>`).join('');
    }

    document.getElementById('quizResult').style.display = 'block';
    document.getElementById('quizResult').innerHTML = `
      <div class="quiz-final">
        <div class="big" style="color:${this.score>=80?'var(--suc)':this.score>=60?'var(--warn)':'var(--err)'}">${this.score}</div>
        <div class="msg">${scoreText}</div>
        <p style="color:var(--tx2)">${correct}/${total} 题正确</p>
      </div>
      ${reviewHtml}
      <div style="text-align:center;margin-top:16px">
        <button class="btn btn-pri" onclick="Quiz.render(App.currentUnit)">🔄 重新测验</button>
      </div>
    `;

    document.getElementById('quiz-badge').textContent = `🎯 ${this.score}分`;
  }
};
