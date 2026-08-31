// 二手鋼琴照片輪播：手機可直接左右滑動，桌機用箭頭 / 圓點 / 方向鍵。
(function () {
  'use strict';

  // 照片檔案還沒放進資料夾時，顯示斜線底的 PHOTO PENDING 佔位。
  function markMissing(img) {
    var slide = img.parentElement;
    if (slide) slide.classList.add('gal-slide--missing');
    img.remove();
  }
  document.querySelectorAll('.gal-slide img').forEach(function (img) {
    img.addEventListener('error', function () { markMissing(img); });
    // 腳本執行前就載入失敗的圖，error 事件已經錯過，這裡補判一次
    if (img.complete && img.naturalWidth === 0) markMissing(img);
  });

  document.querySelectorAll('[data-gal]').forEach(function (gal) {
    var track = gal.querySelector('.gal-track');
    var slides = track ? track.querySelectorAll('.gal-slide') : [];
    var prev = gal.querySelector('.gal-prev');
    var next = gal.querySelector('.gal-next');
    var dots = gal.querySelector('.gal-dots');
    var current = gal.querySelector('[data-gal-current]');
    var total = gal.querySelector('[data-gal-total]');
    var index = 0;

    if (!track || slides.length < 2) {
      [prev, next, dots, gal.querySelector('.gal-count')].forEach(function (el) {
        if (el) el.style.display = 'none';
      });
      return;
    }

    if (total) total.textContent = slides.length;

    // 圓點
    var dotButtons = [];
    if (dots) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'gal-dot';
        dot.setAttribute('aria-label', 'Photo ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); });
        dots.appendChild(dot);
        dotButtons.push(dot);
      });
    }

    function goTo(i) {
      index = Math.max(0, Math.min(i, slides.length - 1));
      track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' });
      render();
    }

    function render() {
      if (current) current.textContent = index + 1;
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === slides.length - 1;
      dotButtons.forEach(function (dot, i) {
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    if (prev) prev.addEventListener('click', function () { goTo(index - 1); });
    if (next) next.addEventListener('click', function () { goTo(index + 1); });

    // 使用者用手指滑動時，同步更新圓點與計數
    var settle;
    track.addEventListener('scroll', function () {
      clearTimeout(settle);
      settle = setTimeout(function () {
        var w = track.clientWidth;
        if (!w) return;
        index = Math.round(track.scrollLeft / w);
        render();
      }, 90);
    }, { passive: true });

    gal.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    });

    render();
  });
})();
