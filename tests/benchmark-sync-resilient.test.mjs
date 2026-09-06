import test from 'node:test';
import assert from 'node:assert/strict';
import { benchmarkFeedsForProvider } from '../src/benchmarks-auto.js';
import { htmlTablesToPipeText, parseBenchmarkFeedResilient } from '../src/benchmark-sync.js';

test('HTML 表格可保留同一列欄位，供 Kimi/Google/OpenAI 類頁面解析',()=>{
  const html='<table><tr><th>Benchmark</th><th>Kimi K3<br>(max)</th><th>GPT-5.6 Sol</th></tr><tr><td>GPQA Diamond</td><td>93.5</td><td>94.1</td></tr><tr><td>Terminal-Bench 2.1</td><td>88.3</td><td>88.8</td></tr></table>';
  const pipe=htmlTablesToPipeText(html);
  assert.match(pipe,/Benchmark \| Kimi K3 \(max\) \| GPT-5\.6 Sol/);
  const feed=benchmarkFeedsForProvider('moonshot').find(x=>x.id==='kimi-k3');
  const parsed=parseBenchmarkFeedResilient(html,feed);
  assert.equal(parsed.get('kimi-k3')?.find(x=>x.benchmark_id==='gpqa-diamond')?.score,93.5);
  assert.equal(parsed.get('kimi-k3')?.find(x=>x.benchmark_id==='terminal-bench-2.1')?.score,88.3);
});

test('Qwen 可解析「模型在列、分數在最後欄」的官方可重現評測表',()=>{
  const md='| Model | Dataset | Config | Reproduced Score |\n|---|---|---|---|\n| Qwen3-235B-A22B-Instruct-2507 | ARC-AGI 1 (pass@1) | ./config.yaml | 40.75 |';
  const feed=benchmarkFeedsForProvider('qwen').find(x=>x.id==='qwen3-eval');
  const parsed=parseBenchmarkFeedResilient(md,feed);
  assert.equal(parsed.get('qwen3-235b-a22b-instruct-2507')?.[0]?.score,40.75);
});

test('Cohere 文章式評測可抓改善後分數',()=>{
  const text='Compared with Command A Reasoning, τ²-Bench Telecom scores improved from 37% to 85%, with agentic coding performance on Terminal-Bench Hard reaching 25% from 3%. MathVista scores increased from 73.5% to 80.6%, and CharXiv reasoning improved from 46.9% to 52.7%. Command A+ achieved 63% on MMMU Pro and 75.1% on MMMU. Command A+ achieved a score of 37 on the Artificial Analysis Intelligence Index.';
  const feed=benchmarkFeedsForProvider('cohere').find(x=>x.id==='cohere-command-a-plus');
  const parsed=parseBenchmarkFeedResilient(text,feed).get('command-a-plus-05-2026')||[];
  const byId=new Map(parsed.map(x=>[x.benchmark_id,x.score]));
  assert.equal(byId.get('tau2-telecom'),85);
  assert.equal(byId.get('terminal-bench-hard'),25);
  assert.equal(byId.get('mathvista'),80.6);
  assert.equal(byId.get('charxiv-reasoning'),52.7);
  assert.equal(byId.get('aa-intelligence'),37);
});
