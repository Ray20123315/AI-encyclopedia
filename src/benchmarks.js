const B = (benchmark_id, benchmark_name, score, extra={}) => ({ benchmark_id, benchmark_name, score, ...extra });

export const CURATED_BENCHMARKS = {
  'openai:gpt-6-astra': [
    B('arc-agi-3','ARC-AGI-3',99.9,{category:'抽象推理',setting:'官方 Astra 設定',tested_at:'2026-09',source_url:'https://openai.com/index/gpt-6-astra/',source_publisher:'OpenAI'}),
    B('frontiermath-t4-v2','FrontierMath Tier 4 v2',98,{category:'數學',setting:'官方 Astra 設定',tested_at:'2026-09',source_url:'https://openai.com/index/gpt-6-astra/',source_publisher:'OpenAI'}),
    B('automationbench','AutomationBench',41.4,{category:'代理／工具',setting:'官方 Astra 設定',tested_at:'2026-09',source_url:'https://openai.com/index/gpt-6-astra/',source_publisher:'OpenAI'}),
    B('benchcad','BenchCAD',95.9,{category:'專業工作',setting:'官方 Astra 設定',tested_at:'2026-09',source_url:'https://openai.com/index/gpt-6-astra/',source_publisher:'OpenAI'}),
    B('aa-intelligence-v4.1.1','Artificial Analysis Intelligence Index v4.1.1',61.2,{category:'綜合',unit:'指數',setting:'公開指數',tested_at:'2026-09',source_url:'https://openai.com/index/gpt-6-astra/',source_publisher:'OpenAI',source_type:'官方引用第三方'})
  ],
  'openai:gpt-5.6-sol': [
    B('gpqa-diamond','GPQA Diamond',94.6,{category:'科學推理',setting:'max / 官方評測設定',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'}),
    B('swe-bench-pro','SWE-Bench Pro',64.6,{category:'程式開發',setting:'Codex harness',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'}),
    B('deepswe-v1.1','DeepSWE v1.1',72.7,{category:'程式開發',setting:'Codex harness',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'}),
    B('terminal-bench-2.1','Terminal-Bench 2.1',88.8,{category:'代理／程式',setting:'Codex harness',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'}),
    B('aa-intelligence-v4.1','Artificial Analysis Intelligence Index v4.1',58.9,{category:'綜合',unit:'指數',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI',source_type:'官方引用第三方'})
  ],
  'openai:gpt-5.6-terra': [
    B('gpqa-diamond','GPQA Diamond',92.9,{category:'科學推理',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'}),
    B('deepswe-v1.1','DeepSWE v1.1',69.6,{category:'程式開發',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'}),
    B('terminal-bench-2.1','Terminal-Bench 2.1',87.4,{category:'代理／程式',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'})
  ],
  'openai:gpt-5.6-luna': [
    B('gpqa-diamond','GPQA Diamond',92.3,{category:'科學推理',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'}),
    B('deepswe-v1.1','DeepSWE v1.1',67.2,{category:'程式開發',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'}),
    B('terminal-bench-2.1','Terminal-Bench 2.1',84.7,{category:'代理／程式',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'})
  ],
  'openai:gpt-5.5': [
    B('gpqa-diamond','GPQA Diamond',93.6,{category:'科學推理',setting:'xhigh',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'}),
    B('deepswe-v1.1','DeepSWE v1.1',67,{category:'程式開發',setting:'Codex / xhigh',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'}),
    B('terminal-bench-2.1','Terminal-Bench 2.1',85.6,{category:'代理／程式',setting:'Codex / xhigh',tested_at:'2026-08',source_url:'https://openai.com/index/gpt-5-6/',source_publisher:'OpenAI'})
  ],
  'google:gemini-3.1-pro-preview': [
    B('gpqa-diamond','GPQA Diamond',94.3,{category:'科學推理',setting:'Thinking High、無工具',tested_at:'2026-02',source_url:'https://deepmind.google/models/model-cards/gemini-3-1-pro/',source_publisher:'Google DeepMind'}),
    B('arc-agi-2','ARC-AGI-2',77.1,{category:'抽象推理',setting:'ARC Prize Verified',tested_at:'2026-02',source_url:'https://deepmind.google/models/model-cards/gemini-3-1-pro/',source_publisher:'Google DeepMind'}),
    B('terminal-bench-2.0','Terminal-Bench 2.0',68.5,{category:'代理／程式',setting:'Terminus-2 harness',tested_at:'2026-02',source_url:'https://deepmind.google/models/model-cards/gemini-3-1-pro/',source_publisher:'Google DeepMind'}),
    B('swe-bench-verified','SWE-Bench Verified',80.6,{category:'程式開發',setting:'single attempt',tested_at:'2026-02',source_url:'https://deepmind.google/models/model-cards/gemini-3-1-pro/',source_publisher:'Google DeepMind'}),
    B('browsecomp','BrowseComp',85.9,{category:'代理／搜尋',setting:'Search + Python + Browse',tested_at:'2026-02',source_url:'https://deepmind.google/models/model-cards/gemini-3-1-pro/',source_publisher:'Google DeepMind'})
  ],
  'google:gemini-3.5-flash': [
    B('terminal-bench-2.1','Terminal-Bench 2.1',76.2,{category:'代理／程式',setting:'Terminus-2 harness',tested_at:'2026-05',source_url:'https://deepmind.google/models/model-cards/gemini-3-5-flash/',source_publisher:'Google DeepMind'}),
    B('swe-bench-pro','SWE-Bench Pro',55.1,{category:'程式開發',setting:'single attempt',tested_at:'2026-05',source_url:'https://deepmind.google/models/model-cards/gemini-3-5-flash/',source_publisher:'Google DeepMind'}),
    B('mcp-atlas','MCP Atlas',83.6,{category:'代理／工具',tested_at:'2026-05',source_url:'https://deepmind.google/models/model-cards/gemini-3-5-flash/',source_publisher:'Google DeepMind'}),
    B('toolathlon','Toolathlon',56.5,{category:'代理／工具',tested_at:'2026-05',source_url:'https://deepmind.google/models/model-cards/gemini-3-5-flash/',source_publisher:'Google DeepMind'})
  ],
  'xai:grok-4.6': [
    B('aa-intelligence','Artificial Analysis Intelligence Index',61,{category:'綜合',unit:'指數',setting:'High',tested_at:'2026-08',source_url:'https://x.ai/news/grok-4-6',source_publisher:'SpaceXAI',source_type:'官方引用第三方'}),
    B('gdpval-aa-v2','GDPVal-AA v2',1753,{category:'專業工作',unit:'Elo',setting:'High',tested_at:'2026-08',source_url:'https://x.ai/news/grok-4-6',source_publisher:'SpaceXAI'}),
    B('cursorbench-v3.2','CursorBench v3.2',69.9,{category:'程式開發',setting:'High',tested_at:'2026-08',source_url:'https://x.ai/news/grok-4-6',source_publisher:'SpaceXAI'}),
    B('deepswe-v1.1','DeepSWE v1.1',65.9,{category:'程式開發',setting:'High',tested_at:'2026-08',source_url:'https://x.ai/news/grok-4-6',source_publisher:'SpaceXAI'}),
    B('terminal-bench-3.0','Terminal-Bench 3.0',26,{category:'代理／程式',setting:'High',tested_at:'2026-08',source_url:'https://x.ai/news/grok-4-6',source_publisher:'SpaceXAI'})
  ],
  'xai:grok-4.5': [
    B('deepswe-v1.0','DeepSWE 1.0',62,{category:'程式開發',tested_at:'2026-07',source_url:'https://x.ai/news/grok-4-5',source_publisher:'SpaceXAI'})
  ],
  'xai:grok-4-1-fast-reasoning': [
    B('research-eval-reka','Research-Eval Reka',63.9,{category:'代理／搜尋',setting:'Agent Tools API',tested_at:'2025-11',source_url:'https://x.ai/news/grok-4-1-fast',source_publisher:'SpaceXAI'}),
    B('frames','FRAMES',87.6,{category:'搜尋／事實',setting:'Agent Tools API',tested_at:'2025-11',source_url:'https://x.ai/news/grok-4-1-fast',source_publisher:'SpaceXAI'}),
    B('x-browse','X Browse',56.3,{category:'代理／搜尋',setting:'Agent Tools API',tested_at:'2025-11',source_url:'https://x.ai/news/grok-4-1-fast',source_publisher:'SpaceXAI'}),
    B('bfcl-v4','Berkeley Function Calling v4',72,{category:'工具使用',tested_at:'2025-11',source_url:'https://x.ai/news/grok-4-1-fast',source_publisher:'SpaceXAI'})
  ],
  'moonshot:kimi-k3': [
    B('gpqa-diamond','GPQA Diamond',93.5,{category:'科學推理',setting:'max',tested_at:'2026-07',source_url:'https://github.com/MoonshotAI/Kimi-K3',source_publisher:'Moonshot AI'}),
    B('deepswe-v1.1','DeepSWE v1.1',67.5,{category:'程式開發',setting:'Kimi Code / max',tested_at:'2026-07',source_url:'https://github.com/MoonshotAI/Kimi-K3',source_publisher:'Moonshot AI'}),
    B('terminal-bench-2.1','Terminal-Bench 2.1',88.3,{category:'代理／程式',setting:'Kimi Code / max',tested_at:'2026-07',source_url:'https://github.com/MoonshotAI/Kimi-K3',source_publisher:'Moonshot AI'}),
    B('frontierswe','FrontierSWE',81.2,{category:'程式開發',setting:'Kimi Code / max',tested_at:'2026-07',source_url:'https://github.com/MoonshotAI/Kimi-K3',source_publisher:'Moonshot AI'}),
    B('browsecomp','BrowseComp',91.2,{category:'代理／搜尋',setting:'max',tested_at:'2026-07',source_url:'https://github.com/MoonshotAI/Kimi-K3',source_publisher:'Moonshot AI'}),
    B('gdpval-aa-v2','GDPVal-AA v2',1686,{category:'專業工作',unit:'Elo',setting:'max',tested_at:'2026-07',source_url:'https://github.com/MoonshotAI/Kimi-K3',source_publisher:'Moonshot AI'})
  ],
  'qwen:qwen3-235b-a22b-instruct-2507': [
    B('arc-agi-1','ARC-AGI 1',40.75,{category:'抽象推理',setting:'pass@1 / 官方重現',source_url:'https://github.com/QwenLM/Qwen3/blob/main/eval/README.md',source_publisher:'Qwen Team'})
  ],
  'tencent:hy4-preview': [
    B('tencent-engineering-blind','騰訊內部工程任務盲測',2.99,{category:'專業工作',unit:'/4',setting:'163 位內部專家、203 個真實工程任務',tested_at:'2026-08',source_url:'https://github.com/Tencent-Hunyuan/Hy4-preview',source_publisher:'Tencent Hy',note:'此分數為內部專家盲測平均，不可與百分比 benchmark 直接比較。'})
  ],
  'minimax:minimax-m2.7': [
    B('mle-bench-lite','MLE Bench Lite',66.6,{category:'機器學習',unit:'% medal rate',tested_at:'2026-04',source_url:'https://github.com/MiniMax-AI/MiniMax-M2.7',source_publisher:'MiniMax'}),
    B('swe-pro','SWE-Pro',56.22,{category:'程式開發',tested_at:'2026-04',source_url:'https://github.com/MiniMax-AI/MiniMax-M2.7',source_publisher:'MiniMax'}),
    B('swe-multilingual','SWE Multilingual',76.5,{category:'程式開發',tested_at:'2026-04',source_url:'https://github.com/MiniMax-AI/MiniMax-M2.7',source_publisher:'MiniMax'}),
    B('terminal-bench-2','Terminal Bench 2',57,{category:'代理／程式',tested_at:'2026-04',source_url:'https://github.com/MiniMax-AI/MiniMax-M2.7',source_publisher:'MiniMax'}),
    B('gdpval-aa','GDPVal-AA',1495,{category:'專業工作',unit:'Elo',tested_at:'2026-04',source_url:'https://github.com/MiniMax-AI/MiniMax-M2.7',source_publisher:'MiniMax'})
  ],
  'cohere:command-a-plus': [
    B('tau2-telecom','τ²-Bench Telecom',85,{category:'代理／工具',tested_at:'2026-06',source_url:'https://cohere.com/blog/command-a-plus',source_publisher:'Cohere'}),
    B('terminal-bench-hard','Terminal-Bench Hard',25,{category:'代理／程式',tested_at:'2026-06',source_url:'https://cohere.com/blog/command-a-plus',source_publisher:'Cohere'})
  ]
};

export function curatedBenchmarks(providerId, modelId) {
  return CURATED_BENCHMARKS[`${providerId}:${modelId}`] || [];
}
