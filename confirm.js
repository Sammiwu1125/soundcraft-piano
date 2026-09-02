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
  addRow('CITY', city);
  addRow('DATE', formatDate(dateRaw));
  addRow('TIME', slot);

  view.style.display = 'block';

  function sendingLabel() {
    return document.documentElement.lang === 'zh-Hant' ? '送出中…' : 'Sending…';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form);
    var g = function (k) { return (f.get(k) || '').toString().trim(); };

    var address = g('street') + (g('unit') ? ', ' + g('unit') : '') +
      (city ? ', ' + city : '') + (g('postal') ? '  ' + g('postal') : '');

    var payload = new FormData();
    payload.append('_subject', 'Address confirmed — ' + ref + ' — ' + name);
    payload.append('Reference', ref);
    payload.append('Name', name);
    if (get('p')) payload.append('Phone', get('p'));
    if (get('e')) { payload.append('Email', get('e')); payload.append('_replyto', get('e')); }
    if (service) payload.append('Service', service);
    if (dateRaw) payload.append('Preferred date', formatDate(dateRaw));
    if (slot) payload.append('Preferred time', slot);
    payload.append('Address', address);
    if (g('access')) payload.append('Access notes', g('access'));
    if (f.get('_gotcha')) payload.append('_gotcha', f.get('_gotcha'));

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
