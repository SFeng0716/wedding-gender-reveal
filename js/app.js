(function () {
  'use strict';

  var STORE_KEY = 'wedding-gender-reveal:v1';
  var QUESTION_COUNT = 9;
  var GOLDEN_Q = 8;
  var CENTER = Board.CENTER;
  var LETTERS = 'ABCD';
  var COPY = {
    boy: { title: "It's a Boy!", sub: '是男宝宝！💙', label: 'BOY', cn: '男宝宝', emoji: '💙', confetti: ['#a9c8ea', '#5e8fc7', '#d8e8f8', '#f3e2b3', '#c6a15b', '#ffffff'] },
    girl: { title: "It's a Girl!", sub: '是女宝宝！💗', label: 'GIRL', cn: '女宝宝', emoji: '💗', confetti: ['#f5bccb', '#df7f9b', '#fde3ea', '#f3e2b3', '#c6a15b', '#ffffff'] }
  };

  var $ = function (id) { return document.getElementById(id); };

  // ---------- state ----------

  function defaultState() {
    return {
      names: { groom: '', bride: '' },
      secret: '',
      lock: null,
      questions: cloneQuestions(window.DEFAULT_QUESTIONS),
      game: null
    };
  }

  function cloneQuestions(list) {
    return list.map(function (q) {
      var wrong = (q.wrong || []).slice(0, 3);
      while (wrong.length < 3) wrong.push('');
      return { q: q.q || '', answer: q.answer || '', wrong: wrong };
    });
  }

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && Array.isArray(saved.questions) && saved.questions.length === QUESTION_COUNT) {
        saved.questions = cloneQuestions(saved.questions);
        // A gender saved before passwords existed has to be picked again behind one.
        if (saved.secret && !(saved.lock && saved.lock.hash)) {
          saved.secret = '';
          saved.game = null;
        }
        return saved;
      }
    } catch (e) { /* fall through to defaults */ }
    return defaultState();
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode: keep going in memory */ }
  }

  // Light obfuscation so the answer is not sitting in plain text in storage.
  function encodeSecret(gender) {
    return btoa(Math.random().toString(36).slice(2, 8) + '|' + gender).split('').reverse().join('');
  }
  function decodeSecret(secret) {
    try {
      var g = atob(String(secret).split('').reverse().join('')).split('|')[1];
      return Board.GENDERS.indexOf(g) !== -1 ? g : null;
    } catch (e) { return null; }
  }

  var state = load();

  // ---------- setup screen ----------

  function coupleTitle() {
    return (state.names.groom.trim() || '新郎') + ' & ' + (state.names.bride.trim() || '新娘');
  }

  function renderSetup() {
    $('groom').value = state.names.groom;
    $('bride').value = state.names.bride;
    $('titlePreview').textContent = coupleTitle() + ' Gender Reveal';
    renderGenderPick();
    renderQuestions();
    $('resumeBtn').hidden = !(state.game && !state.game.finished && decodeSecret(state.secret));
    $('setupError').textContent = '';
    genderMsg('');
  }

  // Unlocking only lasts until the page is left or reloaded.
  var genderUnlocked = false;

  function renderGenderPick() {
    var gender = decodeSecret(state.secret);
    var chosen = !!(gender && state.lock);
    if (!chosen) genderUnlocked = false;
    $('genderSetup').hidden = chosen;
    $('genderLocked').hidden = !chosen || genderUnlocked;
    $('genderUnlocked').hidden = !chosen || !genderUnlocked;
    $('pwChange').hidden = true;
    ['pwNew', 'pwNew2', 'pwUnlock', 'pwChange1', 'pwChange2'].forEach(function (id) { $(id).value = ''; });

    var panel = $('genderUnlocked');
    panel.classList.remove('boy', 'girl');
    if (chosen && genderUnlocked) {
      var other = gender === 'boy' ? 'girl' : 'boy';
      panel.classList.add(gender);
      $('genderCurrent').textContent = COPY[gender].emoji + ' ' + COPY[gender].cn;
      $('genderSwitch').textContent = '改成 ' + COPY[other].emoji + ' ' + COPY[other].cn;
      $('genderSwitch').dataset.gender = other;
    }
  }

  function genderMsg(text, ok) {
    var el = $('genderMsg');
    el.textContent = text || '';
    el.className = 'gender-msg' + (ok ? ' ok' : '');
  }

  function setGender(gender) {
    state.secret = encodeSecret(gender);
    // A different answer means the current round no longer makes sense.
    state.game = null;
    save();
    $('resumeBtn').hidden = true;
  }

  function renderQuestions() {
    var list = $('questionList');
    list.innerHTML = '';
    state.questions.forEach(function (q, i) {
      var golden = i === GOLDEN_Q;
      var li = document.createElement('li');
      li.className = 'q-item' + (golden ? ' golden' : '');
      li.innerHTML =
        '<header><span>' + (golden ? '✦ 第 9 题 · 金色格子（最后揭晓）' : '第 ' + (i + 1) + ' 题') + '</span><span class="q-type"></span></header>' +
        '<label class="field"><span class="field-label">问题 <em>Question</em></span><input data-field="q" placeholder="例如：我们是在哪里认识的？"></label>' +
        '<div class="answer-grid">' +
        '<label class="answer-box correct"><span class="field-label"><i class="mark">✓</i>正确答案 <em>必填</em></span>' +
        '<input data-field="answer" placeholder="填写正确答案"></label>' +
        '<div class="answer-box wrong"><span class="field-label"><i class="mark">✗</i>错误选项 <em>可选，最多 3 个</em></span>' +
        '<div class="wrong-inputs">' +
        '<input data-field="wrong" data-w="0" placeholder="错误选项 1" aria-label="错误选项 1">' +
        '<input data-field="wrong" data-w="1" placeholder="错误选项 2" aria-label="错误选项 2">' +
        '<input data-field="wrong" data-w="2" placeholder="错误选项 3" aria-label="错误选项 3">' +
        '</div></div></div>';
      var typeChip = li.querySelector('.q-type');
      function refresh() {
        var n = q.wrong.filter(function (w) { return w.trim(); }).length;
        typeChip.textContent = n ? '选择题 · ' + (n + 1) + ' 个选项' : '开放题 · 主持人判断';
        typeChip.classList.toggle('open', !n);
        li.querySelector('[data-field="q"]').classList.toggle('missing', !q.q.trim());
        li.querySelector('[data-field="answer"]').classList.toggle('missing', !q.answer.trim());
      }
      li.querySelectorAll('input').forEach(function (input) {
        var field = input.dataset.field;
        var w = Number(input.dataset.w);
        input.maxLength = field === 'q' ? 80 : 30;
        input.value = field === 'wrong' ? q.wrong[w] : q[field];
        input.addEventListener('input', function () {
          if (field === 'wrong') q.wrong[w] = input.value;
          else q[field] = input.value;
          refresh();
          save();
        });
      });
      refresh();
      list.appendChild(li);
    });
  }

  function validateSetup() {
    if (!state.names.groom.trim() || !state.names.bride.trim()) return '请填写新郎和新娘的名字';
    if (!decodeSecret(state.secret) || !state.lock) return '请先设置密码并选择宝宝的性别';
    for (var i = 0; i < state.questions.length; i++) {
      var q = state.questions[i];
      if (!q.q.trim() || !q.answer.trim()) return '第 ' + (i + 1) + ' 题还没有填写问题或正确答案';
    }
    return '';
  }

  function bindSetup() {
    ['groom', 'bride'].forEach(function (key) {
      $(key).addEventListener('input', function (e) {
        state.names[key] = e.target.value;
        $('titlePreview').textContent = coupleTitle() + ' Gender Reveal';
        save();
      });
    });

    // A. first pick: password first, then gender.
    document.querySelectorAll('.gender-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var err = GenderLock.checkNewPassword($('pwNew').value, $('pwNew2').value);
        if (err) {
          genderMsg(err);
          $(err.indexOf('不一致') !== -1 ? 'pwNew2' : 'pwNew').focus();
          return;
        }
        GenderLock.create($('pwNew').value).then(function (lock) {
          state.lock = lock;
          setGender(btn.dataset.gender);
          genderUnlocked = false;
          renderGenderPick();
          genderMsg('');
          toast('已保存，并已用密码锁住 🔒');
        }, function () { genderMsg('无法设置密码，请用 Chrome 或 Edge 打开'); });
      });
    });

    // B. unlock
    $('genderLocked').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('pwUnlock');
      GenderLock.verify(state.lock, input.value).then(function (ok) {
        if (!ok) {
          genderMsg('密码不正确');
          input.value = '';
          input.classList.remove('shake-x');
          void input.offsetWidth;
          input.classList.add('shake-x');
          input.focus();
          return;
        }
        genderUnlocked = true;
        genderMsg('');
        renderGenderPick();
      }, function () { genderMsg('此浏览器无法验证密码，请用 Chrome 或 Edge 打开'); });
    });

    $('pwForgot').addEventListener('click', function () {
      askConfirm({
        title: '忘记密码？',
        text: '密码无法找回，只能清除当前的性别选择，重新设置密码再选。翻牌进度也会一起清除。',
        ok: '清除并重新选择',
        danger: true
      }).then(function (yes) { if (yes) forgetGender(); });
    });

    function forgetGender() {
      state.secret = '';
      state.lock = null;
      state.game = null;
      save();
      $('resumeBtn').hidden = true;
      renderGenderPick();
      genderMsg('已清除，请重新设置密码并选择', true);
      $('pwNew').focus();
    }

    // C. unlocked: switch, change password, relock
    $('genderSwitch').addEventListener('click', function () {
      var next = this.dataset.gender;
      function apply() {
        setGender(next);
        renderGenderPick();
        genderMsg('已改成 ' + COPY[next].cn, true);
      }
      if (!state.game) return apply();
      askConfirm({ title: '改成' + COPY[next].cn + '？', text: '修改性别会清空当前的翻牌进度。', ok: '确定修改' })
        .then(function (yes) { if (yes) apply(); });
    });

    $('pwChangeToggle').addEventListener('click', function () {
      $('pwChange').hidden = !$('pwChange').hidden;
      if (!$('pwChange').hidden) $('pwChange1').focus();
    });

    $('pwChange').addEventListener('submit', function (e) {
      e.preventDefault();
      var err = GenderLock.checkNewPassword($('pwChange1').value, $('pwChange2').value);
      if (err) return genderMsg(err);
      GenderLock.create($('pwChange1').value).then(function (lock) {
        state.lock = lock;
        save();
        renderGenderPick();
        genderMsg('新密码已保存', true);
      });
    });

    $('genderRelock').addEventListener('click', function () {
      genderUnlocked = false;
      renderGenderPick();
      genderMsg('');
    });

    $('resetQuestions').addEventListener('click', function () {
      askConfirm({ title: '恢复示例题目？', text: '现在填写的 9 道题会被示例题目覆盖。', ok: '恢复示例', danger: true })
        .then(function (yes) {
          if (!yes) return;
          state.questions = cloneQuestions(window.DEFAULT_QUESTIONS);
          save();
          renderQuestions();
        });
    });

    $('startBtn').addEventListener('click', function () {
      var err = validateSetup();
      $('setupError').textContent = err;
      if (err) return;
      function start() {
        state.game = { layout: Board.generateLayout(), revealed: [false, false, false, false, false, false, false, false, false], finished: false };
        save();
        showStage();
      }
      if (!(state.game && !state.game.finished)) return start();
      askConfirm({ title: '开始新的一局？', text: '当前的翻牌进度会清空，棋盘会重新洗牌。想接着玩请点「继续当前进度」。', ok: '重新开始' })
        .then(function (yes) { if (yes) start(); });
    });

    $('resumeBtn').addEventListener('click', showStage);

    $('resetAll').addEventListener('click', function () {
      askConfirm({
        title: '全部重置？',
        text: '名字、宝宝性别和密码、9 道题目、翻牌进度都会清除，回到一开始的样子（题目恢复成示例）。这个操作不能撤销。',
        ok: '全部重置',
        danger: true
      }).then(function (yes) {
        if (!yes) return;
        try { localStorage.removeItem(STORE_KEY); } catch (e) { /* nothing stored */ }
        state = defaultState();
        genderUnlocked = false;
        renderSetup();
        scrollTo(0, 0);
        toast('已全部重置，可以重新填写了');
      });
    });
  }

  // ---------- stage ----------

  var cells = [];
  var busy = false;

  function outerRevealedCount() {
    return Board.OUTER.filter(function (i) { return state.game.revealed[i]; }).length;
  }

  function showStage() {
    $('setup').hidden = true;
    $('stage').hidden = false;
    document.title = coupleTitle() + ' Gender Reveal';
    $('nameA').textContent = state.names.groom.trim();
    $('nameB').textContent = state.names.bride.trim();
    buildBoard();
    updateStatus();
    if (state.game.finished) requestAnimationFrame(function () { drawLine(false); });
  }

  function showSetup() {
    closeModal();
    $('result').hidden = true;
    $('stage').hidden = true;
    $('setup').hidden = false;
    document.title = 'Gender Reveal · 设置';
    genderUnlocked = false;
    renderSetup();
    scrollTo(0, 0);
  }

  function buildBoard() {
    var board = $('board');
    var gender = decodeSecret(state.secret);
    board.innerHTML = '';
    board.classList.toggle('done', !!state.game.finished);
    $('lineLayer').innerHTML = '';
    cells = [];
    for (var i = 0; i < 9; i++) {
      var golden = i === CENTER;
      var color = golden ? gender : state.game.layout[i];
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell' + (golden ? ' golden' : '');
      cell.dataset.i = i;
      cell.setAttribute('role', 'gridcell');
      cell.innerHTML =
        '<div class="card">' +
        (golden
          ? '<div class="face front"><span class="shine"></span><span class="star">✦</span><span class="golden-label">Golden</span><svg class="lock"><use href="#lock"/></svg></div>'
          : '<div class="face front"><span class="q">?</span><span class="heart">♥</span></div>') +
        // The golden face is filled in only at reveal time, so the answer is not in the DOM before then.
        '<div class="face back' + (golden && !state.game.revealed[i] ? '' : ' ' + color) + '">' +
        (golden && !state.game.revealed[i] ? '' : backFace(color)) +
        '</div></div>';
      if (state.game.revealed[i]) cell.classList.add('revealed');
      cell.addEventListener('click', onCellClick);
      board.appendChild(cell);
      cells.push(cell);
    }
  }

  function backFace(color) {
    var c = COPY[color];
    return '<span class="emoji" aria-hidden="true">' + c.emoji + '</span><span class="text"><span class="label">' + c.label + '</span><span class="label-cn">' + c.cn + '</span></span>';
  }

  function updateStatus() {
    var n = outerRevealedCount();
    var golden = cells[CENTER];
    var allOuter = n === Board.OUTER.length;
    golden.classList.toggle('locked', !allOuter);
    golden.classList.toggle('ready', allOuter && !state.game.revealed[CENTER]);
    golden.setAttribute('aria-label', allOuter ? '金色格子' : '金色格子（未解锁）');
    cells.forEach(function (c, i) {
      if (i !== CENTER) c.setAttribute('aria-label', state.game.revealed[i] ? COPY[state.game.layout[i]].cn : '未翻开的格子');
    });

    var tagline = $('tagline');
    var progress = $('progress');
    if (state.game.finished) {
      var g = decodeSecret(state.secret);
      tagline.textContent = COPY[g].title + ' ' + COPY[g].sub;
      progress.textContent = '🎉 揭晓完成';
    } else if (allOuter) {
      tagline.textContent = '最后的答案，就藏在金色格子里……';
      progress.textContent = '✦ 金色格子已解锁';
    } else {
      tagline.textContent = 'Boy or Girl? 答对问题，翻开格子';
      progress.textContent = '已翻开 ' + n + ' / 8';
    }
  }

  function onCellClick(e) {
    if (busy) return;
    var cell = e.currentTarget;
    var i = Number(cell.dataset.i);
    if (state.game.revealed[i]) return;
    if (i === CENTER && outerRevealedCount() < Board.OUTER.length) {
      shake(cell);
      toast('先翻开外围的 8 个格子，金色格子留到最后 ✦');
      return;
    }
    var qIndex = i === CENTER ? GOLDEN_Q : outerRevealedCount();
    openQuestion(qIndex, function () { reveal(i); });
  }

  function shake(cell) {
    cell.classList.remove('shake');
    void cell.offsetWidth;
    cell.classList.add('shake');
    setTimeout(function () { cell.classList.remove('shake'); }, 500);
  }

  function reveal(i) {
    state.game.revealed[i] = true;
    if (i === CENTER) return revealGolden();
    save();
    cells[i].classList.add('revealed');
    updateStatus();
    if (outerRevealedCount() === Board.OUTER.length) {
      setTimeout(function () { toast('外围全部翻开！是男是女，还看金色格子 ✦'); }, 900);
    }
  }

  function revealGolden() {
    var gender = decodeSecret(state.secret);
    var golden = cells[CENTER];
    busy = true;
    document.body.classList.add('suspense');
    golden.classList.remove('ready');

    countdown(3, function () {
      var back = golden.querySelector('.face.back');
      back.classList.add(gender);
      back.innerHTML = backFace(gender);
      golden.classList.add('revealed');

      setTimeout(function () {
        document.body.classList.remove('suspense');
        state.game.finished = true;
        save();
        drawLine(true);
        updateStatus();
      }, 1000);

      setTimeout(function () {
        Confetti.celebrate(COPY[gender].confetti, 1);
        showResult(gender);
        busy = false;
      }, 2200);
    });
  }

  function countdown(from, done) {
    var box = $('countdown');
    var span = box.querySelector('span');
    box.hidden = false;
    (function step(n) {
      if (n === 0) { box.hidden = true; return done(); }
      span.textContent = n;
      span.style.animation = 'none';
      void span.offsetWidth;
      span.style.animation = '';
      setTimeout(function () { step(n - 1); }, 1000);
    })(from);
  }

  function drawLine(animate) {
    var gender = decodeSecret(state.secret);
    var line = Board.winningLine(state.game.layout, gender);
    if (!line) return;
    var svg = $('lineLayer');
    var wrap = svg.getBoundingClientRect();
    function centre(idx) {
      var r = cells[idx].getBoundingClientRect();
      return { x: r.left + r.width / 2 - wrap.left, y: r.top + r.height / 2 - wrap.top };
    }
    var a = centre(line[0]);
    var b = centre(line[2]);
    // Extend a little past the outer cells' centres.
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    var ext = 0.12;
    var x1 = a.x - dx * ext, y1 = a.y - dy * ext, x2 = b.x + dx * ext, y2 = b.y + dy * ext;
    var total = len * (1 + 2 * ext);
    var deep = gender === 'boy' ? '#5e8fc7' : '#df7f9b';
    var w = cells[0].getBoundingClientRect().width;

    svg.setAttribute('viewBox', '0 0 ' + wrap.width + ' ' + wrap.height);
    svg.innerHTML =
      '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#fff" stroke-width="' + w * 0.11 + '" opacity=".9"/>' +
      '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#d6b26a" stroke-width="' + w * 0.075 + '"/>' +
      '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + deep + '" stroke-width="' + w * 0.035 + '"/>';
    svg.querySelectorAll('line').forEach(function (l) {
      if (!animate) return;
      l.style.strokeDasharray = total;
      l.style.strokeDashoffset = total;
      l.classList.add('draw');
    });

    line.forEach(function (idx) { cells[idx].classList.add('win'); });
    $('board').classList.add('done');
  }

  addEventListener('resize', function () {
    if (state.game && state.game.finished && !$('stage').hidden) drawLine(false);
  });

  function showResult(gender) {
    var c = COPY[gender];
    var box = $('result');
    box.classList.remove('boy', 'girl');
    box.classList.add(gender);
    $('resultTitle').textContent = c.title;
    $('resultSub').textContent = c.sub;
    $('resultNames').textContent = '恭喜 ' + coupleTitle();
    box.hidden = false;
  }

  $('resultClose').addEventListener('click', function () { $('result').hidden = true; });

  // ---------- question dialog ----------

  var modalDone = null;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function openQuestion(qIndex, onCorrect) {
    var q = state.questions[qIndex];
    var golden = qIndex === GOLDEN_Q;
    var card = document.querySelector('#qModal .modal-card');
    card.classList.toggle('golden', golden);
    $('qBadge').textContent = golden ? '✦ Golden Question · 最后一题' : 'Question ' + (qIndex + 1) + ' · 第 ' + (qIndex + 1) + ' 题';
    $('qText').textContent = q.q;
    var feedback = $('qFeedback');
    feedback.textContent = '';
    feedback.className = 'q-feedback';
    var box = $('qOptions');
    box.innerHTML = '';
    modalDone = onCorrect;

    var wrong = q.wrong.map(function (w) { return w.trim(); }).filter(Boolean);
    if (wrong.length) {
      var options = shuffle([q.answer.trim()].concat(wrong));
      box.className = 'q-options';
      options.forEach(function (text, k) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'q-opt';
        btn.innerHTML = '<span class="letter">' + LETTERS[k] + '</span>';
        btn.appendChild(document.createTextNode(text));
        btn.addEventListener('click', function () {
          if (text === q.answer.trim()) {
            btn.classList.add('correct');
            box.querySelectorAll('.q-opt').forEach(function (b) { b.disabled = true; });
            succeed();
          } else {
            btn.classList.add('wrong');
            btn.disabled = true;
            feedback.textContent = '再想想～ 🤔';
            feedback.className = 'q-feedback bad';
          }
        });
        box.appendChild(btn);
      });
    } else {
      // Open question: the host hears the guests' answers and judges.
      box.className = 'q-open';
      var revealBtn = document.createElement('button');
      revealBtn.type = 'button';
      revealBtn.className = 'btn ghost';
      revealBtn.textContent = '揭晓答案';
      revealBtn.addEventListener('click', function () {
        box.innerHTML = '';
        var ans = document.createElement('p');
        ans.className = 'q-answer';
        ans.textContent = '答案：' + q.answer;
        var actions = document.createElement('div');
        actions.className = 'q-actions';
        var yes = document.createElement('button');
        yes.type = 'button';
        yes.className = 'btn primary';
        yes.textContent = '答对了 ✓ 翻开格子';
        yes.addEventListener('click', function () { yes.disabled = true; succeed(); });
        var no = document.createElement('button');
        no.type = 'button';
        no.className = 'btn ghost';
        no.textContent = '没答对 ✗';
        no.addEventListener('click', closeModal);
        actions.appendChild(yes);
        actions.appendChild(no);
        box.appendChild(ans);
        box.appendChild(actions);
      });
      box.appendChild(revealBtn);
    }

    function succeed() {
      feedback.textContent = golden ? '答对了！准备揭晓…… ✨' : '答对了！🎉';
      feedback.className = 'q-feedback ok';
      $('qClose').hidden = true;
      setTimeout(function () {
        var done = modalDone;
        closeModal();
        if (done) done();
      }, 1000);
    }

    $('qClose').hidden = false;
    $('qModal').hidden = false;
  }

  function closeModal() {
    modalDone = null;
    $('qModal').hidden = true;
  }

  $('qClose').addEventListener('click', closeModal);
  $('qModal').addEventListener('click', function (e) { if (e.target === e.currentTarget && !$('qClose').hidden) closeModal(); });

  // ---------- chrome ----------

  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
  }

  $('fullscreenBtn').addEventListener('click', toggleFullscreen);
  $('settingsBtn').addEventListener('click', function () {
    if (busy) return;
    askConfirm({ title: '返回设置页面？', text: '宝宝性别在设置页是用密码锁住的，翻牌进度会保留。', ok: '去设置' })
      .then(function (yes) { if (yes) showSetup(); });
  });

  // ---------- user guide ----------

  var GUIDE_SEEN_KEY = 'wedding-gender-reveal:guide-seen';

  function openGuide() {
    $('guideModal').hidden = false;
    $('guideModal').querySelector('.guide-card').scrollTop = 0;
    $('guideDone').focus();
  }
  function closeGuide() {
    $('guideModal').hidden = true;
    try { localStorage.setItem(GUIDE_SEEN_KEY, '1'); } catch (e) { /* ignore */ }
  }
  $('guideBtn').addEventListener('click', openGuide);
  $('guideBtnStage').addEventListener('click', openGuide);
  $('guideClose').addEventListener('click', closeGuide);
  $('guideDone').addEventListener('click', closeGuide);
  $('guideModal').addEventListener('click', function (e) { if (e.target === e.currentTarget) closeGuide(); });

  // In-page replacement for window.confirm(): some embedded browsers (and
  // screen-share tools) suppress native dialogs, which made buttons look dead.
  var confirmResolve = null;
  function askConfirm(opts) {
    $('confirmTitle').textContent = opts.title;
    $('confirmText').textContent = opts.text || '';
    var ok = $('confirmOk');
    ok.textContent = opts.ok || '确定';
    ok.classList.toggle('danger', !!opts.danger);
    if (confirmResolve) confirmResolve(false);
    $('confirmModal').hidden = false;
    $('confirmCancel').focus();
    return new Promise(function (resolve) { confirmResolve = resolve; });
  }
  function settleConfirm(result) {
    $('confirmModal').hidden = true;
    var resolve = confirmResolve;
    confirmResolve = null;
    if (resolve) resolve(result);
  }
  $('confirmOk').addEventListener('click', function () { settleConfirm(true); });
  $('confirmCancel').addEventListener('click', function () { settleConfirm(false); });
  $('confirmModal').addEventListener('click', function (e) { if (e.target === e.currentTarget) settleConfirm(false); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('confirmModal').hidden) return settleConfirm(false);
    if (e.key === 'Escape' && !$('guideModal').hidden) return closeGuide();
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Escape' && !$('qModal').hidden && !$('qClose').hidden) closeModal();
    if ((e.key === 'f' || e.key === 'F') && !$('stage').hidden) toggleFullscreen();
  });

  function spawnPetals() {
    var box = document.querySelector('.petals');
    for (var i = 0; i < 16; i++) {
      var p = document.createElement('span');
      p.className = 'petal' + (i % 3 === 0 ? ' alt' : '');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.animationDuration = 12 + Math.random() * 14 + 's';
      p.style.animationDelay = -Math.random() * 20 + 's';
      var s = 0.6 + Math.random() * 0.8;
      p.style.width = 14 * s + 'px';
      p.style.height = 18 * s + 'px';
      box.appendChild(p);
    }
  }

  // ---------- boot ----------

  bindSetup();
  spawnPetals();
  if (state.game && decodeSecret(state.secret) && !validateSetup()) showStage();
  else showSetup();

  // First visit on this computer: show the guide once.
  var guideSeen = true;
  try { guideSeen = !!localStorage.getItem(GUIDE_SEEN_KEY); } catch (e) { /* storage blocked: don't nag */ }
  if (!guideSeen && $('stage').hidden) openGuide();
})();
