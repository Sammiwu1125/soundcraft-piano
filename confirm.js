// 改期頁：只有在談定的時間需要更動時，我們才把這個連結寄給客戶。
// 地址、電話、琴況等資料在預約表單就收齊了，這裡只處理日期與時段。
//
// 資料來自網址參數，由 booking.js 產生連結時帶上。連結上只放改期用得到的
// 欄位（編號、姓名、服務項目、原本的日期時段），電話與地址不放上去。
//
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
  var btnLabel = btn ? btn.textContent : 'Confirm the new time';

  var q = new URLSearchParams(location.search);
  var get = function (k) { return (q.get(k) || '').trim(); };

  var ref = get('ref');
  var name = get('n');
  var service = get('s');
  var dateRaw = get('d');
  var slot = get('t');
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
  // 原本約的時間一定要看得到。客戶若不知道自己原本約了什麼，
  // 就會隨便挑一個送出，雙方對不起來。
  addRow('DATE', formatDate(dateRaw));
  addRow('TIME', slot);

  function isSunday(v) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    return !!p && new Date(+p[1], +p[2] - 1, +p[3]).getDay() === 0;
  }
  function showDateError(on) {
    if (dateError) dateError.style.display = on ? 'flex' : 'none';
    if (dateEl) dateEl.style.borderColor = on ? '#F2740B' : '#D5E1EC';
  }

  // 目前選的時間跟原本預約的一樣時提醒一句 —— 這頁的用意就是改時間，
  // 沒改就送出多半是誤會了這頁在做什麼。
  var changedBox = document.getElementById('cf-date-changed');
  function currentSlot() {
    var picked = form.querySelector('.slot input:checked');
    return picked ? picked.value : '';
  }
  function showChanged() {
    if (!changedBox) return;
    var own = document.getElementById('cf-time-own');
    var differs = (dateRaw && dateEl && dateEl.value && dateEl.value !== dateRaw) ||
                  (slot && currentSlot() && currentSlot() !== slot) ||
                  !!(own && own.value.trim() && own.value.trim() !== slot);
    changedBox.style.display = differs ? 'flex' : 'none';
  }

  // 已談定或休假的時段不再開放選擇（同預約頁）
  function applyAvailability() {
    if (!window.SCApplyAvailability) return;
    window.SCApplyAvailability(form, dateEl ? dateEl.value : '', function (state) {
      var box = document.getElementById('date-full');
      if (box) box.style.display = state.fullyBooked ? 'flex' : 'none';
    });
  }

  if (dateEl) {
    var today = new Date();
    dateEl.min = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    // 原本的日期若已經過去就不帶入，讓客戶自己重選 ——
    // 但一定要說明原因，否則客戶只看到一個空欄位，不知道原本約的是哪天
    if (dateRaw && dateRaw >= dateEl.min) {
      dateEl.value = dateRaw;
    } else if (dateRaw) {
      var pastBox = document.getElementById('cf-date-past');
      if (pastBox) pastBox.style.display = 'flex';
    }
    dateEl.addEventListener('change', function () {
      showDateError(isSunday(dateEl.value));
      showChanged();
      applyAvailability();
    });
  }
  if (slot) {
    var match = form.querySelector('.slot input[value="' + slot.replace(/"/g, '') + '"]');
    if (match) match.checked = true;
  }
  Array.prototype.forEach.call(form.querySelectorAll('.slot input'), function (input) {
    input.addEventListener('change', showChanged);
  });

  // 連結上帶來的時段可能已經被封鎖，載入時就要先套用一次
  applyAvailability();

  // 三個時段裡的第一個帶著 required，用來強制至少選一個。
  // 但客戶如果自己寫了時間，就不該再被擋住 —— 兩者擇一即可。
  var ownEl = document.getElementById('cf-time-own');
  if (ownEl) {
    ownEl.addEventListener('input', function () {
      var typed = ownEl.value.trim() !== '';
      Array.prototype.forEach.call(form.querySelectorAll('.slot input'), function (input) {
        if (input.hasAttribute('required') || input.dataset.wasRequired) {
          input.dataset.wasRequired = '1';
          input.required = !typed;
        }
      });
      showChanged();
    });
  }

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
    // 三個時段不見得夠用，客戶自己寫的優先
    var newTime = g('preferredOwn') || g('preferred');

    var payload = new FormData();
    payload.append('_subject', 'Time changed — ' + ref + ' — ' + name);
    payload.append('Reference', ref);
    payload.append('Name', name);
    if (service) payload.append('Service', service);
    payload.append('New date', formatDate(g('preferredDate')));
    payload.append('New time', newTime);
    if (g('preferredOwn') && g('preferred')) payload.append('Also ticked', g('preferred'));
    payload.append('Was', [formatDate(dateRaw), slot].filter(Boolean).join(', '));
    if (f.get('_gotcha')) payload.append('_gotcha', f.get('_gotcha'));

    // 同步改期結果。同一個 ref 的資料會被合併，這一筆只帶新的日期與時段，
    // 地址等欄位留空，合併時就不會蓋掉預約時就收好的內容。
    if (window.SCBookingSync) {
      window.SCBookingSync({
        ref: ref,
        stage: 'rescheduled',
        name: name,
        service: service,
        preferred_date: g('preferredDate'),
        preferred_time: newTime
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
      // 送不出去就要說實話，不能讓客戶以為新的時間已經送到了
      restore();
      errorBox.style.display = 'flex';
      errorBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  });
})();
