# 新增模型供應商或推論平台

本專案的核心原則是：**先保存真實條件，再做比較；不能可靠確認的欄位就留空，不猜。**

## 1. Provider 結構

每個來源放在 `src/providers/<provider>.js`，並在 `src/providers/index.js` 註冊。

```js
export const exampleProvider = {
  id: 'example',
  name: '範例模型商',
  type: '模型供應商', // 或「推論平台」
  homepage: 'https://example.com',
  description_zh: '繁體中文說明',
  sources: [
    {
      id: 'pricing',
      title: '官方定價',
      kind: '官方定價',
      required: true,
      url: 'https://example.com/pricing'
    }
  ],
  seed_models: [],
  async parse(fetched, sourceStatus) {
    return [];
  }
};
```

## 2. 模型欄位

必要／建議欄位：

- `model_id`：來源平台上的模型 ID。
- `name` / `name_zh`：原名與中文顯示名。
- `family`：模型家族。
- `status`：`active`、`preview`、`experimental`、`retired`、`restricted`。
- `context_window`、`max_output_tokens`。
- `capabilities[]`：文字、視覺、工具、程式、音訊、圖像生成等。
- `reasoning_efforts[]`。
- `pricing[]`：可為多個 tier。
- `quotas[]`：訂閱方案／rolling window 額度。
- `sources[]`：模型資料來源。

## 3. Pricing tier 不可過度簡化

`pricing[]` 可保留：

- `currency`、`unit`
- `region`
- `mode`：standard / fast / batch / thinking / non-thinking / priority
- `schedule`：all_time / peak / off_peak
- `context_min`、`context_max`
- `input`、`cached_input`、`cache_write`、`output`
- `batch_input`、`batch_output`
- `media`
- `note`

例如：

- Qwen：region + context tier + thinking mode。
- DeepSeek：peak/off-peak + cache hit/miss。
- Claude：cache read/write + batch + Fast。
- Gemini：context tier + batch/flex/priority + multimedia。
- Grok：短／長脈絡價格。
- OpenAI：API token price 與 Codex subscription quota 是兩種資料。

## 4. Benchmark 分數

評測不能只存「87 分」。至少需要：

```js
{
  benchmark_id: 'terminal-bench-2.1',
  benchmark_name: 'Terminal-Bench 2.1',
  category: '代理／程式',
  score: 88.8,
  unit: '%',
  setting: 'max / 官方 harness',
  tested_at: '2026-08',
  source_url: 'https://...',
  source_publisher: '模型供應商',
  source_type: '官方自報'
}
```

規則：

1. 優先原始 benchmark leaderboard / 官方模型卡 / 官方 release。
2. 同 benchmark 但 harness、工具、effort 不同時保留 `setting`，不得當成完全同條件。
3. 不把 GPQA、SWE-Bench、Terminal-Bench 等不同量尺合成一個「AI 總分」。
4. 找不到可驗證來源就不顯示數字。

## 5. 自動同步規則

1. 官方來源解析成功：更新該 provider catalog。
2. 部分來源成功：provider 標記 `partial`。
3. 解析失敗：保留 last-known-good；第一次啟動使用 seed。
4. 動態官方目錄應盡量自動發現 model ID；seed 只負責冷啟動與 parser 失效時的最低可用性。
5. 價格促銷、區域、帳戶折扣等不可直接比較的條件寫在 `note`。
