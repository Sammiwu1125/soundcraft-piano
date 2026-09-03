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
