/* script.js
   Mock AI grader logic adapted from your React code
   Put this file next to index.html and style.css
*/

(function () {
  // helpers
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // Mock grader - deterministic
  function mockAiGrade({ title, text }) {
    const trimmed = (text || '').trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentences = trimmed.split('.').filter(s => s.trim().length > 0).length;
    // Readability: ideal around 300 words -> score drops if far from 300
    const readability = clamp(1 - (Math.abs(300 - wordCount) / 600), 0, 1);
    // Coherence: more sentences (up to limit) means better flow
    const coherence = trimmed.includes('.') ? clamp(0.7 + Math.min(0.3, sentences / 20), 0, 1) : 0.4;
    // Grammar heuristic: too many exclamation marks likely worse; minimal penalty
    const exclam = (text.match(/!/g) || []).length;
    const grammarScore = clamp(1 - (exclam / 20), 0.4, 1);

    const score = Math.round((0.4 * readability + 0.35 * coherence + 0.25 * grammarScore) * 100);

    const rubric = [
      { aspect: 'Structure & Organization', comment: `Flow and paragraphing — ${Math.round(readability * 100)}%`, points: Math.round(readability * 10) },
      { aspect: 'Coherence & Argument', comment: `Logical progression of ideas — ${Math.round(coherence * 100)}%`, points: Math.round(coherence * 10) },
      { aspect: 'Grammar & Style', comment: `Mechanics and tone — ${Math.round(grammarScore * 100)}%`, points: Math.round(grammarScore * 10) }
    ];

    const insights = [];
    if (wordCount < 120) insights.push('Submission is short — expand key arguments with concrete examples.');
    if (!trimmed.endsWith('.')) insights.push('Ends abruptly — add a concluding sentence.');
    if (score < 60) insights.push('Revise structure and use clearer topic sentences for each paragraph.');
    if (score > 85) insights.push('Great work — polish grammar and include references or citations.');

    return { title: title || 'Untitled Submission', score, rubric, insights };
  }

  // UI bindings
  const runBtn = document.getElementById('runBtn');
  const clearBtn = document.getElementById('clearBtn');
  const titleEl = document.getElementById('title');
  const submissionEl = document.getElementById('submission');

  const resultPanel = document.getElementById('resultPanel');
  const emptyState = document.getElementById('emptyState');
  const resultView = document.getElementById('resultView');

  const resTitle = document.getElementById('resTitle');
  const resScore = document.getElementById('resScore');
  const rubricList = document.getElementById('rubricList');
  const insightsList = document.getElementById('insightsList');

  const regradeBtn = document.getElementById('regradeBtn');
  const copyBtn = document.getElementById('copyBtn');

  function showEmpty() {
    emptyState.style.display = 'block';
    resultView.classList.add('hidden');
  }

  function showResult(payload) {
    const r = mockAiGrade(payload);
    // populate UI
    resTitle.textContent = r.title;
    resScore.textContent = `${r.score}%`;

    // rubric
    rubricList.innerHTML = '';
    r.rubric.forEach(item => {
      const d = document.createElement('div');
      d.className = 'rubric-item';
      d.innerHTML = `<div class="aspect">${item.aspect}</div>
                     <div class="comment">${item.comment}</div>
                     <div class="points">Points: <strong>${item.points}</strong></div>`;
      rubricList.appendChild(d);
    });

    // insights
    insightsList.innerHTML = '';
    if (r.insights.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No major issues detected. Well done!';
      insightsList.appendChild(li);
    } else {
      r.insights.forEach(it => {
        const li = document.createElement('li');
        li.textContent = it;
        insightsList.appendChild(li);
      });
    }

    emptyState.style.display = 'none';
    resultView.classList.remove('hidden');

    // store latest in DOM for regrade / copy
    resultView.dataset.payload = JSON.stringify({ payload, result: r });
  }

  runBtn.addEventListener('click', function () {
    const payload = {
      title: titleEl.value.trim() || 'Untitled Submission',
      text: submissionEl.value || ''
    };
    if (!payload.text.trim()) {
      alert('Please paste a student submission before running the grade.');
      return;
    }

    // mock loading UX
    runBtn.disabled = true;
    runBtn.textContent = 'Analyzing...';
    setTimeout(() => {
      showResult(payload);
      runBtn.disabled = false;
      runBtn.textContent = 'Run AI Grade';
    }, 700);
  });

  clearBtn.addEventListener('click', function () {
    titleEl.value = '';
    submissionEl.value = '';
    showEmpty();
  });

  regradeBtn.addEventListener('click', function () {
    // re-run last payload with same logic (show loading)
    const record = resultView.dataset.payload ? JSON.parse(resultView.dataset.payload) : null;
    if (!record) return alert('No submission to regrade.');
    runBtn.disabled = true;
    runBtn.textContent = 'Regrading...';
    setTimeout(() => {
      showResult(record.payload);
      runBtn.disabled = false;
      runBtn.textContent = 'Run AI Grade';
    }, 650);
  });

  copyBtn.addEventListener('click', function () {
    const record = resultView.dataset.payload ? JSON.parse(resultView.dataset.payload) : null;
    if (!record) return alert('Nothing to copy yet.');
    const r = record.result;
    let out = `Title: ${r.title}\nScore: ${r.score}%\n\nRubric:\n`;
    r.rubric.forEach(it => out += `- ${it.aspect}: ${it.comment} (Points: ${it.points})\n`);
    out += `\nInsights:\n`;
    r.insights.forEach(it => out += `- ${it}\n`);
    navigator.clipboard?.writeText(out).then(() => {
      alert('Feedback copied to clipboard.');
    }).catch(() => {
      // fallback
      const area = document.createElement('textarea');
      area.value = out; document.body.appendChild(area); area.select();
      try { document.execCommand('copy'); alert('Feedback copied to clipboard.'); }
      catch (e) { alert('Unable to copy automatically — please copy manually.'); }
      area.remove();
    });
  });

  // initial state
  showEmpty();
})();
