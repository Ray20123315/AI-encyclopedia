import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBenchmarkFeed, benchmarkFeedsForProvider } from '../src/benchmarks-auto.js';

test('OpenAI 表格可自動依模型欄位解析分數',()=>{
 const feed=benchmarkFeedsForProvider('openai').find(f=>f.id==='openai-gpt56');
 const text=`Eval | GPT-5.6 Sol | GPT-5.6 Terra | GPT-5.6 Luna | GPT-5.5\nGPQA Diamond | 94.6% | 92.9% | 92.3% | 93.6%\nDeepSWE v1.1 | 72.7% | 69.6% | 67.2% | 67%\nTerminal-Bench 2.1 | 88.8% | 87.4% | 84.7% | 85.6%`;
 const parsed=parseBenchmarkFeed(text,feed);
 assert.equal(parsed.get('gpt-5.6-sol').find(x=>x.benchmark_id==='gpqa-diamond').score,94.6);
 assert.equal(parsed.get('gpt-5.6-terra').find(x=>x.benchmark_id==='deep-swe-1.1').score,69.6);
});

test('Google 額外分類欄不會造成模型欄位錯位',()=>{
 const feed=benchmarkFeedsForProvider('google').find(f=>f.id==='google-gemini-35-flash');
 const text=` | Benchmark | Notes | Gemini 3.5 Flash | Gemini 3 Flash\nCoding | Terminal-bench 2.1 | Terminus-2 harness | 76.2% | 58.0%\n | SWE-Bench Pro (Public) | Single attempt | 55.1% | 49.6%\nAgentic | MCP Atlas | | 83.6% | 62.0%`;
 const parsed=parseBenchmarkFeed(text,feed).get('gemini-3.5-flash');
 assert.equal(parsed.find(x=>x.benchmark_id==='terminal-bench-2.1').score,76.2);
 assert.equal(parsed.find(x=>x.benchmark_id==='mcp-atlas').score,83.6);
});

test('DeepSeek 更新日誌 section 可解析各模型自己的分數',()=>{
 const feed=benchmarkFeedsForProvider('deepseek')[0];
 const text=`DeepSeek-V4-Pro Update\nTerminal Bench 2.1: 87.9\nDeepSWE: 62.7\nAutomationBench (Public): 31.8\nDeepSeek-V4-Flash Update\nTerminal Bench 2.1: 82.7\nDeepSWE: 54.4`;
 const parsed=parseBenchmarkFeed(text,feed);
 assert.equal(parsed.get('deepseek-v4-pro').find(x=>x.benchmark_id==='terminal-bench-2.1').score,87.9);
 assert.equal(parsed.get('deepseek-v4-flash').find(x=>x.benchmark_id==='deep-swe-1.1').score,54.4);
});

test('MiniMax 單模型發布頁可用 inline 解析',()=>{
 const feed=benchmarkFeedsForProvider('minimax')[0];
 const text='On SWE-Pro, M2.7 achieved 56.22%, with SWE Multilingual (76.5) and Multi SWE Bench (52.7). On Terminal Bench 2 (57.0%) and NL2Repo (39.8%).';
 const parsed=parseBenchmarkFeed(text,feed).get('minimax-m2.7');
 assert.equal(parsed.find(x=>x.benchmark_id==='swe-pro').score,56.22);
 assert.equal(parsed.find(x=>x.benchmark_id==='nl2repo').score,39.8);
});
