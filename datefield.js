// 日期欄位的提示文字。
//
// <input type="date"> 不支援 placeholder，空白時顯示什麼完全由瀏覽器決定 ——
// Chrome 畫「年/月/日」，有些手機瀏覽器什麼都不畫。表單上其他每一個欄位
// 都有我們自己寫的提示，只有日期欄位得看瀏覽器臉色，客戶因此看不出那格要填什麼。
//
// 做法：平常維持 text，所以 placeholder 一定會出現；一被點到就換成 date，
// 叫出原生日曆；離開時若還是空的就換回 text，提示文字再度出現。
// 選好日期後維持 date，顯示的就是瀏覽器格式化後的日期。
(function () {
  'use strict';

  var ISO = /^\d{4}-\d{2}-\d{2}$/;

  Array.prototype.forEach.call(
    document.querySelectorAll('input[data-datefield]'),
    function (el) {
      function toDate() {
        if (el.type === 'date') return;
        el.type = 'date';
        el.removeAttribute('inputmode');   // 換成 date 之後要讓原生介面正常運作
      }

      // 確認頁會從網址帶入日期。已經有值就直接用 date 型別，
      // 否則會顯示 2026-11-04 這種原始格式，而不是瀏覽器格式化後的日期。
      // （這支程式要排在 booking.js / confirm.js 之後載入，才看得到帶入的值。）
      if (ISO.test(el.value)) toDate();

      // 在 pointerdown 就換好型別，不能等 focus ——
      // 在 focus 裡改 type，Chrome 會送出一個假的 blur，
      // 下面的 blur 處理會立刻把它還原，結果日曆永遠打不開。
      el.addEventListener('pointerdown', toDate);

      // 用鍵盤 Tab 進來時沒有 pointerdown，補在這裡；
      // 換完型別要重新聚焦，否則那個假 blur 會把它退回去。
      el.addEventListener('focus', function () {
        if (el.type !== 'date') { toDate(); el.focus(); }
      });

      // 掛 pointerup 而不是 click：pointerdown 改過 type 之後，
      // 瀏覽器重建了這個欄位的內部結構，click 不會再派送到它身上。
      // showPicker 需要使用者手勢，不支援或被拒絕都不影響，
      // 使用者仍可點日曆圖示或直接輸入。
      el.addEventListener('pointerup', function () {
        toDate();
        if (typeof el.showPicker === 'function') {
          try { el.showPicker(); } catch (e) {}
        }
      });

      el.addEventListener('blur', function () {
        // 延後判斷：型別切換造成的假 blur 要忽略，只有真的離開才還原
        setTimeout(function () {
          if (document.activeElement === el) return;
          // 萬一型別切換失敗而被打進無效內容，不要讓它流到送出的資料裡
          if (!ISO.test(el.value)) {
            el.value = '';
            el.type = 'text';
            el.setAttribute('inputmode', 'none');
          }
        }, 0);
      });
    }
  );
})();
