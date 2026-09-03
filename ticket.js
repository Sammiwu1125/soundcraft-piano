// 工單系統的介面。資料的讀寫全交給 ticket-store.js。
//
// 這頁跟官網不同，不吃 i18n.js。i18n.js 是在載入時掃描整頁的文字節點，
// 這裡的清單與明細列是隨時重畫的，掃過一次就對不上了。
// 所以改用 data-t="鍵" 標記，每次重畫後再套一次語言。
(function () {
  'use strict';

  var S = window.SCStore;

  // ══════════════════════════════════════════════════════════
  // 文案
  // ══════════════════════════════════════════════════════════
  var ZH = {
    pendingSuffix: '張待同步', signOut: '登出',
    setupTitle: '尚未連線',
    setupHint: '打開 ticket-config.js，把 Supabase 的專案網址與 anon key 貼進去。設定步驟寫在 SETUP-工單系統.md。',
    loginTitle: '員工登入', loginHint: '工單屬於內部資料，登入後才能新增或查詢。',
    email: '電子郵件', password: '密碼', signIn: '登入',
    listTitle: '服務工單', newTicket: '新增工單', search: '搜尋',
    searchPh: '搜尋姓名、電話、工單號、地址',
    offlineList: '目前沒有連線，顯示的是這台裝置上存過的工單，搜尋也只會找到這些。',
    exportCsv: '匯出 CSV', backToList: '← 所有工單',
    secClient: '客戶與鋼琴', secClientHint: '只有客戶姓名是必填，其餘可以之後再補。',
    ticketNo: '工單號', ticketNoPh: '例如 2026-014', serviceDate: '服務日期',
    clientName: '客戶姓名', phone: '電話', address: '地址',
    brand: '品牌／型號', brandPh: '例如 Yamaha U1', pianoType: '琴種', lastTuned: '上次調音',
    secPrep: '出勤準備', secPrepHint: '確認車上已經帶了哪些東西。',
    secInspect: '現場檢查', secInspectHint: '勾選已完成的項目，並記下這台琴值得留意的地方。',
    conditionNotes: '琴況備註',
    notesPh: '調音前的音高、卡鍵、呢氈磨損、濕度讀數……',
    secItems: '服務內容', secItemsHint: '這次沒做的項目，數量留 0 就好。',
    itemName: '項目', qty: '數量', unitPrice: '單價', lineTotal: '小計',
    addItem: '＋ 新增一列', total: '總計',
    secPayment: '付款與後續', paymentMethod: '付款方式', warranty: '保固（天）', nextTuning: '下次調音',
    secSign: '客戶簽名', secSignHint: '非必填。可請客戶用手指或觸控筆簽。',
    signHere: '請在此簽名', clearSig: '清除簽名',
    saveTicket: '儲存工單', printReceipt: '列印收據', deleteTicket: '刪除',
    editTicket: '編輯工單',
    // 動態訊息
    noTickets: '還沒有任何工單。',
    noMatch: '沒有符合的工單。',
    needName: '請先填寫客戶姓名。',
    saved: '工單已儲存。',
    savedOffline: '目前沒有連線，工單已存在這台裝置上，恢復連線後會自動送出。',
    signInFailed: '登入失敗，請確認電子郵件與密碼。',
    saveFailed: '儲存失敗：',
    confirmDelete: '確定要刪除這張工單嗎？刪除後無法復原。',
    confirmLeave: '這張工單還沒儲存，確定要離開嗎？',
    unsynced: '待同步', loading: '載入中…', signingIn: '登入中…', saving: '儲存中…',
    receiptTitle: '服務收據', receiptThanks: '感謝您選擇 Soundcraft Piano Service。',
    servicedBy: '技師', signature: '簽名',
    // 預約帶入
    bookingsTitle: '來自預約表單',
    bookingsHint: '這些預約還沒開過工單。點一下就會用客戶填的資料開一張新工單。',
    fromBooking: '預約時客戶填的',
    bkService: '服務項目', bkPreferred: '希望時段', bkNotes: '客戶備註',
    bkAccess: '進出說明', bkEmail: '電子郵件', bkAwaitingAddress: '尚未填地址',
    // 寄給客戶的動作
    sendConfirm: '寄確認信', sendReschedule: '寄改期連結',
    noEmail: '這筆預約沒有留電子郵件，請直接打電話給客戶。',
    copied: '已複製到剪貼簿，貼進信件即可。',
    copyFailed: '複製失敗，請手動選取內文複製。'
  };

  var lang = 'en';
  try { lang = localStorage.getItem('sc_ticket_lang') || 'en'; } catch (e) {}

  function T(key, en) {
    if (lang === 'zh' && ZH[key]) return ZH[key];
    return en !== undefined ? en : key;
  }
  // 選項的中英文並排在資料裡，用這個取出當前語言的那一個
  function L(o) { return lang === 'zh' ? o.zh : o.en; }

  // ══════════════════════════════════════════════════════════
  // 選項
  // key 存進資料庫，永遠是英文，換語言不會讓舊資料變成亂七八糟。
  // ══════════════════════════════════════════════════════════
  var PREP = [
    { key: 'Tuning tool kit', en: 'Tuning tool kit', zh: '調音工具箱' },
    { key: 'Spare parts', en: 'Spare parts', zh: '備用零件' },
    { key: 'Hygrometer', en: 'Hygrometer', zh: '濕度計' },
    { key: 'Quote sheet', en: 'Quote sheet', zh: '報價單' },
    { key: 'Business cards', en: 'Business cards', zh: '名片' },
    { key: 'Receipt / payment app', en: 'Receipt / payment app', zh: '收據／收款 App' }
  ];
  var INSPECT = [
    { key: 'Measured humidity', en: 'Measured humidity', zh: '已測量濕度' },
    { key: 'Photo: keyboard', en: 'Photo: keyboard', zh: '拍照：鍵盤' },
    { key: 'Photo: soundboard', en: 'Photo: soundboard', zh: '拍照：音板' },
    { key: 'Photo: interior', en: 'Photo: interior', zh: '拍照：內部' },
    { key: 'Confirmed with client', en: 'Confirmed with client', zh: '已與客戶確認' }
  ];
  // 琴種與上次調音的選項，key 一律沿用 booking.html 的值。
  // 兩邊講法必須一模一樣，預約資料才帶得進工單，統計時也才是同一個東西。
  // 改這裡的時候記得同步改 booking.html。
  var PIANO_TYPES = [
    { key: '', en: 'Not sure', zh: '不確定' },
    { key: 'Upright', en: 'Upright', zh: '直立式' },
    { key: 'Grand', en: 'Grand', zh: '平台式' },
    { key: 'Baby grand', en: 'Baby grand', zh: '小型平台式' },
    { key: 'Digital piano', en: 'Digital piano', zh: '電鋼琴' }
  ];
  var LAST_TUNED = [
    { key: '', en: 'Not sure', zh: '不確定' },
    { key: 'Within the last year', en: 'Within the last year', zh: '一年內' },
    { key: '1 – 3 years ago', en: '1 – 3 years ago', zh: '1–3 年前' },
    { key: 'More than 3 years ago', en: 'More than 3 years ago', zh: '超過 3 年' },
    { key: 'Never, or unknown', en: 'Never, or unknown', zh: '從未調過或不清楚' }
  ];
  var PAYMENTS = [
    { key: '', en: '—', zh: '—' },
    { key: 'Cash', en: 'Cash', zh: '現金' },
    { key: 'e-Transfer', en: 'e-Transfer', zh: '線上轉帳' },
    { key: 'Card', en: 'Card', zh: '刷卡' },
    { key: 'Unpaid', en: 'Not paid yet', zh: '尚未付款' }
  ];
  var DEFAULT_ITEMS = [
    { en: 'Basic tuning', zh: '基本調音', qty: 1 },
    { en: 'Deep voicing', zh: '深度調音修整', qty: 0 },
    { en: 'Parts replacement', zh: '零件更換', qty: 0 },
    { en: 'Dehumidifier rod install', zh: '除濕棒安裝', qty: 0 },
    { en: 'Travel fee', zh: '出車費', qty: 1 }
  ];

  // ══════════════════════════════════════════════════════════
  // 小工具
  // ══════════════════════════════════════════════════════════
  function $(id) { return document.getElementById(id); }
  function money(n) { return '$' + (Number(n) || 0).toFixed(2); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function note(el, on, text) {
    if (text !== undefined) el.textContent = text;
    el.classList.toggle('on', !!on);
  }
  function clearNotes() { ['form-error', 'form-warn', 'form-ok'].forEach(function (id) { note($(id), false); }); }

  // 'YYYY-MM-DD' 交給 new Date() 會被當成 UTC 午夜，溫哥華在 UTC-7/-8，
  // 顯示出來會整個差一天。要自己拆成當地日期。
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function prettyDate(v) {
    var p = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '');
    if (!p) return '';
    var d = new Date(+p[1], +p[2] - 1, +p[3]);
    if (lang === 'zh') return p[1] + '年' + (+p[2]) + '月' + (+p[3]) + '日（' + '日一二三四五六'[d.getDay()] + '）';
    return DAYS[d.getDay()] + ', ' + (+p[3]) + ' ' + MONTHS[+p[2] - 1] + ' ' + p[1];
  }

  // ══════════════════════════════════════════════════════════
  // 語言
  // ══════════════════════════════════════════════════════════
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) {
      var key = el.getAttribute('data-t');
      if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.textContent);
      el.textContent = T(key, el.getAttribute('data-en'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-t-ph]'), function (el) {
      var key = el.getAttribute('data-t-ph');
      if (!el.hasAttribute('data-en-ph')) el.setAttribute('data-en-ph', el.getAttribute('placeholder') || '');
      el.setAttribute('placeholder', T(key, el.getAttribute('data-en-ph')));
    });
    $('lang-en').style.color = lang === 'zh' ? '#8A929C' : '#111418';
    $('lang-zh').style.color = lang === 'zh' ? '#111418' : '#8A929C';
  }

  function setLang(next) {
    lang = next;
    try { localStorage.setItem('sc_ticket_lang', next); } catch (e) {}
    applyLang();
    // 選單與勾選項的文字是 JS 產生的，語言換了要重畫，但不能弄丟已填的值
    if (currentView === 'form') {
      var t = collect();
      renderFormChrome();
      fill(t);
      // applyLang 會把標題一律寫成「新增工單」，編輯中的要改回來
      $('form-title').textContent = editing ? T('editTicket', 'Edit ticket') : T('newTicket', 'New ticket');
      renderBookingInfo(formBooking);
    }
    if (currentView === 'list') { renderList(lastList, lastOffline); renderBookings(lastBookings); }
  }

  ['en', 'zh'].forEach(function (code) {
    var el = $('lang-' + code);
    el.addEventListener('click', function () { setLang(code); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLang(code); }
    });
  });

  // ══════════════════════════════════════════════════════════
  // 畫面切換
  // ══════════════════════════════════════════════════════════
  var currentView = null;
  function show(name) {
    currentView = name;
    ['setup', 'login', 'list', 'form'].forEach(function (v) {
      $('view-' + v).style.display = v === name ? 'block' : 'none';
    });
    var user = S.currentUser();
    $('who').textContent = user ? user.email : '';
    $('signout').style.display = user ? 'inline-flex' : 'none';
    window.scrollTo({ top: 0 });
  }

  function updatePending() {
    var n = S.queueCount();
    $('pending-n').textContent = n;
    $('pending').classList.toggle('on', n > 0);
  }

  // ══════════════════════════════════════════════════════════
  // 登入
  // ══════════════════════════════════════════════════════════
  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('li-btn');
    var label = btn.textContent;
    note($('li-error'), false);
    btn.disabled = true;
    btn.textContent = T('signingIn', 'Signing in…');
    S.signIn($('li-email').value.trim(), $('li-pass').value).then(function () {
      btn.disabled = false;
      btn.textContent = label;
      $('li-pass').value = '';
      go('#/list');
    }, function (err) {
      btn.disabled = false;
      btn.textContent = label;
      // 帳密錯誤跟伺服器沒回應是兩回事，據實說明才知道要不要重打密碼
      note($('li-error'), true,
        err.status === 400 ? T('signInFailed', 'Sign-in failed. Check the email and password.')
                           : (err.message || 'Sign-in failed.'));
    });
  });

  $('signout').addEventListener('click', function () {
    S.signOut().then(function () { go('#/login'); });
  });

  // ══════════════════════════════════════════════════════════
  // 清單
  // ══════════════════════════════════════════════════════════
  var lastList = [];
  var lastOffline = false;

  function loadList() {
    $('list').innerHTML = '<div class="tk-empty">' + T('loading', 'Loading…') + '</div>';
    return S.list($('q').value).then(function (res) {
      lastList = res.items;
      lastOffline = res.offline;
      renderList(res.items, res.offline);
    });
  }

  function renderList(items, offline) {
    note($('list-offline'), offline);
    var box = $('list');
    box.innerHTML = '';
    if (!items.length) {
      var empty = document.createElement('div');
      empty.className = 'tk-empty';
      empty.textContent = $('q').value.trim() ? T('noMatch', 'No matching tickets.')
                                              : T('noTickets', 'No tickets yet.');
      box.appendChild(empty);
      return;
    }
    items.forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tk-item';

      var name = document.createElement('div');
      name.className = 'tk-item-name';
      // 客戶姓名是使用者輸入，一律用 textContent，不能拼成 HTML
      name.textContent = t.clientName || '—';
      if (t.pending) {
        var flag = document.createElement('span');
        flag.className = 'tk-item-flag';
        flag.textContent = T('unsynced', 'UNSYNCED');
        name.appendChild(flag);
      }

      var meta = document.createElement('div');
      meta.className = 'tk-item-meta';
      meta.textContent = [prettyDate(t.serviceDate), t.ticketNo, t.clientPhone, t.brand]
        .filter(Boolean).join('  ·  ');

      var amt = document.createElement('div');
      amt.className = 'tk-item-amt';
      amt.textContent = money(t.total);

      btn.appendChild(name);
      btn.appendChild(amt);
      btn.appendChild(meta);
      btn.addEventListener('click', function () { go('#/t/' + t.id); });
      box.appendChild(btn);
    });
  }

  // ── 待服務的預約 ──
  // 客戶從預約表單送出的資料。開過工單的就不再出現。
  var lastBookings = [];

  function loadBookings() {
    return S.pendingBookings().then(function (items) {
      lastBookings = items;
      renderBookings(items);
    });
  }

  function renderBookings(items) {
    $('bookings-wrap').style.display = items.length ? 'block' : 'none';
    var box = $('bookings');
    box.innerHTML = '';
    items.forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tk-item tk-item--booking';

      var name = document.createElement('div');
      name.className = 'tk-item-name';
      // 客戶輸入，一律 textContent
      name.textContent = b.name || '—';
      if (!b.address) {
        var flag = document.createElement('span');
        flag.className = 'tk-item-flag';
        flag.textContent = T('bkAwaitingAddress', 'NO ADDRESS YET');
        name.appendChild(flag);
      }

      var meta = document.createElement('div');
      meta.className = 'tk-item-meta';
      meta.textContent = [prettyDate(b.preferred_date), b.service, b.phone, b.address || b.city]
        .filter(Boolean).join('  ·  ');

      var ref = document.createElement('div');
      ref.className = 'tk-item-amt';
      ref.style.cssText = 'font-family: var(--mono); font-size: 12px; color: var(--muted); font-weight: 400';
      ref.textContent = b.ref || '';

      btn.appendChild(name);
      btn.appendChild(ref);
      btn.appendChild(meta);
      btn.addEventListener('click', function () { go('#/from/' + encodeURIComponent(b.ref)); });

      // 寄信的按鈕不能放在 btn 裡面 —— 那顆整塊都是「開工單」的點擊區，
      // 巢狀的按鈕點下去會連帶觸發外層
      var actions = document.createElement('div');
      actions.className = 'tk-bk-actions';
      [[T('sendConfirm', 'Send confirmation'), 'tk-btn--ghost', confirmEmail],
       [T('sendReschedule', 'Send reschedule link'), 'tk-btn--ghost', rescheduleEmail]
      ].forEach(function (a) {
        var el = document.createElement('button');
        el.type = 'button';
        el.className = 'tk-btn ' + a[1] + ' tk-btn--sm';
        el.textContent = a[0];
        el.addEventListener('click', function () { openMail(a[2](b)); });
        actions.appendChild(el);
      });

      var wrap = document.createElement('div');
      wrap.className = 'tk-bk-row';
      wrap.appendChild(btn);
      wrap.appendChild(actions);
      box.appendChild(wrap);
    });
  }

  // ── 寄信給客戶 ──
  // 網站是純靜態的，沒有寄信的能力，所以這裡不「代寄」，而是把信寫好、
  // 開啟你的信箱，由你自己按送出。好處是信從你的信箱寄出、客戶回信也回到你這裡，
  // 而且送出前你隨時可以改內容。
  var SLOT_HOURS = {
    'Morning (10:00 - 12:00)': ['100000', '120000'],
    'Afternoon (2:00 - 4:00)': ['140000', '160000'],
    'Evening (6:00 - 8:00)': ['180000', '200000']
  };

  function calendarLink(dateISO, slotValue, title, location, details) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO || '');
    var hours = SLOT_HOURS[slotValue];
    if (!p || !hours) return '';
    var ymd = p[1] + p[2] + p[3];
    var cal = new URLSearchParams();
    cal.set('action', 'TEMPLATE');
    cal.set('text', title);
    cal.set('dates', ymd + 'T' + hours[0] + '/' + ymd + 'T' + hours[1]);
    // 時區交給 Google 用溫哥華解讀，不自己換算 UTC（換季時容易差一小時）
    cal.set('ctz', 'America/Vancouver');
    if (location) cal.set('location', location);
    if (details) cal.set('details', details);
    return 'https://calendar.google.com/calendar/render?' + cal.toString();
  }

  function confirmEmail(b) {
    var when = [prettyDate(b.preferred_date), b.preferred_time].filter(Boolean).join(' · ');
    var cal = calendarLink(b.preferred_date, b.preferred_time,
      (b.service || 'Piano service') + ' — Soundcraft Piano Service', b.address,
      'Ref: ' + (b.ref || ''));

    // 用不到的行放 null，空字串是刻意留的段落空行 —— 兩者要分清楚，
    // 否則整封信會擠成一團
    var body = [
      'Hi ' + (b.name || '') + ',',
      '',
      'Your visit is confirmed. Here are the details:',
      '',
      '  Service:  ' + (b.service || ''),
      '  Date:     ' + prettyDate(b.preferred_date),
      '  Time:     ' + (b.preferred_time || ''),
      '  Address:  ' + (b.address || ''),
      (b.brand || b.piano_type) ? '  Piano:    ' + [b.brand, b.piano_type].filter(Boolean).join(', ') : null,
      '  Ref:      ' + (b.ref || ''),
      '',
      cal ? 'Add it to your calendar:' : null,
      cal ? cal : null,
      cal ? '' : null,
      'We will call or text if anything changes on our side. If you need a',
      'different time, just reply to this email or call us at (236) 622-5636.',
      '',
      'Thank you,',
      'Soundcraft Piano Service',
      '(236) 622-5636 · soundcraftpianoservice.ca'
    ].filter(function (l) { return l !== null; }).join('\n');

    return {
      to: b.email || '',
      subject: 'Your piano service is confirmed — ' + when,
      body: body
    };
  }

  function rescheduleEmail(b) {
    var params = new URLSearchParams();
    params.set('ref', b.ref || '');
    if (b.name) params.set('n', b.name);
    if (b.service) params.set('s', b.service);
    if (b.preferred_date) params.set('d', b.preferred_date);
    if (b.preferred_time) params.set('t', b.preferred_time);
    var link = location.origin + location.pathname.replace(/[^/]*$/, '') +
      'confirm.html?' + params.toString();

    return {
      to: b.email || '',
      subject: 'Choosing a new time — ' + (b.ref || ''),
      body: [
        'Hi ' + (b.name || '') + ',',
        '',
        'Thank you for your request. The time you asked for is not available,',
        'so could you pick another one here?',
        '',
        link,
        '',
        'Everything else you filled in is already saved — you only need to',
        'choose a new date and time.',
        '',
        'Thank you,',
        'Soundcraft Piano Service',
        '(236) 622-5636 · soundcraftpianoservice.ca'
      ].join('\n')
    };
  }

  // 開啟寫信畫面。桌機與手機要走不同的路：
  //
  // 桌機：直接開 Gmail 網頁版的撰寫視窗。mailto: 在桌機會叫出系統預設的
  //       信件程式，而那個程式不一定設定過。
  // 手機：一律用 mailto:。手機上用 window.open 開 Gmail 網頁版不可靠 ——
  //       會被彈窗阻擋，或被導到不吃 compose 參數的行動版介面。
  //       mailto: 則是交給作業系統挑，手機上裝了哪個信件 App 就開哪個。
  function isHandheld() {
    return window.matchMedia('(pointer: coarse)').matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function mailtoUrl(mail) {
    return 'mailto:' + encodeURIComponent(mail.to) +
      '?subject=' + encodeURIComponent(mail.subject) +
      '&body=' + encodeURIComponent(mail.body);
  }

  function openMail(mail) {
    if (!mail.to) { alert(T('noEmail', 'This booking has no email address — please phone the customer instead.')); return; }

    if (isHandheld()) { location.href = mailtoUrl(mail); return; }

    var u = new URLSearchParams();
    u.set('view', 'cm');
    u.set('fs', '1');
    u.set('to', mail.to);
    u.set('su', mail.subject);
    u.set('body', mail.body);
    var win = window.open('https://mail.google.com/mail/?' + u.toString(), '_blank', 'noopener');
    // 桌機的彈窗阻擋擋下來時退回 mailto:，總比什麼都沒發生好
    if (!win) location.href = mailtoUrl(mail);
  }

  // 把一筆預約轉成預先填好的工單
  function ticketFromBooking(b) {
    var t = blankTicket();
    t.bookingRef = b.ref || '';
    t.ticketNo = b.ref || '';
    t.clientName = b.name || '';
    t.clientPhone = b.phone || '';
    t.address = b.address || (b.city ? b.city + ', BC' : '');
    t.brand = b.brand || '';
    t.pianoType = b.piano_type || '';
    t.lastTuned = b.last_tuned || '';
    if (b.preferred_date) t.serviceDate = b.preferred_date;

    // 客戶自己寫的話與進出說明要留在工單上，不能只顯示在畫面上 ——
    // 存檔之後技師到現場還要看得到
    var lines = [];
    if (b.notes) lines.push('[' + T('bkNotes', 'Booking notes') + '] ' + b.notes);
    if (b.access_notes) lines.push('[' + T('bkAccess', 'Access') + '] ' + b.access_notes);
    t.conditionNotes = lines.join('\n');
    return t;
  }

  function renderBookingInfo(b) {
    var wrap = $('booking-info');
    var rows = $('booking-info-rows');
    rows.innerHTML = '';
    if (!b) { wrap.style.display = 'none'; return; }

    [[T('bkService', 'Service'), b.service],
     [T('bkPreferred', 'Preferred'), [prettyDate(b.preferred_date), b.preferred_time].filter(Boolean).join(', ')],
     [T('bkEmail', 'Email'), b.email]].forEach(function (r) {
      if (!r[1]) return;
      var line = document.createElement('div');
      line.style.cssText = 'display: flex; gap: 14px; padding: 3px 0; font-size: 14.5px';
      var k = document.createElement('span');
      k.style.cssText = "flex: 0 0 110px; font-family: var(--mono); font-size: 11px; letter-spacing: .06em; color: var(--muted); padding-top: 3px";
      k.textContent = r[0];
      var v = document.createElement('span');
      v.textContent = r[1];
      line.appendChild(k);
      line.appendChild(v);
      rows.appendChild(line);
    });
    wrap.style.display = rows.children.length ? 'block' : 'none';
  }

  $('q-btn').addEventListener('click', loadList);
  $('q').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); loadList(); }
  });
  $('new-btn').addEventListener('click', function () { go('#/new'); });

  // ── 匯出 CSV ──
  function csvCell(v) {
    var s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  $('export-btn').addEventListener('click', function () {
    var cols = ['ticketNo', 'serviceDate', 'clientName', 'clientPhone', 'address', 'brand',
                'pianoType', 'lastTuned', 'conditionNotes', 'total', 'paymentMethod',
                'warrantyDays', 'nextTuning'];
    var lines = [cols.concat(['items']).join(',')];
    lastList.forEach(function (t) {
      var cells = cols.map(function (c) { return csvCell(t[c]); });
      // 明細是巢狀的，壓成一格文字，一張工單就是一列，Excel 才好用
      cells.push(csvCell((t.items || []).map(function (it) {
        return it.name + ' ×' + (Number(it.qty) || 0) + ' @ ' + money(it.price);
      }).join('; ')));
      lines.push(cells.join(','));
    });
    // BOM：Excel 沒有它會把中文讀成亂碼
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'soundcraft-tickets-' + todayISO() + '.csv';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  });

  // ══════════════════════════════════════════════════════════
  // 表單
  // ══════════════════════════════════════════════════════════
  var editing = null;          // 正在編輯的工單 id，新單為 null
  var formBookingRef = null;   // 這張工單來自哪一筆預約，用來把該預約從待辦清單移除
  var formBooking = null;      // 該筆預約的原始內容，只用來顯示「預約時客戶填的」那一區
  var dirty = false;

  function markDirty() { dirty = true; }
  $('ticket-form').addEventListener('input', markDirty);
  $('ticket-form').addEventListener('change', markDirty);

  function fillSelect(el, options, value) {
    el.innerHTML = '';
    options.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.key;
      opt.textContent = L(o);
      el.appendChild(opt);
    });
    // 選項改過版之後，舊工單可能存著現在清單裡沒有的值（例如早期的
    // 'upright'）。直接設 value 會靜靜地變成空白，把舊資料吃掉，
    // 所以先把它補成一個選項再選中。
    if (value && !options.some(function (o) { return o.key === value; })) {
      var legacy = document.createElement('option');
      legacy.value = value;
      legacy.textContent = value;
      el.appendChild(legacy);
    }
    el.value = value || '';
  }

  function renderChips(box, list) {
    box.innerHTML = '';
    list.forEach(function (o) {
      var label = document.createElement('label');
      label.className = 'tk-chip';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.value = o.key;
      var span = document.createElement('span');
      span.textContent = L(o);
      label.appendChild(input);
      label.appendChild(span);
      box.appendChild(label);
    });
  }

  // 語言相關的部分（選單、勾選項）重畫一次
  function renderFormChrome() {
    fillSelect($('f-pianoType'), PIANO_TYPES, $('f-pianoType').value);
    fillSelect($('f-lastTuned'), LAST_TUNED, $('f-lastTuned').value);
    fillSelect($('f-paymentMethod'), PAYMENTS, $('f-paymentMethod').value);
    renderChips($('prep-chips'), PREP);
    renderChips($('inspect-chips'), INSPECT);
  }

  // ── 服務項目明細 ──
  function addItemRow(item) {
    item = item || { name: '', qty: 0, price: 0 };
    var tr = document.createElement('tr');

    function cell(input, cls) {
      var td = document.createElement('td');
      if (cls) td.className = cls;
      td.appendChild(input);
      tr.appendChild(td);
      return td;
    }

    var name = document.createElement('input');
    name.type = 'text';
    name.className = 'it-name';
    name.value = item.name || '';
    cell(name);

    var qty = document.createElement('input');
    qty.type = 'number'; qty.min = '0'; qty.step = '1'; qty.inputMode = 'numeric';
    qty.className = 'num it-qty';
    qty.value = item.qty != null ? item.qty : 0;
    cell(qty, 'num');

    var price = document.createElement('input');
    price.type = 'number'; price.min = '0'; price.step = '0.01'; price.inputMode = 'decimal';
    price.className = 'num it-price';
    price.value = item.price != null ? item.price : 0;
    cell(price, 'num');

    var amount = document.createElement('td');
    amount.className = 'num it-amount';
    amount.style.cssText = 'font-variant-numeric: tabular-nums; white-space: nowrap';
    tr.appendChild(amount);

    var xTd = document.createElement('td');
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'tk-x';
    x.setAttribute('aria-label', 'Remove line');
    x.textContent = '×';
    x.addEventListener('click', function () { tr.remove(); recalc(); markDirty(); });
    xTd.appendChild(x);
    tr.appendChild(xTd);

    [qty, price].forEach(function (el) { el.addEventListener('input', recalc); });
    $('items-body').appendChild(tr);
    recalc();
    return tr;
  }

  function recalc() {
    var sum = 0;
    Array.prototype.forEach.call($('items-body').children, function (tr) {
      var qty = Number(tr.querySelector('.it-qty').value) || 0;
      var price = Number(tr.querySelector('.it-price').value) || 0;
      var line = qty * price;
      sum += line;
      tr.querySelector('.it-amount').textContent = line ? money(line) : '—';
    });
    $('total').textContent = money(sum);
    return sum;
  }

  $('add-item').addEventListener('click', function () { addItemRow(); markDirty(); });

  // ── 讀 / 寫表單 ──
  function fill(t) {
    ['ticketNo', 'serviceDate', 'clientName', 'clientPhone', 'address', 'brand',
     'conditionNotes', 'warrantyDays', 'nextTuning'].forEach(function (k) {
      $('f-' + k).value = t[k] == null ? '' : t[k];
    });
    // 一定要走 fillSelect，不能直接指定 .value ——
    // 直接指定時，若舊工單存的值已經不在選項清單裡（例如改版前的 'upright'），
    // 瀏覽器會安靜地把它變成空白，等於把資料吃掉。
    fillSelect($('f-pianoType'), PIANO_TYPES, t.pianoType);
    fillSelect($('f-lastTuned'), LAST_TUNED, t.lastTuned);
    fillSelect($('f-paymentMethod'), PAYMENTS, t.paymentMethod);

    function tick(box, chosen) {
      Array.prototype.forEach.call(box.querySelectorAll('input'), function (input) {
        input.checked = (chosen || []).indexOf(input.value) !== -1;
      });
    }
    tick($('prep-chips'), t.prepDone);
    tick($('inspect-chips'), t.inspectDone);

    $('items-body').innerHTML = '';
    (t.items && t.items.length ? t.items : []).forEach(addItemRow);
    recalc();

    setSignature(t.signature || null);
  }

  function collect() {
    var t = { id: editing || S.uuid() };
    ['ticketNo', 'serviceDate', 'clientName', 'clientPhone', 'address', 'brand',
     'conditionNotes', 'warrantyDays', 'nextTuning'].forEach(function (k) {
      t[k] = $('f-' + k).value.trim();
    });
    t.pianoType = $('f-pianoType').value;
    t.lastTuned = $('f-lastTuned').value;
    t.paymentMethod = $('f-paymentMethod').value;

    function picked(box) {
      return Array.prototype.filter.call(box.querySelectorAll('input'), function (i) { return i.checked; })
        .map(function (i) { return i.value; });
    }
    t.prepDone = picked($('prep-chips'));
    t.inspectDone = picked($('inspect-chips'));

    t.items = Array.prototype.map.call($('items-body').children, function (tr) {
      return {
        name: tr.querySelector('.it-name').value.trim(),
        qty: Number(tr.querySelector('.it-qty').value) || 0,
        price: Number(tr.querySelector('.it-price').value) || 0
      };
    }).filter(function (i) { return i.name || i.qty || i.price; });

    t.total = recalc();
    t.signature = sigData;
    t.bookingRef = formBookingRef || null;
    return t;
  }

  function blankTicket() {
    return {
      serviceDate: todayISO(),
      items: DEFAULT_ITEMS.map(function (d) { return { name: L(d), qty: d.qty, price: 0 }; })
    };
  }

  // ── 儲存 ──
  $('ticket-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearNotes();
    var t = collect();
    if (!t.clientName) {
      note($('form-error'), true, T('needName', 'Please enter the client name first.'));
      $('f-clientName').focus();
      $('f-clientName').scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    var btn = $('save-btn');
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = T('saving', 'Saving…');

    S.save(t).then(function (res) {
      btn.disabled = false;
      btn.textContent = label;
      editing = res.ticket.id;
      dirty = false;
      $('delete-btn').style.display = 'inline-flex';
      $('form-title').textContent = T('editTicket', 'Edit ticket');
      updatePending();
      if (res.synced) note($('form-ok'), true, T('saved', 'Ticket saved.'));
      else note($('form-warn'), true, T('savedOffline',
        'No connection — saved on this device and it will sync automatically once you are back online.'));
      // 網址換成這張工單，重新整理或分享連結都回得到同一張
      if (location.hash !== '#/t/' + editing) {
        history.replaceState(null, '', '#/t/' + editing);
      }
    }, function (err) {
      btn.disabled = false;
      btn.textContent = label;
      note($('form-error'), true, T('saveFailed', 'Could not save: ') + (err.message || err));
    });
  });

  // ── 刪除 ──
  $('delete-btn').addEventListener('click', function () {
    if (!editing) return;
    if (!confirm(T('confirmDelete', 'Delete this ticket? This cannot be undone.'))) return;
    S.remove(editing).then(function () {
      dirty = false;
      updatePending();
      go('#/list');
    }, function (err) {
      note($('form-error'), true, T('saveFailed', 'Could not save: ') + (err.message || err));
    });
  });

  $('back-btn').addEventListener('click', function () {
    if (dirty && !confirm(T('confirmLeave', 'This ticket has unsaved changes. Leave anyway?'))) return;
    dirty = false;
    go('#/list');
  });

  window.addEventListener('beforeunload', function (e) {
    if (currentView === 'form' && dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  // ══════════════════════════════════════════════════════════
  // 簽名板
  // ══════════════════════════════════════════════════════════
  var sigData = null;
  var canvas = $('sig');
  var ctx = canvas.getContext('2d');
  var drawing = false;

  function sizeCanvas() {
    var ratio = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    var keep = sigData;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111418';
    // 改變 canvas 尺寸會清空內容，把原本的簽名重畫回去
    if (keep) {
      var img = new Image();
      img.onload = function () { ctx.drawImage(img, 0, 0, rect.width, rect.height); };
      img.src = keep;
    }
  }

  function setSignature(data) {
    sigData = data;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    $('sig-box').classList.toggle('signed', !!data);
    if (!data) return;
    var rect = canvas.getBoundingClientRect();
    var img = new Image();
    img.onload = function () { ctx.drawImage(img, 0, 0, rect.width, rect.height); };
    img.src = data;
  }

  function point(e) {
    var rect = canvas.getBoundingClientRect();
    var src = e.touches && e.touches[0] ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }
  function start(e) {
    e.preventDefault();
    drawing = true;
    $('sig-box').classList.add('signed');
    var p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    var p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function end() {
    if (!drawing) return;
    drawing = false;
    sigData = canvas.toDataURL('image/png');
    markDirty();
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);
  window.addEventListener('resize', sizeCanvas);

  $('sig-clear').addEventListener('click', function () { setSignature(null); markDirty(); });

  // ══════════════════════════════════════════════════════════
  // 列印收據
  // ══════════════════════════════════════════════════════════
  $('print-btn').addEventListener('click', function () {
    var t = collect();
    var box = $('receipt');
    box.innerHTML = '';

    function el(tag, text, style) {
      var n = document.createElement(tag);
      if (text != null) n.textContent = text;
      if (style) n.style.cssText = style;
      return n;
    }

    var logo = new Image();
    logo.src = 'assets/logo-h-tight.png';
    logo.className = 'logo';
    logo.alt = 'Soundcraft Piano Service';
    box.appendChild(logo);

    box.appendChild(el('h1', T('receiptTitle', 'Service receipt')));
    box.appendChild(el('div', [t.ticketNo, prettyDate(t.serviceDate)].filter(Boolean).join('  ·  '),
      'color: #666; margin-bottom: 14px'));

    [[T('clientName', 'Client name'), t.clientName],
     [T('phone', 'Phone'), t.clientPhone],
     [T('address', 'Address'), t.address],
     [T('brand', 'Make / model'), t.brand]].forEach(function (r) {
      if (!r[1]) return;
      var line = el('div', null, 'display: flex; gap: 12px; padding: 2px 0');
      line.appendChild(el('span', r[0], 'width: 130px; color: #666'));
      line.appendChild(el('span', r[1]));
      box.appendChild(line);
    });

    if (t.conditionNotes) {
      box.appendChild(el('div', T('conditionNotes', 'Condition notes'),
        'margin-top: 12px; color: #666'));
      box.appendChild(el('div', t.conditionNotes, 'white-space: pre-wrap'));
    }

    var table = document.createElement('table');
    var thead = document.createElement('tr');
    [[T('itemName', 'Item'), ''], [T('qty', 'Qty'), 'num'],
     [T('unitPrice', 'Unit price'), 'num'], [T('lineTotal', 'Amount'), 'num']].forEach(function (h) {
      var th = el('th', h[0]);
      if (h[1]) th.className = h[1];
      thead.appendChild(th);
    });
    table.appendChild(thead);
    t.items.filter(function (i) { return i.qty > 0 || i.price > 0; }).forEach(function (i) {
      var tr = document.createElement('tr');
      tr.appendChild(el('td', i.name));
      var q = el('td', String(i.qty)); q.className = 'num'; tr.appendChild(q);
      var p = el('td', money(i.price)); p.className = 'num'; tr.appendChild(p);
      var a = el('td', money(i.qty * i.price)); a.className = 'num'; tr.appendChild(a);
      table.appendChild(tr);
    });
    var totalRow = document.createElement('tr');
    var spacer = el('td', T('total', 'TOTAL'));
    spacer.colSpan = 3;
    spacer.style.cssText = 'text-align: right; font-weight: 600';
    totalRow.appendChild(spacer);
    var totalVal = el('td', money(t.total));
    totalVal.className = 'num';
    totalVal.style.fontWeight = '600';
    totalRow.appendChild(totalVal);
    table.appendChild(totalRow);
    box.appendChild(table);

    var tail = [];
    if (t.paymentMethod) tail.push(T('paymentMethod', 'Paid by') + ': ' + t.paymentMethod);
    if (t.warrantyDays) tail.push(T('warranty', 'Warranty (days)') + ': ' + t.warrantyDays);
    if (t.nextTuning) tail.push(T('nextTuning', 'Next tuning due') + ': ' + prettyDate(t.nextTuning));
    if (tail.length) box.appendChild(el('div', tail.join('   ·   '), 'margin-top: 12px'));

    if (t.signature) {
      box.appendChild(el('div', T('signature', 'Signature'), 'margin-top: 18px; color: #666'));
      var sig = new Image();
      sig.src = t.signature;
      sig.style.cssText = 'height: 80px; display: block';
      box.appendChild(sig);
    }

    var user = S.currentUser();
    if (user) box.appendChild(el('div', T('servicedBy', 'Technician') + ': ' + user.email,
      'margin-top: 14px; color: #666'));
    box.appendChild(el('div', T('receiptThanks', 'Thank you for choosing Soundcraft Piano Service.'),
      'margin-top: 22px; text-align: center; color: #666'));

    // logo 還沒載完就列印會印出破圖，等它一下
    if (logo.complete) window.print();
    else { logo.onload = logo.onerror = function () { window.print(); }; }
  });

  // ══════════════════════════════════════════════════════════
  // 路由
  // ══════════════════════════════════════════════════════════
  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function openForm(ticket, isNew, booking) {
    editing = isNew ? null : ticket.id;
    formBookingRef = ticket.bookingRef || null;
    formBooking = booking || null;
    show('form');
    clearNotes();
    renderFormChrome();
    fill(ticket);
    renderBookingInfo(formBooking);
    sizeCanvas();
    dirty = false;
    $('delete-btn').style.display = isNew ? 'none' : 'inline-flex';
    $('form-title').textContent = isNew ? T('newTicket', 'New ticket') : T('editTicket', 'Edit ticket');
  }

  // 從待辦清單點進來的預約。重新整理後 lastBookings 會是空的，要能自己補抓。
  function openFromBooking(ref) {
    var found = lastBookings.filter(function (b) { return b.ref === ref; })[0];
    if (found) { openForm(ticketFromBooking(found), true, found); return; }
    show('form');
    S.pendingBookings().then(function (items) {
      lastBookings = items;
      var b = items.filter(function (x) { return x.ref === ref; })[0];
      if (!b) { go('#/list'); return; }
      openForm(ticketFromBooking(b), true, b);
    });
  }

  function route() {
    if (!S.isConfigured()) { show('setup'); return; }
    if (!S.currentUser()) { show('login'); return; }

    var hash = location.hash || '#/list';
    var ticketMatch = /^#\/t\/(.+)$/.exec(hash);
    var bookingMatch = /^#\/from\/(.+)$/.exec(hash);

    if (hash === '#/new') {
      openForm(blankTicket(), true);
    } else if (bookingMatch) {
      openFromBooking(decodeURIComponent(bookingMatch[1]));
    } else if (ticketMatch) {
      show('form');
      S.get(ticketMatch[1]).then(function (t) {
        if (!t) { go('#/list'); return; }
        openForm(t, false);
      });
    } else {
      show('list');
      loadList();
      loadBookings();
    }
    updatePending();
  }

  window.addEventListener('hashchange', route);

  // ══════════════════════════════════════════════════════════
  // 離線補送
  // ══════════════════════════════════════════════════════════
  function trySync() {
    if (!S.currentUser() || !S.queueCount()) return;
    S.flush().then(function (sent) {
      updatePending();
      if (sent && currentView === 'list') loadList();
    });
  }
  window.addEventListener('online', trySync);
  setInterval(trySync, 60000);

  // ══════════════════════════════════════════════════════════
  // 啟動
  // ══════════════════════════════════════════════════════════
  applyLang();
  route();
  trySync();
})();
