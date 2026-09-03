// 第二階段：客戶從我們的回信點進來，看到自己先前填的內容，只需要補地址。
// 資料來自網址參數，由 booking.js 產生連結時帶上。
// 立即執行：摘要那幾列必須在 i18n.js 掃描文字節點之前就建好，
// 否則中文模式下標籤會漏翻（i18n.js 是立即執行，不等 DOMContentLoaded）。
(function () {
  var FORM_ENDPOINT = 'https://formspree.io/f/mbgjdgrp';

  var view = document.getElementById('confirm-view');
  var missing = document.getElementById('confirm-missing');
  var done = document.getElementById('confirm-done');
  var form = document.getElementById('confirm-form');
  var summary = document.getElementById('summary');
  var btn = document.getElementById('cf-btn');
  var errorBox = document.getElementById('cf-error');
  var btnLabel = btn ? btn.textContent : 'Confirm the address';

  var q = new URLSearchParams(location.search);
  var get = function (k) { return (q.get(k) || '').trim(); };

  var ref = get('ref');
  var name = get('n');
  var service = get('s');
  var city = get('c');
  var dateRaw = get('d');
  var slot = get('t');
  var cityEl = document.getElementById('cf-city');
  var dateEl = document.getElementById('cf-date');
  var dateError = document.getElementById('cf-date-error');

  // 連結不完整就不要讓客戶白填一遍，直接請他改用回信裡的連結或打電話
  if (!ref || !name) {
    missing.style.display = 'block';
    return;
  }

  // 'YYYY-MM-DD' 要以當地時間解析，交給 new Date() 會被當成 UTC 而差一天
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function formatDate(v) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    if (!p) return '';
    var d = new Date(+p[1], +p[2] - 1, +p[3]);
    return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  // 摘要用 textContent 寫入，網址參數是外部輸入，絕不可當成 HTML 解析
  function addRow(label, value) {
    if (!value) return;
    var row = document.createElement('div');
    row.style.cssText = 'display: flex; gap: 14px; font-size: 15px; line-height: 1.5';
    var k = document.createElement('span');
    k.style.cssText = "flex: 0 0 108px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #7B848F; letter-spacing: .06em; padding-top: 2px";
    k.textContent = label;
    var v = document.createElement('span');
    v.style.cssText = 'color: #111418; font-weight: 500';
    v.textContent = value;
    row.appendChild(k);
    row.appendChild(v);
    summary.appendChild(row);
  }

  addRow('REF', ref);
  addRow('NAME', name);
  addRow('SERVICE', service);
  // 原本約的日期與時間一定要看得到。下面的欄位可能因為日期過期而空白，
  // 客戶若不知道自己原本約了什麼，就會隨便挑一個送出，雙方對不起來。
  addRow('DATE', formatDate(dateRaw));
  addRow('TIME', slot);

  // 城市預設帶入原本詢問時選的那個，客戶仍可改（地址可能不在同一市）
  if (cityEl && city) cityEl.value = city;

  // 日期與時段同樣是預設帶入、可修改。連結上的時間有可能是談定前的舊時間，
  // 讓客戶在這裡親自確認一次，收到的第二封信才會是雙方最後講定的版本。
  function isSunday(v) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    return !!p && new Date(+p[1], +p[2] - 1, +p[3]).getDay() === 0;
  }
  function showDateError(on) {
    if (dateError) dateError.style.display = on ? 'flex' : 'none';
    if (dateEl) dateEl.style.borderColor = on ? '#F2740B' : '#D5E1EC';
  }
  // 目前選的時間跟原本預約的不一樣時提醒一句。改時間是允許的
  // （雙方可能已經另外談好），但不能讓客戶自己改到了卻沒發現。
  var changedBox = document.getElementById('cf-date-changed');
  function currentSlot() {
    var picked = form.querySelector('.slot input:checked');
    return picked ? picked.value : '';
  }
  function showChanged() {
    if (!changedBox) return;
    var differs = (dateRaw && dateEl && dateEl.value && dateEl.value !== dateRaw) ||
                  (slot && currentSlot() && currentSlot() !== slot);
    changedBox.style.display = differs ? 'flex' : 'none';
  }

  if (dateEl) {
    var today = new Date();
    dateEl.min = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    // 連結上的日期若已經過去，就不要帶入，讓客戶自己重選 ——
    // 但一定要說明原因，否則客戶只看到一個空欄位，不會知道原本約的是哪天
    if (dateRaw && dateRaw >= dateEl.min) {
      dateEl.value = dateRaw;
    } else if (dateRaw) {
      var pastBox = document.getElementById('cf-date-past');
      if (pastBox) pastBox.style.display = 'flex';
    }
    dateEl.addEventListener('change', function () {
      showDateError(isSunday(dateEl.value));
      showChanged();
    });
  }
  if (slot) {
    var match = form.querySelector('.slot input[value="' + slot.replace(/"/g, '') + '"]');
    if (match) match.checked = true;
  }
  Array.prototype.forEach.call(form.querySelectorAll('.slot input'), function (input) {
    input.addEventListener('change', showChanged);
  });

  view.style.display = 'block';

  function sendingLabel() {
    return document.documentElement.lang === 'zh-Hant' ? '送出中…' : 'Sending…';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form);
    var g = function (k) { return (f.get(k) || '').toString().trim(); };

    // 週日不營業，送出前擋下
    if (isSunday(g('preferredDate'))) {
      showDateError(true);
      if (dateEl) { dateEl.focus(); dateEl.scrollIntoView({ block: 'center' }); }
      return;
    }
    showDateError(false);

    var chosenCity = g('city');
    var address = g('street') + (g('unit') ? ', ' + g('unit') : '') +
      (chosenCity ? ', ' + chosenCity : '') + ', BC';

    var payload = new FormData();
    payload.append('_subject', 'Address confirmed — ' + ref + ' — ' + name);
    payload.append('Reference', ref);
    payload.append('Name', name);
    if (get('p')) payload.append('Phone', get('p'));
    if (get('e')) { payload.append('Email', get('e')); payload.append('_replyto', get('e')); }
    if (service) payload.append('Service', service);
    // 以表單上的值為準，不是連結上的舊值
    payload.append('Confirmed date', formatDate(g('preferredDate')));
    payload.append('Confirmed time', g('preferred'));
    // 客戶把時間改掉時，信裡要主動講。否則要自己把兩封信擺在一起比對才看得出來，
    // 一漏看就會照舊時間出勤。
    if ((dateRaw && g('preferredDate') !== dateRaw) || (slot && g('preferred') !== slot)) {
      payload.append('Changed by the customer — originally asked for',
        [formatDate(dateRaw), slot].filter(Boolean).join(', '));
    }
    payload.append('City', chosenCity);
    payload.append('Address', address);
    if (g('access')) payload.append('Access notes', g('access'));
    if (f.get('_gotcha')) payload.append('_gotcha', f.get('_gotcha'));

    // 同步第二階段的結果。這一筆帶著確認後的地址與雙方談定的時間，
    // 工單系統會把同一個 ref 的兩筆合併起來看。
    if (window.SCBookingSync) {
      window.SCBookingSync({
        ref: ref,
        stage: 'confirmed',
        name: name,
        phone: get('p'),
        email: get('e'),
        service: service,
        city: chosenCity,
        brand: get('b'),
        piano_type: get('pt'),
        last_tuned: get('lt'),
        preferred_date: g('preferredDate'),
        preferred_time: g('preferred'),
        street: g('street'),
        unit: g('unit'),
        address: address,
        access_notes: g('access')
      });
    }

    errorBox.style.display = 'none';
    btn.disabled = true;
    btn.style.opacity = '.6';
    btn.style.cursor = 'default';
    btn.textContent = sendingLabel();
    var restore = function () {
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = 'pointer';
      btn.textContent = btnLabel;
    };

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      body: payload,
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      restore();
      view.style.display = 'none';
      done.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }).catch(function () {
      // 送不出去就要說實話，不能讓客戶以為地址已經給了
      restore();
      errorBox.style.display = 'flex';
      errorBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  });
})();
