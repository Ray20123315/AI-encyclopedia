# Benchmark 自動同步

## 原則

v0.3.0 起，Benchmark 分數不再硬編在 repository。程式只保留「要監看的官方評測來源」與 parser 規則；分數由 Cloudflare Worker Cron 自動擷取。

## 目前支援的自動來源

- OpenAI：GPT-5.6 / GPT-6 Astra 官方發布評測頁（若 Cloudflare 遭 WAF 阻擋會標示失敗並保留 last-known-good）。
- Google DeepMind：Gemini 3.1 Pro、3.5 Flash、3.5 Flash-Lite、3.6 Flash Model Card。
- xAI：Grok 4.6 官方發布評測表。
- DeepSeek：官方 Updates / Change Log。
- Qwen：官方 GitHub eval README。
- Moonshot AI：Kimi K3 官方 GitHub README。
- MiniMax：M2.7 官方 GitHub README。
- Cohere：Command A+ 官方發布頁。

## 資料可信度

每一筆自動評測會保存：benchmark ID、名稱、分數、單位、測試條件文字、來源 URL、來源發布者、抓取時間，以及 `source_type = 官方自動同步`。

若來源只提供圖片或 PDF、HTML 無法安全解析、或來源阻擋 Cloudflare Worker，該模型會暫時沒有分數；不會以人工數字補值。

## Last-known-good

若某模型曾成功取得 Benchmark，之後來源抓取失敗或 parser 回傳 0 筆，merge 階段會保留上一次成功的 Benchmark。只有當同模型取得新的有效自動分數時才替換。
