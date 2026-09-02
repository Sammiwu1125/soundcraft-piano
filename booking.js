document.addEventListener('DOMContentLoaded', function () {
  var FORM_ENDPOINT = "https://formspree.io/f/mbgjdgrp";

  var form = document.getElementById('booking-form');
  var formView = document.getElementById('form-view');
  var successView = document.getElementById('success-view');
  var resetBtn = document.getElementById('reset-btn');
  var sendBtn = document.getElementById("send-btn");
  var sendError = document.getElementById("send-error");
  var sendLabel = sendBtn ? sendBtn.textContent : "Send request";
  // 送出中的字樣要跟著網站語言走
  function sendingLabel() {
    return document.documentElement.lang === 'zh-Hant' ? '送出中…' : 'Sending…';
  }


  // ── 到府日期：不接受過去的日期，週日不營業 ──
  var dateEl = document.getElementById('bk-date');
  var dateError = document.getElementById('date-error');
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 'YYYY-MM-DD' 要當成當地日期解析。交給 new Date() 會被當成 UTC 午夜，
  // 溫哥華在 UTC-7/-8，日期會整個往前一天。
  function parseDate(v) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    return p ? new Date(+p[1], +p[2] - 1, +p[3]) : null;
  }
  function formatDate(v) {
    var d = parseDate(v);
    if (!d) return '';
    return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function isSunday(v) {
    var d = parseDate(v);
    return !!d && d.getDay() === 0;
  }
  function showDateError(on) {
    if (dateError) dateError.style.display = on ? 'flex' : 'none';
    if (dateEl) dateEl.style.borderColor = on ? '#F2740B' : '#D5E1EC';
  }

  if (dateEl) {
    var today = new Date();
    dateEl.min = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    dateEl.addEventListener('change', function () {
      showDateError(isSunday(dateEl.value));
    });
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
    var rows = [
      ['Name', g('name')],
      ['Phone', g('phone')],
      ['Email', g('email')],
      ['Service', g('service')],
      ['City', g('city')],
      ['Piano', g('pianoType')],
      ['Last tuned', g('lastTuned')],
      ['Preferred date', formatDate(g('preferredDate'))],
      ['Preferred time', g('preferred')]
    ].filter(function (r) { return r[1]; });

    var subject = 'Service request — ' + (g('service') || 'Piano service') +
      ' — ' + (g('name') || 'Website') + (g('city') ? ', ' + g('city') : '');

    // 送給 Formspree 的欄位。底線開頭的是它的指令欄位，不會出現在信件內容裡。
    // 給這筆詢問一個編號，兩封信才對得起來
    var ref = 'SC-' + Date.now().toString(36).toUpperCase().slice(-4) +
      Math.random().toString(36).slice(2, 5).toUpperCase();

    // 第二階段的專屬連結，直接放進通知信，回覆客戶時貼上即可
    var params = new URLSearchParams();
    params.set('ref', ref);
    if (g('name')) params.set('n', g('name'));
    if (g('phone')) params.set('p', g('phone'));
    if (g('email')) params.set('e', g('email'));
    if (g('service')) params.set('s', g('service'));
    if (g('city')) params.set('c', g('city'));
    if (g('preferredDate')) params.set('d', g('preferredDate'));
    if (g('preferred')) params.set('t', g('preferred'));
    var confirmUrl = location.origin +
      location.pathname.replace(/[^/]*$/, '') + 'confirm.html?' + params.toString();

    var payload = new FormData();
    payload.append('_subject', subject);
    payload.append('Reference', ref);
    rows.forEach(function (r) { payload.append(r[0], r[1]); });
    if (g('notes')) payload.append('Notes', g('notes'));
    if (g('email')) payload.append('_replyto', g('email'));
    payload.append('Address link — send this to the customer', confirmUrl);
    if (f.get('_gotcha')) payload.append('_gotcha', f.get('_gotcha'));

    sendError.style.display = 'none';
    sendBtn.disabled = true;
    sendBtn.style.opacity = '.6';
    sendBtn.style.cursor = 'default';
    var restore = function () {
      sendBtn.disabled = false;
      sendBtn.style.opacity = '';
      sendBtn.style.cursor = 'pointer';
      sendBtn.textContent = sendLabel;
    };
    sendBtn.textContent = sendingLabel();

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      body: payload,
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      restore();
      formView.style.display = 'none';
      successView.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }).catch(function () {
      // 網路不通或服務異常時據實顯示，不要假裝送出成功
      restore();
      sendError.style.display = 'flex';
      sendError.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  });

  resetBtn.addEventListener('click', function () {
    form.reset();
    showDateError(false);
    successView.style.display = 'none';
    formView.style.display = 'block';
  });
});
