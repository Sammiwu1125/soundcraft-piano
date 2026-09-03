# 工單系統設定

工單頁在 `ticket.html`，資料存在 Supabase（免費方案）。設定一次就好，之後所有裝置共用同一份資料。

大約需要 10 分鐘。

---

## 為什麼要這樣做

舊的工單頁把資料存在 `localStorage`，那是**瀏覽器本機的抽屜**：換手機、換筆電、換瀏覽器、清快取，看到的都是不同的抽屜。所以資料不會累積，也沒辦法查詢或修改。

新的版本把工單存到雲端資料庫，網頁只是輸入與查詢的介面：

- 手機填的、筆電填的，都進同一份資料
- 可以用姓名、電話、工單號、地址搜尋
- 點開舊工單直接改，改完存回去就是同一張，不會變兩筆
- 要登入才看得到，不是誰拿到網址都能翻
- **沒訊號也能填**：先存在手機上，回到有訊號自動送出（頁首會顯示還有幾張待同步）

---

## 步驟一：建立 Supabase 專案

1. 到 https://supabase.com 註冊（用 GitHub 或 email 都行），免費方案就夠。
2. **New project**：
   - Name：`soundcraft-tickets`
   - Database Password：隨便設一組強密碼，**存到密碼管理器**（之後幾乎不會用到，但弄丟很麻煩）
   - Region：選 **West US (North California)** 或 **West US (Oregon)**，離溫哥華最近
3. 按 Create，等大約兩分鐘跑完。

---

## 步驟二：建立資料表

左邊選 **SQL Editor** → **New query**，把下面整段貼進去，按 **Run**。

```sql
create extension if not exists pgcrypto;

create table public.tickets (
  id              uuid primary key default gen_random_uuid(),
  ticket_no       text,
  service_date    date,
  client_name     text not null,
  client_phone    text,
  address         text,
  brand           text,
  last_tuned      text,
  piano_type      text,
  prep_done       text[]        default '{}',
  inspect_done    text[]        default '{}',
  condition_notes text,
  items           jsonb         default '[]'::jsonb,
  total           numeric(10,2) default 0,
  payment_method  text,
  warranty_days   text,
  next_tuning     date,
  signature       text,
  created_by      uuid          default auth.uid() references auth.users(id),
  created_at      timestamptz   default now(),
  updated_at      timestamptz   default now()
);

create index tickets_service_date_idx on public.tickets (service_date desc);
create index tickets_client_name_idx  on public.tickets (lower(client_name));

-- RLS 打開之後，沒登入的人一列都讀不到
alter table public.tickets enable row level security;

create policy "staff read"   on public.tickets for select to authenticated using (true);
create policy "staff insert" on public.tickets for insert to authenticated with check (true);
create policy "staff update" on public.tickets for update to authenticated using (true) with check (true);
create policy "staff delete" on public.tickets for delete to authenticated using (true);
```

跑完應該顯示 `Success. No rows returned`。

---

## 步驟三：關掉公開註冊，手動開帳號

**這一步不能跳過。** 上面的規則是「只要登入就看得到全部工單」，所以如果放著讓任何人自由註冊，等於任何人都能翻你的客戶資料。

1. 左邊 **Authentication** → **Sign In / Providers** → Email，把 **Allow new users to sign up** 關掉，Save。
2. 左邊 **Authentication** → **Users** → **Add user** → **Create new user**：
   - Email：你自己的信箱
   - Password：自己設一組
   - **Auto Confirm User 打勾**（不打勾要收驗證信才能用）
3. 之後有技師要用，就在同一個地方多開一個帳號。

---

## 步驟四：把連線資料填進網站

回到 **Project Settings**（左下齒輪），抄兩個值：

- **Data API** 頁的 **Project URL**，長得像 `https://abcdefghijkl.supabase.co`
- **API Keys** 頁的 **publishable key**，開頭是 `sb_publishable_`
  （舊版介面叫 `anon` `public`，是同一個東西）

打開專案裡的 `ticket-config.js`，填進去：

```js
window.SC_CONFIG = {
  SUPABASE_URL: 'https://你的專案.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_...'
};
```

> publishable key 本來就設計成可以公開放在網頁裡跟著原始碼一起上 GitHub，
> 權限是由 RLS 規則和登入帳號決定的。
>
> **絕對不要**貼 **secret key**（`sb_secret_` 開頭，舊版叫 `service_role`）——
> 它會繞過所有 RLS 權限。這把金鑰工單系統完全用不到；萬一不小心貼出去或
> 傳給別人，到 **Project Settings → API Keys** 撤銷重發。

存檔，commit 推上 GitHub，等 Pages 部署完（約 1–3 分鐘）。

---

## 步驟五：開始用

網址：**https://soundcraftpianoservice.ca/ticket.html**

這頁沒有從官網任何地方連過去，也加了 `noindex` 不讓搜尋引擎收錄。把它加到手機主畫面當捷徑最順手。

- 用步驟三開的帳號登入，登入狀態會留著，不必每次重打
- 「新增工單」填單 →「儲存工單」
- 清單頁可以搜尋姓名／電話／工單號／地址，點任一張就能改
- 「列印收據」會印出乾淨的一頁收據（含簽名）
- 「匯出 CSV」把目前清單存成 Excel 檔

---

## 舊資料怎麼辦

舊工單還鎖在各裝置的瀏覽器裡。**在每一台填過工單的裝置上**，各自打開舊的 Netlify 那頁按一次「Export All (Excel)」，把檔案存下來。

資料量不大的話，照著檔案重新輸入一次最省事。如果有幾十張以上，把匯出的檔案給我，我寫個匯入腳本一次灌進去。

---

## 幾件要記得的事

- **免費方案閒置 7 天會自動暫停。** 只要有人開來用就不會發生；真的暫停了，到 Supabase 後台按一下 Restore 就會回來，資料不會掉。
- **Supabase 後台可以直接看與改資料。** Table Editor → tickets，等於一張線上試算表，網頁壞掉時也還有這條路。
- **備份**：Settings → Database → 有自動備份。想要自己留一份就用網頁上的「匯出 CSV」。
- 換手機或重灌後只要重新登入，資料都還在（在雲端，不在裝置上）。

---

## 相關檔案

| 檔案 | 作用 |
|---|---|
| `ticket.html` | 工單頁的版面 |
| `ticket.js` | 介面邏輯：清單、搜尋、表單、簽名、列印 |
| `ticket-store.js` | 資料層：登入、讀寫 Supabase、離線暫存 |
| `ticket-config.js` | 連線設定（步驟四要改的就是這個） |
| `ticket.css` | 樣式 |
