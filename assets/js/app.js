/*
 * Grow Happy けいけんデータベース：画面の動き
 *
 * ・共通のヘッダー／フッター／下部タブを描画
 * ・会員ページの入室チェック（※試作のため、ブラウザ内に登録状態を保存するだけの仮の仕組み）
 * ・検索、しぼりこみ、ストーリー表示、保存、12 Steps の切り替え
 *
 * 本番では会員登録・ログイン・有料会員の判定をサーバー側で行ってください。
 */
(function () {
  'use strict';

  var D = window.GH_DATA;
  var page = document.body.getAttribute('data-page');
  var area = document.body.getAttribute('data-area'); // guest | member

  /* ---------- 保存領域（使えない環境でも落ちないように） ---------- */
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var session = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  var member = store.get('gh_member', null);

  /* ---------- 小さな道具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function themeById(id) { return D.themes.filter(function (t) { return t.id === id; })[0]; }
  function ageById(id) { return D.ages.filter(function (a) { return a.id === id; })[0]; }
  function storyById(id) { return D.stories.filter(function (s) { return s.id === id; })[0]; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  // 12 Steps の丸に使う色（テーマ色を順番に回す）
  var STEP_TONES = ['arrival', 'daily', 'testing', 'school', 'teen'];
  function stepTone(no) { return 't-' + STEP_TONES[(no - 1) % STEP_TONES.length]; }
  // 12 Steps テキスト表紙のイラスト
  function stepImg(no) { return 'assets/img/steps/step' + pad2(no) + '.png'; }

  /* ---------- アイコン ---------- */
  var ICON = {
    logo: '<svg viewBox="0 0 38 38" aria-hidden="true"><rect width="38" height="38" rx="13" fill="#F4977E"/><path d="M19 29v-10M19 19c0-5 3.5-7.5 7.5-7.5 0 5-3.5 7.5-7.5 7.5zM19 21c0-4-3-6-6.5-6 0 4 3 6 6.5 6z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-8-4.6-8-10.2C4 6.6 6.4 5 8.6 5c1.6 0 2.8.9 3.4 2 .6-1.1 1.8-2 3.4-2C17.6 5 20 6.6 20 9.8 20 15.4 12 20 12 20z" fill="#F4977E"/></svg>',
    heartWhite: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-8-4.6-8-10.2C4 6.6 6.4 5 8.6 5c1.6 0 2.8.9 3.4 2 .6-1.1 1.8-2 3.4-2C17.6 5 20 6.6 20 9.8 20 15.4 12 20 12 20z" fill="#FFFFFF"/></svg>',
    heartLine: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-8-4.6-8-10.2C4 6.6 6.4 5 8.6 5c1.6 0 2.8.9 3.4 2 .6-1.1 1.8-2 3.4-2C17.6 5 20 6.6 20 9.8 20 15.4 12 20 12 20z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
    saveHeart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-8-4.6-8-10.2C4 6.6 6.4 5 8.6 5c1.6 0 2.8.9 3.4 2 .6-1.1 1.8-2 3.4-2C17.6 5 20 6.6 20 9.8 20 15.4 12 20 12 20z" fill="none" stroke="#E07D63" stroke-width="2" stroke-linejoin="round"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.9"/><rect x="13" y="4" width="7" height="7" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.9"/><rect x="4" y="13" width="7" height="7" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.9"/><rect x="13" y="13" width="7" height="7" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>',
    stairs: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h4v-4h4v-4h4V7h4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    lock: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    back: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="#4A3B35" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevron: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    face: '<svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="22" r="15" fill="#FFD8BE"/><path d="M6 19c2-9 9-13 15-12s12 5 13 11c-5-3-12-5-18-2-4 2-7 3-10 3z" fill="#8C5A44"/><circle cx="15" cy="23" r="1.8" fill="#4A3B35"/><circle cx="25" cy="23" r="1.8" fill="#4A3B35"/><path d="M17 28q3 3 6 0" fill="none" stroke="#4A3B35" stroke-width="1.6" stroke-linecap="round"/></svg>',
    bubble: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 4v-4H6a2 2 0 0 1-2-2z" fill="#D0607E"/></svg>',
    sprout: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20v-8M12 12c0-4 3-6 6-6 0 4-3 6-6 6zM12 14c0-3-2.5-5-5-5 0 3 2.5 5 5 5z" fill="none" stroke="#3E9A6E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M6 3v18M10 8h5M10 12h5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    lockBig: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="3" fill="none" stroke="#C0603F" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#C0603F" stroke-width="2"/></svg>',
    star: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6-4.5-4.1 6-.7z" fill="#B7A2EA"/></svg>',
    theme: {
      arrival: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7v9H4z" fill="none" stroke="var(--t-icon)" stroke-width="2" stroke-linejoin="round"/><path d="M12 17.5s-3-1.7-3-3.8c0-1.2.9-1.8 1.7-1.8.6 0 1 .3 1.3.8.3-.5.7-.8 1.3-.8.8 0 1.7.6 1.7 1.8 0 2.1-3 3.8-3 3.8z" fill="var(--t-icon)"/></svg>',
      daily: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" fill="var(--butter-deep)" stroke="var(--t-icon)" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      testing: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" fill="none" stroke="var(--t-icon)" stroke-width="2.2" stroke-linecap="round"/></svg>',
      school: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="9" width="12" height="11" rx="3" fill="none" stroke="var(--t-icon)" stroke-width="2"/><path d="M9 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="var(--t-icon)" stroke-width="2"/></svg>',
      support: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="9" r="3" fill="none" stroke="var(--t-icon)" stroke-width="2"/><circle cx="16" cy="9" r="3" fill="none" stroke="var(--t-icon)" stroke-width="2"/><path d="M3 19c0-3 2.5-5 5-5s5 2 5 5M11 19c0-3 2.5-5 5-5s5 2 5 5" fill="none" stroke="var(--t-icon)" stroke-width="2" stroke-linecap="round"/></svg>',
      teen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6-4.5-4.1 6-.7z" fill="none" stroke="var(--t-icon)" stroke-width="2" stroke-linejoin="round"/></svg>'
    }
  };

  /* ---------- 会員ページの入室チェック ---------- */
  // public：誰でも開けるが、会員かどうかで中身が変わるページ（ストーリー：非会員はあらすじだけ）
  if (area === 'public') area = member ? 'member' : 'guest';
  if (area === 'member' && !member) {
    session.set('gh_next', location.pathname.split('/').pop() + location.hash);
    location.replace('signup.html');
    return;
  }

  /* ---------- 共通ヘッダー・フッター・下部タブ ---------- */
  function renderChrome() {
    var cur = function (p) { return page === p ? ' aria-current="page"' : ''; };
    var header = $('#site-header');
    if (header) {
      var nav, actions, home;
      if (area === 'member') {
        home = 'search.html';
        nav =
          '<a href="search.html"' + cur('search') + '>さがす</a>' +
          '<a href="themes.html"' + cur('themes') + '>テーマ</a>' +
          '<a href="themes.html#steps">12 Steps</a>' +
          '<a href="note.html"' + cur('note') + '>わたしのノート</a>';
        actions =
          '<div class="menu-wrap">' +
          '<button class="avatar-btn" id="avatar-btn" aria-expanded="false" aria-controls="user-menu" aria-label="マイページ">' + ICON.face + '</button>' +
          '<div class="user-menu" id="user-menu" hidden>' +
          '<p>' + esc(member && member.nick ? member.nick : 'ゲスト') + ' さん</p>' +
          '<a href="note.html">わたしのノート</a>' +
          '<a href="search.html#saved">保存したストーリー</a>' +
          '<a href="plans.html">会員プラン</a>' +
          '<button type="button" id="logout-btn">ログアウト</button>' +
          '</div></div>';
      } else {
        home = 'index.html';
        nav =
          '<a href="themes.html"' + cur('themes') + '>テーマ</a>' +
          '<a href="themes.html#steps">12 Steps</a>' +
          '<a href="plans.html"' + cur('plans') + '>会員でできること</a>';
        actions = member
          ? '<a class="btn btn-primary btn-sm" href="search.html">ストーリーを探す</a>'
          : '<a class="btn btn-white btn-sm" href="signup.html#login">ログイン</a>' +
            '<a class="btn btn-primary btn-sm hide-sm" href="signup.html">無料で会員登録</a>';
      }
      header.className = 'site-header';
      header.innerHTML =
        '<div class="container header-inner">' +
        '<a class="logo" href="' + home + '" aria-label="growhappy けいけんデータベース トップへ">' +
        '<img class="logo-mark" src="assets/img/logo.svg" alt="growhappy" width="748" height="142">' +
        '<span class="logo-sub">けいけんデータベース</span></a>' +
        '<nav class="global-nav" aria-label="メイン">' + nav + '</nav>' +
        '<div class="header-actions">' + actions + '</div>' +
        '</div>';
    }

    var footer = $('#site-footer');
    if (footer) {
      footer.className = 'site-footer';
      footer.innerHTML =
        '<div class="footer-band"><div class="container footer-inner">' +
        '<p class="footer-tag">ほかのおうちの「あのとき」が、きょうのヒントに。</p>' +
        '<img class="footer-logo" src="assets/img/logo-white.svg" alt="growhappy" width="748" height="142">' +
        '<div class="footer-bottom">' +
        '<nav class="footer-nav" aria-label="フッター">' +
        '<a href="#">利用規約</a><a href="#">プライバシーポリシー</a><a href="#">お問い合わせ</a><a href="#">運営について</a>' +
        '</nav><p class="copy">© growhappy</p></div></div></div>';
    }

    if (area === 'member') {
      var tab = document.createElement('nav');
      tab.className = 'tabbar';
      tab.setAttribute('aria-label', 'メインメニュー');
      tab.innerHTML =
        '<a href="search.html"' + cur('search') + cur('story') + '><span class="ic">' + ICON.search + '</span>さがす</a>' +
        '<a href="themes.html"' + cur('themes') + '><span class="ic">' + ICON.grid + '</span>テーマ</a>' +
        '<a href="themes.html#steps"><span class="ic">' + ICON.stairs + '</span>12 Steps</a>' +
        '<a href="note.html"' + cur('note') + '><span class="ic">' + ICON.book + '</span>ノート</a>';
      document.body.appendChild(tab);
      document.body.classList.add('has-tabbar');

      var btn = $('#avatar-btn'), menu = $('#user-menu');
      if (btn && menu) {
        btn.addEventListener('click', function () {
          var open = menu.hidden;
          menu.hidden = !open;
          btn.setAttribute('aria-expanded', String(open));
        });
        document.addEventListener('click', function (e) {
          if (!menu.hidden && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
            menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
          }
        });
      }
      var out = $('#logout-btn');
      if (out) out.addEventListener('click', function () { store.del('gh_member'); location.href = 'index.html'; });
    }
  }

  /* ---------- 部品 ---------- */
  function themeCardHTML(t, href) {
    return '<a class="theme-card t-' + t.id + '" href="' + href + '">' +
      '<span class="ti">' + ICON.theme[t.id] + '</span>' +
      '<span><span class="tn">' + esc(t.name) + '</span><span class="td">' + esc(t.desc) + '</span></span></a>';
  }
  function themeRowHTML(t, href) {
    return '<a class="theme-row t-' + t.id + '" href="' + href + '">' +
      '<span class="ti">' + ICON.theme[t.id] + '</span>' +
      '<span class="tx"><span class="tn">' + esc(t.name) + '</span><span class="td">' + esc(t.desc) + '</span></span>' +
      '<span style="color:#C9B3A8">' + ICON.chevron + '</span></a>';
  }
  var memberHref = function (hash) { return member ? 'search.html' + hash : 'signup.html'; };

  /* ---------- 検索の文字そろえ ---------- */
  function norm(s) {
    s = String(s || '');
    if (s.normalize) s = s.normalize('NFKC');
    s = s.toLowerCase().replace(/[ァ-ヶ]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0x60); // カタカナ → ひらがな
    });
    return s.replace(/\s+/g, '');
  }
  function variants(term) {
    var n = norm(term), out = [n];
    D.synonyms.forEach(function (group) {
      var g = group.map(norm);
      if (g.indexOf(n) !== -1) out = out.concat(g);
    });
    return out;
  }
  function haystack(s) {
    var t = themeById(s.theme);
    return norm([s.title, s.worry, s.content, s.action, s.result,
      (s.categories || []).join(' '), (s.keywords || []).join(' '), t ? t.name : ''].join(' '));
  }

  /* ---------- 各ページ ---------- */
  var pages = {};

  pages.home = function () {
    var grid = $('#theme-grid');
    if (grid) grid.innerHTML = D.themes.map(function (t) { return themeCardHTML(t, memberHref('#t-' + t.id)); }).join('');
    var syn = $('#synopsis-list');
    if (syn) syn.innerHTML = D.stories.slice(0, 3).map(synopsisCardHTML).join('');
    var strip = $('#step-strip');
    if (strip) strip.innerHTML = D.steps.map(function (s) {
      return '<li><a class="step-card" href="themes.html#step-' + s.no + '">' +
        '<span class="step-art"><img src="' + stepImg(s.no) + '" alt="" loading="lazy" width="240" height="170"></span>' +
        '<span class="step-card-no">Step ' + s.no + '</span>' +
        '<span class="step-card-name">' + esc(s.name) + '</span></a></li>';
    }).join('');
  };

  pages.themes = function () {
    var list = $('#theme-list');
    if (list) list.innerHTML = D.themes.map(function (t) { return themeRowHTML(t, memberHref('#t-' + t.id)); }).join('');

    var stepList = $('#step-list');
    var detail = $('#step-detail');
    var m = location.hash.match(/^#step-(\d+)$/);
    var selected = m && D.steps[Number(m[1]) - 1] ? Number(m[1]) : 1;
    if (m) { var band = $('#steps'); if (band) setTimeout(function () { band.scrollIntoView(); }, 0); }
    function draw() {
      stepList.innerHTML = D.steps.map(function (s) {
        return '<li><button type="button" class="step-btn" data-no="' + s.no + '" aria-pressed="' + (s.no === selected) + '" aria-controls="step-detail">' +
          '<span class="step-no ' + stepTone(s.no) + '">' + s.no + '</span>' + esc(s.name) + '</button></li>';
      }).join('');
      var s = D.steps[selected - 1];
      detail.innerHTML =
        '<div class="step-art step-art-lg"><img src="' + stepImg(s.no) + '" alt="Step ' + s.no + ' 表紙のイラスト"></div>' +
        '<p class="eyebrow">STEP ' + pad2(s.no) + '</p>' +
        '<h3>' + esc(s.name) + '</h3>' +
        '<figure class="motto"><blockquote>' + esc(s.motto) + '</blockquote><figcaption>里親の子育てスキル12カ条より</figcaption></figure>' +
        '<a class="btn btn-soft" href="' + memberHref('#step-' + s.no) + '">このステップのストーリーを見る' + (member ? ICON.chevron : ICON.lock) + '</a>';
    }
    stepList.addEventListener('click', function (e) {
      var b = e.target.closest('.step-btn');
      if (!b) return;
      selected = Number(b.getAttribute('data-no'));
      draw();
      $('.step-btn[data-no="' + selected + '"]').focus();
    });
    draw();
  };

  pages.signup = function () {
    var tabs = $all('.tab'), panels = { signup: $('#signup-form'), login: $('#login-form') };
    function show(mode) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-mode') === mode)); });
      panels.signup.hidden = mode !== 'signup';
      panels.login.hidden = mode !== 'login';
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-mode')); }); });
    show(location.hash === '#login' ? 'login' : 'signup');

    function done(nick, role) {
      store.set('gh_member', { nick: nick || 'ゲスト', role: role || '', at: Date.now() });
      var next = session.get('gh_next');
      session.del('gh_next');
      location.href = next || 'search.html';
    }
    function fail(form, msg) {
      var box = $('.form-error', form);
      box.textContent = msg;
      box.hidden = false;
    }
    $('#signup-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      if (!f.nick.value.trim() || !f.email.value.trim() || f.password.value.length < 8) {
        return fail(f, 'ニックネーム、メールアドレス、8文字以上のパスワードを入力してください。');
      }
      if (!f.agree.checked) return fail(f, '利用規約とプライバシーポリシーへの同意にチェックを入れてください。');
      var r = f.querySelector('input[name="role"]:checked');
      done(f.nick.value.trim(), r ? r.value : '');
    });
    $('#login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      if (!f.email.value.trim() || !f.password.value) return fail(f, 'メールアドレスとパスワードを入力してください。');
      done(f.email.value.split('@')[0]);
    });
  };

  pages.search = function () {
    var state = { q: '', theme: null, age: null, step: '', saved: false };
    var h = location.hash.replace('#', '');
    if (h.indexOf('t-') === 0) state.theme = h.slice(2);
    if (h.indexOf('step-') === 0) state.step = h.slice(5);
    if (h === 'saved') state.saved = true;

    var hi = $('#greet-name');
    if (hi) hi.textContent = (member && member.nick) || 'ゲスト';

    var input = $('#q');
    var themeRow = $('#theme-chips'), ageRow = $('#age-chips'), stepSel = $('#step-select');
    var savedChip = $('#saved-chip');

    stepSel.innerHTML = '<option value="">すべてのステップ</option>' +
      D.steps.map(function (s) { return '<option value="' + s.no + '">STEP ' + pad2(s.no) + ' ' + esc(s.name) + '</option>'; }).join('');
    stepSel.value = state.step;

    $('#quick-words').insertAdjacentHTML('beforeend', [
      ['不登校', 'arrival'], ['うそ', 'testing'], ['手が出る', 'school'], ['夜泣き', 'daily'], ['面会', 'support']
    ].map(function (w) {
      return '<button type="button" class="quick-word t-' + w[1] + '" data-word="' + esc(w[0]) + '">#' + esc(w[0]) + '</button>';
    }).join(''));

    function chips() {
      themeRow.innerHTML = D.themes.map(function (t) {
        return '<button type="button" class="chip" data-theme="' + t.id + '" aria-pressed="' + (state.theme === t.id) + '">' + esc(t.name) + '</button>';
      }).join('');
      ageRow.innerHTML = D.ages.map(function (a) {
        return '<button type="button" class="chip" data-age="' + a.id + '" aria-pressed="' + (state.age === a.id) + '">' + esc(a.name) + '</button>';
      }).join('');
      savedChip.setAttribute('aria-pressed', String(state.saved));
    }

    function render() {
      var saved = store.get('gh_saved', []);
      var terms = state.q.split(/[\s　]+/).filter(Boolean);
      var list = D.stories.filter(function (s) {
        if (state.theme && s.theme !== state.theme) return false;
        if (state.age && s.age !== state.age) return false;
        if (state.step && String(s.step) !== String(state.step)) return false;
        if (state.saved && saved.indexOf(s.id) === -1) return false;
        if (terms.length) {
          var hay = haystack(s);
          return terms.every(function (t) { return variants(t).some(function (v) { return hay.indexOf(v) !== -1; }); });
        }
        return true;
      });
      $('#count').textContent = list.length;
      $('#empty').hidden = list.length !== 0;
      $('#empty-text').textContent = state.saved && !saved.length
        ? 'まだ保存したストーリーはありません。ストーリー本文のハートから保存できます。'
        : 'この条件のストーリーはまだありません。ことばを変えるか、テーマや年代を広げてみてください。';
      $('#result-grid').innerHTML = list.map(function (s) {
        var t = themeById(s.theme), a = ageById(s.age);
        return '<a class="story-card t-' + s.theme + '" href="story.html#' + s.id + '">' +
          '<span class="badge">' + ICON.heartWhite + '</span>' +
          '<span class="body"><span class="tags">' +
          '<span class="tag tag-theme">' + esc(t ? t.name : '') + '</span>' +
          '<span class="tag">' + esc(a ? a.name : '') + '</span>' +
          '<span class="tag">STEP ' + pad2(s.step) + '</span></span>' +
          '<span class="title">' + esc(s.title) + '</span>' +
          '<span class="worry">' + esc(s.worry) + '</span></span></a>';
      }).join('');
    }

    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { state.q = input.value; render(); }, 150);
    });
    $('#search-form').addEventListener('submit', function (e) { e.preventDefault(); state.q = input.value; render(); });
    $('#quick-words').addEventListener('click', function (e) {
      var b = e.target.closest('.quick-word');
      if (!b) return;
      input.value = b.getAttribute('data-word');
      state.q = input.value; render();
    });
    themeRow.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      var id = b.getAttribute('data-theme');
      state.theme = state.theme === id ? null : id; chips(); render();
    });
    ageRow.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      var id = b.getAttribute('data-age');
      state.age = state.age === id ? null : id; chips(); render();
    });
    savedChip.addEventListener('click', function () { state.saved = !state.saved; chips(); render(); });
    stepSel.addEventListener('change', function () { state.step = stepSel.value; render(); });
    $('#clear-btn').addEventListener('click', function () {
      state = { q: '', theme: null, age: null, step: '', saved: false };
      input.value = ''; stepSel.value = ''; chips(); render();
    });
    window.addEventListener('hashchange', function () { location.reload(); });

    chips();
    render();
  };

  function stepBoxHTML(s) {
    var st = D.steps[s.step - 1];
    if (!st) return '';
    return '<a class="step-box" href="themes.html#step-' + st.no + '">' +
      '<span class="eyebrow">このストーリーに関わるスキル</span>' +
      '<span class="step-art"><img src="' + stepImg(st.no) + '" alt="" loading="lazy"></span>' +
      '<span class="step-box-head"><span class="step-no ' + stepTone(st.no) + '">' + st.no + '</span>' +
      '<span class="step-box-name">' + esc(st.name) + '</span></span>' +
      '<span class="step-box-motto">' + esc(st.motto) + '</span></a>';
  }

  // あらすじカード（誰でも読める）
  function synopsisCardHTML(s) {
    var t = themeById(s.theme), a = ageById(s.age);
    return '<a class="synopsis-card t-' + s.theme + '" href="story.html#' + s.id + '">' +
      '<span class="tags"><span class="tag tag-theme">' + esc(t.name) + '</span><span class="tag">' + esc(a.name) + '</span></span>' +
      '<span class="title">' + esc(s.title) + '</span>' +
      '<span class="worry">' + esc(s.worry) + '</span>' +
      '<span class="synopsis-foot"><span class="go">あらすじを読む</span>' +
      (member ? '' : '<span class="lock">' + ICON.lock + '本文は会員向け</span>') + '</span></a>';
  }

  var ROLE_LABEL = { foster: '里親さん', carer: '養育者さん', future: 'これから里親さん', other: '会員さん' };
  function whenText(at) {
    var d = Math.floor((Date.now() - at) / 86400000);
    if (d < 1) return 'きょう';
    return d + '日前';
  }

  pages.note = function () {
    var saved = store.get('gh_saved', []).map(storyById).filter(Boolean);
    var box = $('#note-saved');
    box.innerHTML = saved.length
      ? saved.map(function (s) {
          return '<a class="related-item t-' + s.theme + '" href="story.html#' + s.id + '"><span class="sq" aria-hidden="true"></span><span class="t">' + esc(s.title) + '</span></a>';
        }).join('')
      : '<p class="note">まだ保存したストーリーはありません。ストーリー本文の「保存する」から追加できます。</p>';
  };

  pages.story = function () {
    var root = $('#story-root');
    if (!member) {
      var back = $('.page-title');
      if (back) back.innerHTML = '<a class="back-btn" href="index.html" aria-label="トップにもどる">' + ICON.back + '</a><span class="note">トップにもどる</span>';
    }
    function drawGuest(s) {
      var t = themeById(s.theme), a = ageById(s.age);
      var others = D.stories.filter(function (x) { return x.id !== s.id; }).slice(0, 3);
      root.innerHTML =
        '<div class="story-layout">' +
        '<article class="story-main t-' + s.theme + '">' +
          '<div class="story-hero">' +
            '<span class="blob" style="top:-40px;right:-36px;width:130px;height:130px;background:var(--peach)" aria-hidden="true"></span>' +
            '<div class="tags"><span class="tag tag-theme">' + esc(t.name) + '</span><span class="tag">' + esc(a.name) + '</span>' +
            '<a class="tag" href="themes.html#step-' + s.step + '">STEP ' + pad2(s.step) + '</a></div>' +
            '<h1>' + esc(s.title) + '</h1>' +
          '</div>' +
          '<section class="block block-worry card"><h2><span class="num t-testing">' + ICON.bubble + '</span>あらすじ</h2><p class="text" id="f-worry"></p></section>' +
          '<section class="locked" aria-label="会員向けの本文">' +
            '<div class="locked-preview" aria-hidden="true">' +
              '<p class="h">内容</p><p>ここには会員の方だけが読める本文が入ります。ここには会員の方だけが読める本文が入ります。</p>' +
              '<p class="h">対応方法</p><p>ここには会員の方だけが読める本文が入ります。ここには会員の方だけが読める本文が入ります。</p>' +
              '<p class="h">結果</p><p>ここには会員の方だけが読める本文が入ります。</p>' +
            '</div>' +
            '<div class="locked-card">' +
              '<span class="round-icon" style="width:46px;height:46px;background:var(--peach)">' + ICON.lockBig + '</span>' +
              '<p class="msg">「内容・対応方法・結果」は<br>会員の方が読めます</p>' +
              '<p class="note">登録は無料です。コメントやノートも使えます。</p>' +
              '<a class="btn btn-primary btn-block" href="signup.html">無料で会員登録して続きを読む</a>' +
              '<a href="signup.html#login" style="font-size:13px;font-weight:700">ログインはこちら</a>' +
            '</div>' +
          '</section>' +
        '</article>' +
        '<aside class="story-side">' + stepBoxHTML(s) +
          '<section class="related"><h2 class="section-title" style="font-size:18px">' + ICON.heart + 'ほかのあらすじ</h2>' +
            others.map(function (r) {
              var rt = themeById(r.theme), ra = ageById(r.age);
              return '<a class="related-item t-' + r.theme + '" href="story.html#' + r.id + '"><span class="sq" aria-hidden="true"></span>' +
                '<span><span class="meta">' + esc(rt.name) + '・' + esc(ra.name) + '</span><br><span class="t">' + esc(r.title) + '</span></span></a>';
            }).join('') +
          '</section>' +
        '</aside></div>';
      $('#f-worry').textContent = s.worry;
      window.scrollTo(0, 0);
    }

    function commentsHTML(s) {
      var mine = store.get('gh_comments', {})[s.id] || [];
      var list = (s.comments || []).concat(mine);
      return '<section class="comments" aria-label="コメント">' +
        '<div class="comments-head"><h2 class="section-title" style="font-size:19px">' + ICON.bubble + 'コメント</h2><span class="note"><span id="c-count">' + list.length + '</span>件</span></div>' +
        '<div class="comment-list" id="comment-list">' +
        list.map(function (c) {
          return '<div class="comment card"><span class="who">' + esc(c.who) + '・' + esc(c.when || whenText(c.at)) + '</span><p class="text"></p></div>';
        }).join('') +
        '</div>' +
        '<form class="comment-form" id="comment-form" novalidate>' +
          '<label for="comment">コメントを書く</label>' +
          '<textarea id="comment" name="comment" rows="3" maxlength="400" placeholder="あたたかい言葉を残してみませんか"></textarea>' +
          '<div class="comment-foot"><span class="note">名前は出ず「匿名」で表示されます</span>' +
          '<button type="submit" class="btn btn-primary btn-sm">送る</button></div>' +
        '</form></section>';
    }

    function draw() {
      var id = location.hash.replace('#', '') || D.stories[0].id;
      var s = storyById(id);
      if (!s) {
        root.innerHTML = '<div class="card empty">ストーリーが見つかりませんでした。<br><a href="' + (member ? 'search.html' : 'index.html') + '">もどる</a></div>';
        return;
      }
      var t = themeById(s.theme), a = ageById(s.age);
      document.title = s.title + '｜Grow Happy けいけんデータベース';
      if (!member) { drawGuest(s); return; }
      var saved = store.get('gh_saved', []);
      var isSaved = saved.indexOf(s.id) !== -1;
      var related = D.stories.filter(function (x) { return x.id !== s.id && (x.theme === s.theme || x.age === s.age); })
        .concat(D.stories.filter(function (x) { return x.id !== s.id && x.theme !== s.theme && x.age !== s.age; }))
        .slice(0, 3);

      root.innerHTML =
        '<nav class="breadcrumb" aria-label="パンくず"><a href="search.html">さがす</a><span aria-hidden="true">›</span>' +
        '<a href="search.html#t-' + s.theme + '">' + esc(t.name) + '</a><span aria-hidden="true">›</span><span>' + esc(s.title) + '</span></nav>' +
        '<div class="story-layout">' +
        '<article class="story-main t-' + s.theme + '">' +
          '<div class="story-hero">' +
            '<span class="blob" style="top:-40px;right:-36px;width:130px;height:130px;background:var(--peach)" aria-hidden="true"></span>' +
            '<div class="tags"><a class="tag tag-theme" href="search.html#t-' + s.theme + '">' + esc(t.name) + '</a>' +
            '<span class="tag">' + esc(a.name) + '</span>' +
            '<a class="tag" href="themes.html#step-' + s.step + '">STEP ' + pad2(s.step) + '</a></div>' +
            '<h1>' + esc(s.title) + '</h1>' +
            '<div class="story-meta"><div class="author"><span class="face" aria-hidden="true">' + ICON.face + '</span>' +
            '<span>里親歴 [◯年]・子ども ' + esc(a.name) + '<br>※アイコンは仮</span></div>' +
            '<button type="button" class="save-btn" id="save-btn" aria-pressed="' + isSaved + '">' + ICON.saveHeart +
            '<span>' + (isSaved ? '保存済み' : '保存する') + '</span></button></div>' +
          '</div>' +
          '<section class="block block-worry card"><h2><span class="num t-testing">' + ICON.bubble + '</span>子育ての悩み</h2><p class="text" id="f-worry"></p></section>' +
          '<section class="block card"><h2><span class="num t-daily">1</span>内容</h2><p class="text" id="f-content"></p></section>' +
          '<section class="block card"><h2><span class="num t-school">2</span>対応方法</h2><p class="text" id="f-action"></p></section>' +
          '<section class="block block-result"><h2><span class="num" style="background:var(--surface)">' + ICON.sprout + '</span>結果</h2><p class="text" id="f-result"></p></section>' +
          commentsHTML(s) +
        '</article>' +
        '<aside class="story-side">' +
          '<section class="card block">' +
            '<div class="word-group"><h2>カテゴリー</h2><div class="word-links">' +
            (s.categories || []).map(function (c) { return '<a class="word-link outline" href="search.html">' + esc(c) + '</a>'; }).join('') +
            '</div></div>' +
            '<div class="word-group"><h2>キーワード</h2><div class="word-links">' +
            (s.keywords || []).map(function (k, i) {
              return '<a class="word-link ' + ['t-testing', 't-daily', 't-school', 't-support', 't-teen'][i % 5] + '" href="search.html" data-word="' + esc(k) + '">#' + esc(k) + '</a>';
            }).join('') +
            '</div></div>' +
          '</section>' +
          stepBoxHTML(s) +
          '<section class="paid-box"><p class="h">' + ICON.star + '有料会員向け</p><p>[有料会員に表示する内容（要検討）]</p><a href="plans.html">有料会員について</a></section>' +
          '<section class="related"><h2 class="section-title" style="font-size:18px">' + ICON.heart + '近いストーリー</h2>' +
            related.map(function (r) {
              var rt = themeById(r.theme), ra = ageById(r.age);
              return '<a class="related-item t-' + r.theme + '" href="story.html#' + r.id + '"><span class="sq" aria-hidden="true"></span>' +
                '<span><span class="meta">' + esc(rt.name) + '・' + esc(ra.name) + '</span><br><span class="t">' + esc(r.title) + '</span></span></a>';
            }).join('') +
          '</section>' +
        '</aside></div>';

      // シートの文章は textContent でそのまま入れる（タグや記号も文字として表示）
      $('#f-worry').textContent = s.worry;
      $('#f-content').textContent = s.content;
      $('#f-action').textContent = s.action;
      $('#f-result').textContent = s.result;

      $('#save-btn').addEventListener('click', function () {
        var list = store.get('gh_saved', []);
        var i = list.indexOf(s.id);
        if (i === -1) list.push(s.id); else list.splice(i, 1);
        store.set('gh_saved', list);
        this.setAttribute('aria-pressed', String(i === -1));
        this.querySelector('span').textContent = i === -1 ? '保存済み' : '保存する';
      });
      // コメント（試作：このブラウザにだけ保存）
      var all = (s.comments || []).concat(store.get('gh_comments', {})[s.id] || []);
      $all('#comment-list .comment .text').forEach(function (p, i) { p.textContent = all[i].text; });
      $('#comment-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var ta = $('#comment');
        var text = ta.value.trim();
        if (!text) { ta.focus(); return; }
        var c = { who: (ROLE_LABEL[member.role] || '会員さん') + '（匿名）', text: text, at: Date.now() };
        var map = store.get('gh_comments', {});
        (map[s.id] = map[s.id] || []).push(c);
        store.set('gh_comments', map);
        var div = document.createElement('div');
        div.className = 'comment card';
        div.innerHTML = '<span class="who">' + esc(c.who) + '・きょう</span><p class="text"></p>';
        div.querySelector('.text').textContent = c.text;
        $('#comment-list').appendChild(div);
        $('#c-count').textContent = $all('#comment-list .comment').length;
        ta.value = '';
      });
      $all('.word-link[data-word]').forEach(function (l) {
        l.addEventListener('click', function () { session.set('gh_q', l.getAttribute('data-word')); });
      });
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', draw);
    draw();
  };

  renderChrome();
  if (page === 'search') {
    var q = session.get('gh_q');
    if (q) { session.del('gh_q'); var qi = $('#q'); if (qi) qi.value = q; }
  }
  if (pages[page]) pages[page]();
  if (page === 'search') {
    var qi2 = $('#q');
    if (qi2 && qi2.value) qi2.dispatchEvent(new Event('input'));
  }
})();
