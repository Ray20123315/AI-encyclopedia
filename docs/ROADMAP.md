# 功能路線圖

## P0：直接提升比較可信度

1. **模型與部署分離**：同一 canonical model 可掛原廠 API、Groq、Together、Fireworks、Bedrock、Vertex AI 等部署，避免重複模型污染比較。
2. **來源衝突偵測**：同一價格或規格在兩個官方來源不同時顯示衝突，不自動選一邊。
3. **Benchmark 條件相容性**：比較前檢查 benchmark 版本、harness、工具、reasoning effort；不相容時顯示警示。
4. **生效日期**：價格保留 `observed_at` 與 `effective_at`，支援已公告的未來漲價／降價。

## P1：真正有決策價值的工具

5. **工作負載成本模擬器**：輸入 prompt、快取命中率、輸出長度、每日請求數，模擬不同模型／部署的月成本。
6. **Pareto 前緣**：用「成本 vs benchmark」、「成本 vs context」、「成本 vs 實測速度」找非劣解，不用自創總分。
7. **共同 Benchmark 雷達／表格**：只在勾選模型有相同測試且條件相容時顯示。
8. **生命週期時間線**：發布、Preview→GA、降價、改名、退役、替代模型。
9. **價格異動通知**：Cloudflare Cron 偵測到變更後可發 Webhook / Email / RSS / Atom。

## P2：百科化

10. **能力矩陣**：文字、視覺、音訊、影片、圖像生成、工具、JSON Schema、MCP、Computer Use。
11. **區域與合規**：資料落地區域、ZDR、retention、企業／受限存取資訊。
12. **授權與權重**：閉源 API、open weights、Apache/MIT/自訂 license、參數量與 active parameters。
13. **模型別名解析**：API alias、日期版 model ID、latest alias、平台重命名對到 canonical model。
14. **可重現 benchmark metadata**：測試 repo commit、harness 版本、工具設定、seed、pass@k。

## P3：資料品質與工程

15. **來源信心分級**：A 原始官方資料、B 官方公告、C 官方引用第三方、D 社群實測；主比較預設 A/B/C。
16. **社群交叉驗證**：使用可信 tracker / GitHub dataset 做 conflict detection，但不得覆蓋官方資料。
17. **Parser 監控**：來源 HTML hash 改變但解析結果未變／突然歸零時觸發異常。
18. **資料匯出**：JSON / CSV / Excel，並附 source URL 與 observed timestamp。
19. **公開 API**：`/api/models`、`/api/compare`、`/api/changes`，供其他工具引用。
20. **搜尋索引**：模型超過數百／數千後，改為前端全文索引或 Worker-side 分頁搜尋。
