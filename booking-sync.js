// 把預約同步一份到 Supabase，讓工單系統看得到，服務當天不必重打一次客戶資料。
//
// 這是「附加」動作，不是主要管道：通知信仍然由 Formspree 負責。
// 所以這裡失敗一定要安靜地失敗 —— 客戶按下送出，看到的結果只能取決於
// Formspree 有沒有收到，絕不能因為資料庫連不上就讓客戶以為預約沒成功。
//
// 權限：預約頁是公開的，資料庫只開放 anon「寫入」，沒有讀取權限。
// 所以請求不能要求回傳內容（return=minimal），否則會被 RLS 擋下來。
(function () {
  'use strict';

  var CFG = window.SC_CONFIG || {};
  var URL_BASE = (CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  var KEY = CFG.SUPABASE_ANON_KEY || '';

  // 空字串送進 date 欄位會被 Postgres 拒絕，要送 null
  function clean(row) {
    var out = {};
    Object.keys(row).forEach(function (k) {
      var v = row[k];
      if (v === undefined || v === '') { out[k] = null; return; }
      out[k] = typeof v === 'string' ? v.trim() : v;
    });
    return out;
  }

  // ── 已封鎖的時段 ────────────────────────────────────────────
  // 談定的時段不該再讓別人選。但預約頁是公開的，bookings 未登入讀不到
  // （裡面有客戶的姓名地址），所以另外用一張只有日期與時段、
  // 沒有任何個人資料的表，公開可讀。
  //
  // slot 為 null 代表整天不開放（休假、已排滿）。
  // 不做長期快取。客戶可能把表單開著很久，期間我們才把某個時段封起來 ——
  // 快取住就會讓他選到已經沒空的時段。只去重「同時進行中」的請求。
  var inFlight = null;

  function loadBlocked() {
    if (!URL_BASE || !KEY) return Promise.resolve({});
    if (inFlight) return inFlight;
    var today = new Date();
    var from = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    inFlight = fetch(URL_BASE + '/rest/v1/blocked_slots?select=blocked_date,slot' +
      '&blocked_date=gte.' + from + '&limit=1000', { headers: { 'apikey': KEY } })
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (rows) {
        var map = {};
        (rows || []).forEach(function (r) {
          var d = (r.blocked_date || '').slice(0, 10);
          if (!d) return;
          if (!map[d]) map[d] = { all: false, slots: {} };
          if (!r.slot) map[d].all = true;
          else map[d].slots[r.slot] = true;
        });
        return map;
      }, function () {
        // 讀不到就當作全部開放。寧可讓客戶送出一個要改的時間，
        // 也不要因為連線問題讓整張表單不能用。
        return {};
      })
      .then(function (map) { inFlight = null; return map; });
    return inFlight;
  }

  // 把某一天已封鎖的時段停用。回傳該天是否整天都不開放。
  window.SCApplyAvailability = function (form, dateValue, onDone) {
    var radios = form.querySelectorAll('.slot input');
    loadBlocked().then(function (map) {
      var day = map[(dateValue || '').slice(0, 10)] || { all: false, slots: {} };
      var anyLeft = false;
      Array.prototype.forEach.call(radios, function (input) {
        var off = !dateValue ? false : (day.all || !!day.slots[input.value]);
        input.disabled = off;
        // 已經選到被封鎖的那格就取消，不能讓它帶著送出去
        if (off && input.checked) input.checked = false;
        input.closest('.slot').classList.toggle('slot--off', off);
        if (!off) anyLeft = true;
      });
      if (onDone) onDone({ fullyBooked: !!dateValue && !anyLeft });
    });
  };

  window.SCBookingSync = function (row) {
    if (!URL_BASE || !KEY) return Promise.resolve(false);
    return fetch(URL_BASE + '/rest/v1/bookings', {
      method: 'POST',
      headers: {
        'apikey': KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify([clean(row)])
    }).then(function (res) { return res.ok; }, function () { return false; });
  };
})();
