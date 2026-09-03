// Supabase 連線設定。工單頁（ticket.html）與兩個預約頁
// （booking.html / confirm.html）共用這一份。
// 兩個值都在 Supabase 後台：Project Settings → API / API Keys。
//
// publishable key（舊版叫 anon key）是「公開金鑰」，本來就設計成可以放在
// 網頁裡跟著原始碼一起公開，真正的權限由資料庫的 RLS 規則 + 登入帳號決定
// （見 SETUP-工單系統.md）。
//
// 千萬不要把 secret key（舊版叫 service_role）貼到這裡 ——
// 那把鑰匙會繞過所有 RLS 權限，等於把整個資料庫交出去。
window.SC_CONFIG = {
  SUPABASE_URL: 'https://skxmmiolwlgqbvqyykhf.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_7sTMHy9S4wYmiYUR2sjgBA_kyz1idb3'
};
