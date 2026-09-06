# 新增 Provider Adapter

專案的核心原則是：**不要把不同廠商的價格硬塞成同一種 schema**。

每個 provider 放在 `src/providers/<provider>.js`，並匯出：

```js
export const exampleProvider = {
  id: 'example',
  name: 'Example AI',
  homepage: 'https://example.com',
  sources: [
    { id: 'pricing', required: true, url: 'https://example.com/pricing' }
  ],
  seed_models: [],
  async parse(fetched, sourceStatus) {
    return [/* normalized model-like objects */];
  }
};
```

## Model 欄位

必要：

- `model_id`
- `name`
- `family`
- `status`
- `pricing[]`

常用：

- `context_window`
- `max_output_tokens`
- `capabilities[]`
- `reasoning_efforts[]`
- `quotas[]`
- `source_url`
- `source_note`

## Pricing tier

`pricing[]` 可以有多筆，保留不同維度：

- `currency`: USD / CNY / ...
- `region`: global / international / cn-beijing / ...
- `mode`: standard / fast / batch / thinking / non_thinking
- `schedule`: all_time / peak / off_peak
- `context_min`, `context_max`
- `input`, `cached_input`, `cache_write`, `output`
- `batch_input`, `batch_output`

這是為了正確表示：

- Qwen：region + context tier + thinking mode
- DeepSeek：peak/off-peak + cache hit/miss
- Claude：cache write/read + batch + Fast
- OpenAI：API token pricing + Codex subscription quotas

## 同步規則

1. 官方來源解析成功 → 以新資料替換該 provider catalog。
2. 來源部分成功 → provider 標記 `partial`。
3. 解析失敗 → 保留 last-known-good；第一次啟動則使用 seed。
4. 不能可靠解析的欄位保持 `null` / `[]`，不要猜。
5. `source_note` 應說明 region、促銷、帳號折扣等不可直接比較的條件。
