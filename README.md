# AI 模型百科

跨 AI 廠商與推論平台的模型、API 價格、訂閱額度、公開評測與歷史變化儀表板。以 **Cloudflare Worker + Static Assets + SQLite Durable Object** 運行，runtime 為純 JavaScript。

## 1. v0.2.0 重點

- 全站繁體中文介面。
- 搜尋模型後直接勾選，最多同時比較 6 個模型。
- 勾選模型只在具有相同 benchmark 時直接畫分數圖；不建立虛假的「AI 總分」。
- 已驗證 benchmark 保存測試名稱、分數單位、設定、日期與原始來源。
- 價格保留 region / context / thinking / cache / peak-off-peak / batch / fast 等條件。
- 加入成本試算器、價格歷史、來源健康度與模型詳細來源。
- 官方資料由 Cron 自動同步，parser 失敗時保留 last-known-good。
- v0.2.0 內建 16 個來源／平台、67 個冷啟動 fallback 項目；可由官方 catalog 動態發現更多 model ID。

## 2. 目前來源

### 模型供應商

- OpenAI
- Anthropic / Claude
- Google Gemini
- xAI / Grok
- DeepSeek
- Qwen / 阿里雲百鍊
- 豆包 / 火山引擎方舟
- Moonshot AI / Kimi
- Z.ai / 智譜 GLM
- 騰訊混元 / Hy
- MiniMax
- Mistral AI
- Cohere

### 推論平台

- GroqCloud
- Together AI
- Fireworks AI

推論平台中的模型不等同於新模型本體；它們代表特定平台上的部署、價格、脈絡限制與速度條件。後續版本會進一步把 canonical model 與 deployment 完全拆層。

## 3. 架構

```text
官方模型目錄 / 定價 / 模型卡 / 發布公告
                ↓
          Provider adapters
                ↓
    正規化模型 / 價格 / Benchmark
                ↓
         SQLite Durable Object
          ├─ last-known-good
          └─ 價格歷史 snapshot
                ↓
           Cloudflare Worker API
                ↓
       繁中互動式 Dashboard
```

## 4. 為什麼不做單一模型總分？

GPQA、SWE-Bench、Terminal-Bench、BrowseComp、GDPVal 等測量不同能力，量尺與 harness 也不同。同名 benchmark 甚至可能因 reasoning effort、工具、token budget、pass@k 而不相容。

因此本站：

1. 保存每個 benchmark 的原始名稱、版本與設定。
2. 勾選比較時優先顯示共同 benchmark。
3. 沒有共同測試就不硬排名。
4. 每個分數都必須能回到來源。

## 5. 為什麼價格不是只有 input / output？

不同廠商有不同計費維度：

- Qwen：區域 + context + thinking mode。
- DeepSeek：尖峰／離峰 + cache hit/miss。
- Claude：prompt cache + batch + Fast。
- Gemini：context + batch/flex/priority + 多媒體。
- Grok：短脈絡／長脈絡價格。
- OpenAI Codex：API token price 與 Plus/Pro 訂閱額度並存。

主表只取一個適合快速瀏覽的 primary tier，完整條件在「詳情」中。

## 6. 自動同步

`wrangler.jsonc` 預設每 10 分鐘觸發一次 Cron：

```text
*/10 * * * *
```

同步規則：

- 成功：promotion 新資料並寫入歷史。
- 部分成功：標示「部分同步」。
- 失敗：不覆蓋 last-known-good。
- 第一次啟動且無可用網路資料：顯示經驗證 seed，並明確標示後備狀態。

## 7. 部署

```bash
npm install
npx wrangler login
npm run deploy
```

若要保護 `POST /api/refresh`：

```bash
npx wrangler secret put ADMIN_TOKEN
```

## 8. 本機開發與驗證

```bash
npm install
npm run dev
```

完整檢查：

```bash
npm run check
```

包含 Worker/schema 語法、前端 inline JS 解析、Provider parser、catalog 規模與 benchmark source provenance 測試。

## 9. API

- `GET /api/data`：完整目前 catalog。
- `GET /api/health`：來源同步健康度與 source status。
- `GET /api/history?uid=openai%3Agpt-5.6-sol`：指定模型／部署的價格歷史。
- `POST /api/refresh`：要求立即同步；若設 `ADMIN_TOKEN` 需 Bearer token。

## 10. 新增來源

請看 [`docs/ADDING_PROVIDER.md`](docs/ADDING_PROVIDER.md)。

更完整的功能方向請看 [`docs/ROADMAP.md`](docs/ROADMAP.md)。
