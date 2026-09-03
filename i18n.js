// 中英切換。
// 作法：不在 HTML 上標記 250 個元素，而是用字典比對整頁的文字節點。
// 要改文案只需要改下面的字典；新增頁面也不必再動標記。
// 沒有對應翻譯的字串會保持英文（品牌名、電話、價格數字等本來就不該翻）。
(function () {
  'use strict';

  var ZH = {
    // ── 導覽列 ──
    'Services': '服務項目',
    'Pianos': '二手鋼琴',
    'Rentals': '租琴',
    'About': '關於我們',
    'Book a Service': '預約服務',

    // ── 首屏 ──
    'Crafting Better Sound.': '打造更好的聲音。',
    'Caring for Every Note.': '照顧每一個音。',
    'A hand-picked selection of Yamaha and Kawai uprights and grands, serving Greater Vancouver. Every instrument is regulated and tuned in our own workshop — and we keep caring for it after it reaches your home.':
      '精選 Yamaha 與 Kawai 直立琴及平台琴，服務大溫哥華地區。每一台都在我們自己的工作室整調、調音，送到府之後也持續照顧。',
    'Book a Tuning': '預約調音',
    'View Pianos': '看看鋼琴',
    'RENTAL': '租琴',
    'From $60 / mo': '每月 $60 起',
    'RENT-TO-OWN': '先租後買',
    'Rent credited to purchase': '租金可折抵購琴款',

    // ── 二手鋼琴 ──
    'AVAILABLE NOW': '現貨供應',
    'Featured pianos': '精選鋼琴',
    'See all instruments →': '查看所有鋼琴 →',
    'Apollo A.320 Upright': 'Apollo A.320 直立鋼琴',
    'Polished ebony · Toyo Piano (TPK), Japan': '鏡面黑檀烤漆 · 日本東洋鋼琴（TPK）',
    'Steinway & Sons Upright': 'Steinway & Sons 直立鋼琴',
    'Satin wood cabinet · Matching bench included': '木質霧面外殼 · 附同款琴椅',
    'Yamaha M5J Upright': 'Yamaha M5J 直立鋼琴',
    'Walnut cabinet · Three pedals': '胡桃木外殼 · 三踏板',
    'Kawai BS-2N Upright': 'Kawai BS-2N 直立鋼琴',
    'Polished ebony · Three pedals': '鏡面黑檀烤漆 · 三踏板',
    'PRICE': '售價',
    'CAD': '加幣',
    'INCLUDED': '已包含',
    'Delivery + tuning': '運費與調音',
    'Enquire about this piano': '詢問這台鋼琴',

    // ── 為什麼選擇我們 ──
    'WHY SOUNDCRAFT': '為什麼選擇 SOUNDCRAFT',
    'Every piano we sell, we restored ourselves': '我們賣的每一台琴，都是自己整理的',
    'Nothing is listed untouched. Each instrument is cleaned, regulated, and tuned in our workshop before it goes on the floor.':
      '沒有一台是原封不動就上架。每一台都先在工作室清潔、整調、調音，才會擺出來。',
    'Transparent pricing': '價格透明',
    'You see the range before we arrive. Anything beyond a standard visit is quoted and approved before we start.':
      '我們到府之前，你就知道價格區間。超出標準服務的部分一律先報價，你同意了才動工。',
    'Prompt replies, on time visits': '回覆快，準時到',
    'Enquiries answered the same day, Monday to Saturday, 9:00 – 18:00. We arrive in the window we agreed.':
      '週一至週六 9:00 – 18:00，當天回覆。約好的時段一定準時到。',
    'Rent now, buy later': '先租，之後再買',
    'Rental payments are credited toward the purchase price if you decide to keep the instrument.':
      '如果最後決定留下這台琴，先前付的租金可以折抵購琴金額。',

    // ── 服務流程 ──
    'HOW IT WORKS': '服務流程',
    'Tell us about your piano': '告訴我們你的琴',
    'Send the make, model, and roughly when it was last tuned.':
      '提供品牌、型號，以及大概多久沒調音了。',
    'We confirm a time and a price': '我們確認時間與價格',
    'You get a clear quote and a time window before anything is booked.':
      '正式成立預約之前，你會先拿到明確的報價和到府時段。',
    'We come to you': '我們到府服務',
    'Most tunings take about 90 minutes in your home. We tell you what we found before we leave.':
      '一般調音在府上約需 90 分鐘。離開前會告訴你這台琴目前的狀況。',

    // ── 價格 ──
    'PRICING AT A GLANCE': '價格一覽',
    'Full pricing →': '完整價目 →',
    'Piano Tuning': '鋼琴調音',
    'Piano Repair': '鋼琴維修',
    'Cleaning & Maintenance': '清潔與保養',
    'Piano Moving': '鋼琴搬運',
    'Piano Rental': '鋼琴出租',
    'Quote on request': '來電報價',
    '$60 – $90 / mo': '每月 $60 – $90',
    'Moving is arranged through a partner crew we work with regularly. Tell us the instrument and the access at both ends and we will come back with a price.':
      '搬運由我們長期配合的專業團隊執行。告訴我們琴的類型，以及搬出與搬入兩端的通道狀況，我們會回覆報價。',

    // ── 評論 ──
    'GOOGLE REVIEW · ★★★★★': 'GOOGLE 評論 · ★★★★★',
    'GOOGLE REVIEW': 'GOOGLE 評論',
    // 客人的評論保留英文原文，不翻譯（翻過就不是他原本寫的字了）

    // ── 常見問題 ──
    'QUESTIONS': '常見問題',
    'Before you book': '預約前先了解',
    'How often does a piano need tuning?': '鋼琴多久需要調音一次？',
    'Once or twice a year for most homes. A piano that has just been moved, or one played daily, benefits from more frequent visits.':
      '一般家庭一年一到兩次。剛搬過家的琴，或每天彈奏的琴，建議調得勤一些。',
    'How long does a tuning take?': '調音需要多久？',
    'About 90 minutes for a standard tuning. Pianos that have not been tuned in years may need a second visit to hold pitch.':
      '標準調音約 90 分鐘。多年沒調過的琴，可能需要第二次到府，音準才穩得住。',
    'Can an old piano still be tuned?': '老鋼琴還能調音嗎？',
    'Usually, yes. We check the strings, tuning pins, and structure first, then tell you honestly whether tuning is worthwhile or whether repair should come first.':
      '大多可以。我們會先檢查琴弦、弦軸和結構，再誠實告訴你調音值不值得，或是該先做維修。',

    // ── 服務地區 ──
    'SERVICE AREA': '服務地區',
    'We come to you across Greater Vancouver': '大溫哥華地區，我們到府服務',
    'Vancouver': '溫哥華',
    'Burnaby': '本拿比',
    'Richmond': '列治文',
    'Surrey': '素里',
    'Coquitlam': '高貴林',
    'Port Coquitlam': '高貴林港',
    'New Westminster': '新西敏',
    'North Vancouver': '北溫哥華',
    'West Vancouver': '西溫哥華',
    'Delta': '三角洲',
    'Langley': '蘭里',
    'White Rock': '白石',
    'Vancouver · Burnaby · Richmond · Surrey · Coquitlam · Port Coquitlam · New Westminster · North Vancouver · West Vancouver · Delta · Langley · White Rock':
      '溫哥華 · 本拿比 · 列治文 · 素里 · 高貴林 · 高貴林港 · 新西敏 · 北溫哥華 · 西溫哥華 · 三角洲 · 蘭里 · 白石',

    // ── 頁尾 ──
    'Piano tuning, repair, sales, and rental across Greater Vancouver.':
      '大溫哥華地區的鋼琴調音、維修、買賣與出租。',
    'CONTACT': '聯絡方式',
    'Monday – Saturday': '週一至週六',
    'PAGES': '網站導覽',

    // ── 改期頁（只在需要更動時間時才寄給客戶）──
    'CHANGE YOUR TIME': '更改到府時間',
    'Need a different time?': '需要換一個時間嗎？',
    'Pick a new date and time that suits you. Everything else stays as it is.':
      '選一個你方便的日期與時段就好，其他資料都不用重填。',
    'NEW TIME RECEIVED': '已收到新的時間',
    'Thank you — we have your new time.': '謝謝你，我們已收到新的時間。',
    'We will send you a written confirmation shortly. If anything changes, call or text us at':
      '我們很快會寄一封確認信給你。如果有任何變動，請來電或傳簡訊到',
    'and we will sort the time out over the phone.': '我們會用電話跟你把時間喬好。',
    'Confirm the new time': '確認新的時間',
    'We could not send your new time just now. Please try again, or call or text us at (236) 622-5636.':
      '目前沒有辦法送出新的時間。請再試一次，或來電、傳簡訊到 (236) 622-5636。',
    'Street address': '街道地址',
    'Unit or apartment': '單位或門牌號',
    'Access notes': '進出說明',
    'YOUR REQUEST': '你的需求',
    'REF': '編號',
    'NAME': '姓名',
    'SERVICE': '服務項目',
    'DATE': '日期',
    'TIME': '時段',
    // 摘要裡的時段值（下方的按鈕是拆成「下午」與時間兩段，這裡是完整字串）
    'Morning (10:00 - 12:00)': '上午 10:00 – 12:00',
    'Afternoon (2:00 - 4:00)': '下午 2:00 – 4:00',
    'Evening (6:00 - 8:00)': '傍晚 6:00 – 8:00',
    'The date you asked for has already passed. Please choose a new date and time.':
      '你原本預約的日期已經過了，請重新選擇日期與時段。',
    'This will change the visit from the time shown above. We will send you a written confirmation once you submit.':
      '送出後，到府時間會從上方顯示的時間改成你新選的這個時間，我們會再寄一封確認信給你。',
    'CITY': '城市',
    'When we come': '到府時間',
    'We visit Monday to Saturday. Change this if the time no longer works.':
      '我們的到府服務為週一至週六。時間如果有變動，請直接在這裡修改。',
    'Nothing is charged at this step.': '這一步不會產生任何費用。',
    'Thank you — we have your address.': '謝謝你，我們已收到地址。',
    'We will confirm the visit by phone or email shortly. If anything changes, call or text us at':
      '我們很快會用電話或電子郵件跟你確認。如果有任何變動，請來電或傳簡訊到',
    'This link is missing its details.': '這個連結缺少必要的資訊。',
    'Please use the link from our reply, or call or text us at':
      '請使用我們回信裡的那條連結，或來電、傳簡訊到',
    'and we will take the address over the phone.': '我們會用電話記下你的地址。',
    'Start a new request': '重新填一份預約',
    'We could not send your address just now. Please try again, or call or text us at (236) 622-5636.':
      '目前沒有辦法送出你的地址。請再試一次，或來電、傳簡訊到 (236) 622-5636。',

    // ── 預約頁 ──
    'BOOK A SERVICE': '預約服務',
    'Tell us about your piano.': '告訴我們你的鋼琴狀況。',
    'Send us a few details and we will reply with a time and a price. No payment is taken and nothing is confirmed until you agree to both.':
      '留下幾項資訊，我們會回覆時間與價格。不需要先付款，雙方都同意之前不會成立預約。',
    'REQUEST RECEIVED': '已收到預約',
    'Thank you — we have your request.': '謝謝你，我們已收到你的預約。',
    'We will reply within one business day, Monday to Saturday, with a time window and a price for you to approve.':
      '我們會在一個工作天內回覆（週一至週六），提供到府時段與報價，等你確認。',
    'If it is urgent, call or text us at': '如果比較急，請來電或傳簡訊到',
    'We could not send your request just now. Please try again, or call or text us at (236) 622-5636.':
      '目前沒有辦法送出你的預約。請再試一次，或來電、傳簡訊到 (236) 622-5636。',
    'Back to home': '回到首頁',
    'Send another request': '再送一筆預約',

    'How to reach you': '如何聯絡你',
    'Name': '姓名',
    'Phone': '電話',
    'Email': '電子郵件',
    'We use your phone to confirm the visit and your email to send the details.':
      '我們用電話跟你確認到府時間，用電子郵件寄給你詳細內容。',

    'What you need, and where': '你需要什麼服務、在哪裡',
    'Service': '服務項目',
    'Rental enquiry': '租琴詢問',
    'Buying a piano': '我想買琴',
    'Selling my piano': '我想賣琴',
    'City': '城市',
    'Select a city': '請選擇城市',
    'Other': '其他',

    'About the piano': '關於這台琴',
    'OPTIONAL': '選填',
    'Make and model': '品牌與型號',
    'Upright or grand': '直立琴或平台琴',
    'Not sure': '不確定',
    'Upright': '直立琴',
    'Grand': '平台琴',
    'Baby grand': '小型平台琴',
    'Digital piano': '電鋼琴',
    'Last tuned': '上次調音',
    'Within the last year': '一年內',
    '1 – 3 years ago': '一到三年前',
    'More than 3 years ago': '三年以上',
    'Never, or unknown': '從未調過，或不確定',
    'Preferred date and time': '希望到府的日期與時段',
    'Morning': '上午',
    'Afternoon': '下午',
    'Evening': '傍晚',
    'We visit Monday to Saturday. Pick a date, then a time slot or write your own below.':
      '我們的到府服務為週一至週六。請先選日期，時段可以按下方按鈕或自己填寫。',
    'Sundays are not available. Please choose another day.':
      '週日不提供服務，請改選其他日期。',
    'Anything else we should know': '其他想讓我們知道的事',
    'Send request': '送出預約',
    'We reply within one business day.': '我們會在一個工作天內回覆。',

    'PRICING': '價格',
    'Repair & moving': '維修與搬運',
    'PREFER TO TALK': '想直接聊聊',
    'WE COME TO YOU': '服務範圍',
    'WHAT HAPPENS NEXT': '接下來的流程',
    'We read your request and check the schedule.': '我們看過你的需求，並確認排程。',
    'You get a time window and a price to approve.': '你會收到到府時段與報價，確認後才成立。',
    'We confirm the address and come to you.': '確認地址之後，我們就到府服務。'
  };

  // 表單提示文字（placeholder 不是文字節點，要另外處理）
  var ZH_PLACEHOLDER = {
    'Or type a time that suits you better, e.g. after 5pm, or Saturday morning': '或直接寫下你方便的時間，例如「五點以後」、「週六早上」',
    'Usually on the fallboard, e.g. Yamaha U1': '通常印在琴鍵上方的蓋板上，例如 Yamaha U1',
    'First and last name': '你的姓名',
    'Sticking keys, buzzing notes, recent moves, stairs at the entrance.':
      '琴鍵卡住、雜音、最近搬過家、門口有樓梯等狀況。',
    // 確認頁
    '1234 Main Street': '例：1234 Main Street',
    'Optional': '選填',
    'Stairs, elevator, buzzer code, where to park.': '樓梯、電梯、門禁密碼、停車位置。'
  };

  // 分頁標題
  var ZH_TITLE = {
    'Soundcraft Piano Service — Piano Tuning, Repair & Sales in Greater Vancouver':
      'Soundcraft 鋼琴服務 — 大溫哥華地區鋼琴調音、維修與買賣',
    'Book a Service — Soundcraft Piano Service': '預約服務 — Soundcraft 鋼琴服務',
    'Confirm your visit — Soundcraft Piano Service': '確認到府資訊 — Soundcraft 鋼琴服務'
  };

  var KEY = 'soundcraft-lang';
  var norm = function (s) { return s.replace(/\s+/g, ' ').trim(); };

  // ── 收集所有文字節點，並記住原本的英文 ──
  var nodes = [];
  (function collect() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        return norm(n.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      var key = norm(n.data);
      if (ZH[key]) nodes.push({ node: n, en: n.data, key: key });
    }
  })();

  var fields = [];
  Array.prototype.forEach.call(document.querySelectorAll('[placeholder]'), function (el) {
    var v = el.getAttribute('placeholder');
    if (ZH_PLACEHOLDER[norm(v)]) fields.push({ el: el, en: v, key: norm(v) });
  });

  var titleEn = document.title;

  function apply(lang) {
    var zh = lang === 'zh';
    nodes.forEach(function (item) {
      // 保留原本的前後空白，避免相鄰行文擠在一起
      if (zh) {
        var lead = item.en.match(/^\s*/)[0];
        var tail = item.en.match(/\s*$/)[0];
        item.node.data = lead + ZH[item.key] + tail;
      } else {
        item.node.data = item.en;
      }
    });
    fields.forEach(function (f) {
      f.el.setAttribute('placeholder', zh ? ZH_PLACEHOLDER[f.key] : f.en);
    });
    if (zh && ZH_TITLE[titleEn]) document.title = ZH_TITLE[titleEn];
    else document.title = titleEn;
    document.documentElement.lang = zh ? 'zh-Hant' : 'en';
    paintToggle(zh);
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  // ── 切換開關：頁首與頁尾各有一組 EN / 中 ──
  var pairs = [];
  (function findToggles() {
    var spans = document.querySelectorAll('span');
    var en = [], zh = [];
    Array.prototype.forEach.call(spans, function (s) {
      var t = norm(s.textContent);
      if (t === 'EN') en.push(s);
      else if (t === '中') zh.push(s);
    });
    var count = Math.min(en.length, zh.length);
    for (var i = 0; i < count; i++) {
      // 初始狀態是英文，所以 EN 身上的顏色就是「選中」的樣式
      pairs.push({
        en: en[i], zh: zh[i],
        active: en[i].style.color,
        idle: zh[i].style.color
      });
      [en[i], zh[i]].forEach(function (el) {
        el.style.cursor = 'pointer';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
      });
      (function (p) {
        p.en.addEventListener('click', function () { apply('en'); });
        p.zh.addEventListener('click', function () { apply('zh'); });
        p.en.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply('en'); }
        });
        p.zh.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply('zh'); }
        });
      })(pairs[i]);
    }
  })();

  function paintToggle(zh) {
    pairs.forEach(function (p) {
      p.en.style.color = zh ? p.idle : p.active;
      p.zh.style.color = zh ? p.active : p.idle;
      p.en.setAttribute('aria-pressed', String(!zh));
      p.zh.setAttribute('aria-pressed', String(zh));
    });
  }

  var saved = 'en';
  try { saved = localStorage.getItem(KEY) || 'en'; } catch (e) {}
  apply(saved === 'zh' ? 'zh' : 'en');

  // 給驗證用：列出字典裡沒被用到的條目
  window.__i18nAudit = function () {
    var used = {};
    nodes.forEach(function (n) { used[n.key] = true; });
    fields.forEach(function (f) { used[f.key] = true; });
    return {
      matchedTextNodes: nodes.length,
      unusedKeys: Object.keys(ZH).filter(function (k) { return !used[k]; })
    };
  };
})();
