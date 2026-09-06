# AI 模型百科

跨 AI 模型供應商與推論平台的模型目錄、API 價格、訂閱額度、Benchmark、來源與歷史資料儀表板。使用 Cloudflare Worker + Static Assets + SQLite Durable Object，runtime 為純 JavaScript。

## v0.3.0

- 全繁體中文介面。
- 模型搜尋 + 最多 6 個勾選比較。
- Benchmark 分數改成官方來源自動同步，不再內建人工分數。
- Benchmark parser 支援表格、更新日誌 section、文章式 inline 三種格式。
- Benchmark 抓取失敗時保存 last-known-good。
- 資料來源頁改成「每個供應商一張可收合卡片」，可搜尋、全部展開、全部收合。
- UI 重做為深色資料終端風，加入程式版本、資料版本、自動評測統計與更清楚的同步健康度。
- 價格地圖、價格歷史、共同 Benchmark 比較與工作負載成本試算仍保留。

## 部署

```bash
npm install
npx wrangler login
npm run deploy
```

預設 Cron 每 10 分鐘同步。完整檢查：

```bash
npm run check
```

Benchmark 自動同步細節見 [`docs/BENCHMARK_SYNC.md`](docs/BENCHMARK_SYNC.md)。
