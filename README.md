# AI Encyclopedia

跨 AI 廠商的模型、API 價格、訂閱額度與歷史變化 Dashboard。以 Cloudflare Worker + SQLite Durable Object + Static Assets 運行，純 JavaScript。

## 目前 Provider

| Provider | 目前同步策略 | 備註 |
|---|---|---|
| OpenAI | 官方 Codex Pricing + Rate Card | 同時保存 API token price 與 Plus / Pro Codex quota |
| Anthropic / Claude | 官方 Sonnet / Opus / Fable 頁 | 支援標準價，Opus Fast 以獨立 tier 表示 |
| DeepSeek | 官方 API pricing | 保留 peak/off-peak、cache hit/miss |
| Qwen / Alibaba Cloud | Model Studio 官方 pricing catalog | 自動發現 model IDs；價格有 region/context/thinking 多維度 |
| Doubao / Volcengine Ark | 官方 pricing / model docs，seed fallback | 公開 pricing 頁高度動態；抓不到可驗證價格時仍列模型但不猜價格 |

> Dashboard 的主表只顯示一個「primary comparable tier」。所有 provider-specific pricing tiers 都保留在模型詳情。

## 架構

```text
Official provider pages
        ↓
Provider adapters
        ↓
Normalized model/pricing schema
        ↓
SQLite Durable Object
   ├─ last-known-good catalog
   └─ price history
        ↓
Worker API
        ↓
Static Dashboard (Plotly)
```

## 部署到 Cloudflare

```bash
npm install
npx wrangler login
npm run deploy
```

預設 Cron 每 30 分鐘同步一次。Dashboard 每 60 秒重新讀取 Worker API。

可選：保護 `/api/refresh` 手動強制同步：

```bash
npx wrangler secret put ADMIN_TOKEN
```

## 本機開發

```bash
npm install
npm run dev
```

## 測試

```bash
npm test
npm run check
```

## API

- `GET /api/data`：目前 catalog
- `GET /api/health`：各 provider sync 狀態
- `GET /api/history?uid=anthropic%3Aclaude-sonnet-5`：模型歷史價格
- `POST /api/refresh`：強制同步（若設定 `ADMIN_TOKEN` 需 Bearer token）

## 為什麼不是單一 input/output 價格表？

不同供應商的計費維度不同。例如 Qwen 依 region、context 長度和 thinking mode 分層；DeepSeek 有 peak/off-peak；Claude 有 prompt cache、batch、Fast；OpenAI Codex 還包含訂閱內的 rolling-window quota。若把這些全部壓成兩個數字，跨模型比較會產生錯誤結論。

## Roadmap

優先順序建議：

1. **Gemini / Google AI**：官方 pricing 文件結構穩定，適合下一個 adapter。
2. **xAI / Grok**：官方 model page 直接列 context/input/output，容易同步。
3. **Kimi / Moonshot、Mistral、Cohere、Groq**：加入 provider adapters。
4. **模型能力 metadata**：context、max output、vision/audio/video、tool use、structured output、reasoning effort。
5. **訂閱方案**：Claude Pro/Max、Gemini AI plans、Doubao 專業版等；僅在官方有可比較 quota 時顯示數值。
6. **變更事件**：偵測 model launch / price change / retirement，生成 changelog。
7. **匯率層**：保留原幣價格，另外用可選 FX feed 換算 USD/TWD，不能覆蓋原價。
8. **來源可信度**：官方、官方社群、第三方分級；預設只用官方資料進 primary comparison。

新增 provider 的規格請看 [`docs/ADDING_PROVIDER.md`](docs/ADDING_PROVIDER.md)。
