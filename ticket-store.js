// 工單的資料層：登入、讀寫 Supabase、離線暫存。
//
// 為什麼不用 supabase-js 這個套件：它得從 CDN 載入，而這頁常在客戶家裡開，
// 訊號差的時候整包載不下來就整個開不了。這裡直接打 Supabase 的 REST API，
// 沒有任何外部相依，頁面本身進了瀏覽器快取就能離線運作。
//
// 對外只暴露 window.SCStore。
(function () {
  'use strict';

  var CFG = window.SC_CONFIG || {};
  var URL_BASE = (CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  var ANON = CFG.SUPABASE_ANON_KEY || '';

  var SESSION_KEY = 'sc_ticket_session_v1';
  var QUEUE_KEY = 'sc_ticket_queue_v1';
  var CACHE_KEY = 'sc_ticket_cache_v1';

  // localStorage 在無痕模式或關閉 cookie 時會直接丟例外，全部包起來。
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }

  var session = readJSON(SESSION_KEY, null);

  function isConfigured() { return !!(URL_BASE && ANON); }
  function currentUser() { return session ? session.user : null; }

  function saveSession(s) {
    session = s;
    if (s) writeJSON(SESSION_KEY, s);
    else { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }
  }

  // ── 低階請求 ────────────────────────────────────────────────
  function request(path, options) {
    options = options || {};
    var headers = { 'apikey': ANON };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.auth !== false && session && session.access_token) {
      headers['Authorization'] = 'Bearer ' + session.access_token;
    }
    Object.keys(options.headers || {}).forEach(function (k) { headers[k] = options.headers[k]; });

    return fetch(URL_BASE + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    }).then(function (res) {
      if (res.status === 204) return null;
      return res.text().then(function (text) {
        var data = null;
        if (text) { try { data = JSON.parse(text); } catch (e) { data = text; } }
        if (res.ok) return data;
        var err = new Error((data && (data.message || data.error_description || data.error)) || ('HTTP ' + res.status));
        err.status = res.status;
        throw err;
      });
    });
  }

  // access_token 大約一小時就過期。過期時用 refresh_token 換一張新的再重試一次，
  // 不要讓技師在客戶家裡突然被登出。
  function authed(path, options) {
    return request(path, options).catch(function (err) {
      if (err.status !== 401 || !session || !session.refresh_token) throw err;
      return refresh().then(function () { return request(path, options); });
    });
  }

  function refresh() {
    return request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', auth: false, body: { refresh_token: session.refresh_token }
    }).then(function (data) {
      saveSession({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user });
      return data;
    }).catch(function (err) {
      saveSession(null);
      throw err;
    });
  }

  // ── 登入 / 登出 ─────────────────────────────────────────────
  function signIn(email, password) {
    return request('/auth/v1/token?grant_type=password', {
      method: 'POST', auth: false, body: { email: email, password: password }
    }).then(function (data) {
      saveSession({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user });
      return data.user;
    });
  }

  function signOut() {
    var done = function () { saveSession(null); };
    if (!session) { done(); return Promise.resolve(); }
    // 登出一定要成功，就算伺服器沒回應也要把本機的憑證清掉
    return authed('/auth/v1/logout', { method: 'POST' }).then(done, done);
  }

  // ── 工單欄位對應 ────────────────────────────────────────────
  // 資料庫用 snake_case，前端用 camelCase，兩邊在這裡轉換。
  var FIELDS = [
    ['id', 'id'],
    ['ticket_no', 'ticketNo'],
    ['service_date', 'serviceDate'],
    ['client_name', 'clientName'],
    ['client_phone', 'clientPhone'],
    ['address', 'address'],
    ['brand', 'brand'],
    ['last_tuned', 'lastTuned'],
    ['piano_type', 'pianoType'],
    ['prep_done', 'prepDone'],
    ['inspect_done', 'inspectDone'],
    ['condition_notes', 'conditionNotes'],
    ['items', 'items'],
    ['total', 'total'],
    ['payment_method', 'paymentMethod'],
    ['warranty_days', 'warrantyDays'],
    ['next_tuning', 'nextTuning'],
    ['signature', 'signature'],
    ['booking_ref', 'bookingRef'],
    ['updated_at', 'updatedAt'],
    ['created_at', 'createdAt']
  ];

  function toRow(t) {
    var row = {};
    FIELDS.forEach(function (f) {
      if (f[1] === 'createdAt' || f[1] === 'updatedAt') return;   // 由資料庫自己維護
      var v = t[f[1]];
      // 空字串送進 date 欄位會被 Postgres 拒絕，要送 null
      if (v === '' && (f[0] === 'service_date' || f[0] === 'next_tuning')) v = null;
      // booking_ref 是後來才加的欄位，而且只會被設定、不會被清空。
      // 空值就整個不送，資料庫還沒加這一欄時，一般工單仍然存得起來。
      if (f[0] === 'booking_ref' && !v) return;
      if (v !== undefined) row[f[0]] = v;
    });
    row.updated_at = new Date().toISOString();
    return row;
  }

  function fromRow(row) {
    var t = {};
    FIELDS.forEach(function (f) { t[f[1]] = row[f[0]]; });
    t.prepDone = t.prepDone || [];
    t.inspectDone = t.inspectDone || [];
    t.items = t.items || [];
    return t;
  }

  // ── 離線佇列 ────────────────────────────────────────────────
  // 送不出去的工單先排在這裡，不會弄丟。每張工單都帶自己的 id，
  // 所以重送是 upsert，同一張不會變成兩筆。
  function queue() { return readJSON(QUEUE_KEY, []); }
  function queueCount() { return queue().length; }

  function enqueue(ticket) {
    var q = queue().filter(function (t) { return t.id !== ticket.id; });
    q.push(ticket);
    writeJSON(QUEUE_KEY, q);
    cachePut(ticket);
  }

  function flush() {
    var q = queue();
    if (!q.length || !navigator.onLine || !session) return Promise.resolve(0);
    var sent = 0;
    // 一張一張送，中途失敗就停下來，剩下的留在佇列裡等下一次
    return q.reduce(function (chain, ticket) {
      return chain.then(function (stop) {
        if (stop) return true;
        return push(ticket).then(function () {
          sent++;
          writeJSON(QUEUE_KEY, queue().filter(function (t) { return t.id !== ticket.id; }));
          return false;
        }, function () { return true; });
      });
    }, Promise.resolve(false)).then(function () { return sent; });
  }

  // ── 本機快取：離線時仍看得到最近讀過的工單 ──────────────────
  function cache() { return readJSON(CACHE_KEY, []); }

  function cachePut(ticket) {
    var list = cache().filter(function (t) { return t.id !== ticket.id; });
    list.unshift(ticket);
    writeJSON(CACHE_KEY, list.slice(0, 300));
  }

  function cacheReplace(list) {
    // 還沒送出去的版本比伺服器上的新，不能被讀回來的舊資料蓋掉。
    // 從沒送成功過的那幾張根本不在伺服器的清單裡，要另外接回來，否則會消失。
    var pending = {};
    queue().forEach(function (t) { pending[t.id] = t; });
    var merged = list.map(function (t) {
      if (!pending[t.id]) return t;
      var p = pending[t.id];
      delete pending[t.id];
      return p;
    });
    Object.keys(pending).forEach(function (id) { merged.unshift(pending[id]); });
    writeJSON(CACHE_KEY, merged.slice(0, 300));
  }

  function searchCache(term) {
    var t = (term || '').trim().toLowerCase();
    var list = cache();
    if (!t) return list;
    return list.filter(function (x) {
      return ['clientName', 'clientPhone', 'ticketNo', 'address', 'brand'].some(function (k) {
        return (x[k] || '').toString().toLowerCase().indexOf(t) !== -1;
      });
    });
  }

  // 清單上要看得出哪幾張還沒送到雲端，否則技師不知道自己該不該擔心
  function markPending(items) {
    var ids = {};
    queue().forEach(function (t) { ids[t.id] = true; });
    items.forEach(function (t) { t.pending = !!ids[t.id]; });
    return items;
  }

  // ── 對外的讀寫 ──────────────────────────────────────────────
  function push(ticket) {
    // on_conflict=id + merge-duplicates：同一個 id 就更新，沒有就新增。
    return authed('/rest/v1/tickets?on_conflict=id', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: [toRow(ticket)]
    }).then(function (rows) {
      var saved = rows && rows[0] ? fromRow(rows[0]) : ticket;
      cachePut(saved);
      return saved;
    });
  }

  // 回傳 {ticket, synced}：synced 為 false 代表先存在本機，還沒送到雲端
  function save(ticket) {
    if (!isConfigured() || !session || !navigator.onLine) {
      enqueue(ticket);
      return Promise.resolve({ ticket: ticket, synced: false });
    }
    return push(ticket).then(function (saved) {
      return { ticket: saved, synced: true };
    }, function (err) {
      if (err.status === 401 || err.status === 403) throw err;   // 是權限問題，不是網路問題
      enqueue(ticket);
      return { ticket: ticket, synced: false };
    });
  }

  function list(term, limit) {
    limit = limit || 100;
    if (!isConfigured() || !session || !navigator.onLine) {
      return Promise.resolve({ items: markPending(searchCache(term)), offline: true });
    }
    var q = '/rest/v1/tickets?select=*&order=service_date.desc,created_at.desc&limit=' + limit;
    var t = (term || '').trim();
    if (t) {
      // PostgREST 的 or= 語法：值裡的逗號和括號會破壞查詢字串，先擋掉
      var safe = t.replace(/[(),*]/g, ' ').trim();
      if (safe) {
        q += '&or=(' + ['client_name', 'client_phone', 'ticket_no', 'address', 'brand']
          .map(function (c) { return c + '.ilike.*' + encodeURIComponent(safe) + '*'; }).join(',') + ')';
      }
    }
    return authed(q).then(function (rows) {
      var items = (rows || []).map(fromRow);
      if (!t) {
        cacheReplace(items);                // 只有完整清單才拿來覆蓋快取
        items = cache();                    // 併回還沒送出去的那幾張
      } else {
        items.forEach(cachePut);
      }
      return { items: markPending(items), offline: false };
    }, function () {
      return { items: markPending(searchCache(term)), offline: true };
    });
  }

  function get(id) {
    var local = cache().filter(function (t) { return t.id === id; })[0] || null;
    if (!isConfigured() || !session || !navigator.onLine) return Promise.resolve(local);
    return authed('/rest/v1/tickets?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')
      .then(function (rows) {
        if (!rows || !rows.length) return local;
        var t = fromRow(rows[0]);
        // 這張還排在佇列裡，本機的版本才是最新的
        var pending = queue().filter(function (q) { return q.id === id; })[0];
        return pending || t;
      }, function () { return local; });
  }

  function remove(id) {
    writeJSON(QUEUE_KEY, queue().filter(function (t) { return t.id !== id; }));
    writeJSON(CACHE_KEY, cache().filter(function (t) { return t.id !== id; }));
    if (!isConfigured() || !session || !navigator.onLine) return Promise.resolve();
    return authed('/rest/v1/tickets?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
  }

  // ── 預約 ────────────────────────────────────────────────────
  // 同一組預約在資料庫裡是兩筆：客戶送出詢問時一筆，確認地址時再一筆。
  // 這裡以 ref 分組合併成一筆，後來的非空值蓋掉先前的，
  // 所以拿到的是「目前為止知道的全部」——第一階段的琴種備註加上第二階段的地址。
  function mergeByRef(rows) {
    var byRef = {};
    var order = [];
    // 由舊到新處理，新的資訊才能蓋過舊的
    rows.slice().sort(function (a, b) {
      return (a.created_at || '') < (b.created_at || '') ? -1 : 1;
    }).forEach(function (r) {
      if (!r.ref) return;
      if (!byRef[r.ref]) { byRef[r.ref] = {}; order.push(r.ref); }
      var target = byRef[r.ref];
      Object.keys(r).forEach(function (k) {
        if (r[k] !== null && r[k] !== '') target[k] = r[k];
      });
    });
    return order.map(function (ref) { return byRef[ref]; }).reverse();
  }

  // 還沒開過工單的預約。開過的就不該再出現在待辦清單上。
  function pendingBookings() {
    if (!isConfigured() || !session || !navigator.onLine) return Promise.resolve([]);
    return Promise.all([
      authed('/rest/v1/bookings?select=*&order=created_at.desc&limit=300'),
      authed('/rest/v1/tickets?select=booking_ref&booking_ref=not.is.null&limit=1000')
    ]).then(function (res) {
      var used = {};
      (res[1] || []).forEach(function (t) { if (t.booking_ref) used[t.booking_ref] = true; });
      return mergeByRef(res[0] || []).filter(function (b) { return !used[b.ref]; });
    }, function () { return []; });
  }

  // RFC4122 v4。crypto.randomUUID 在舊 Safari 沒有，備援用 getRandomValues。
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  window.SCStore = {
    isConfigured: isConfigured,
    currentUser: currentUser,
    signIn: signIn,
    signOut: signOut,
    save: save,
    list: list,
    get: get,
    remove: remove,
    pendingBookings: pendingBookings,
    flush: flush,
    queueCount: queueCount,
    uuid: uuid
  };
})();
