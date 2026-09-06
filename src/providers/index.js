import { openaiProvider } from './openai.js';
import { anthropicProvider } from './anthropic.js';
import { googleProvider } from './google.js';
import { xaiProvider } from './xai.js';
import { deepseekProvider } from './deepseek.js';
import { qwenProvider } from './qwen.js';
import { doubaoProvider } from './doubao.js';
import { moonshotProvider } from './moonshot.js';
import { zhipuProvider } from './zhipu.js';
import { tencentProvider } from './tencent.js';
import { minimaxProvider } from './minimax.js';
import { mistralProvider } from './mistral.js';
import { cohereProvider } from './cohere.js';
import { groqProvider } from './groq.js';
import { togetherProvider } from './together.js';
import { fireworksProvider } from './fireworks.js';

export const PROVIDERS = [
  openaiProvider, anthropicProvider, googleProvider, xaiProvider,
  deepseekProvider, qwenProvider, doubaoProvider, moonshotProvider,
  zhipuProvider, tencentProvider, minimaxProvider, mistralProvider, cohereProvider,
  groqProvider, togetherProvider, fireworksProvider
];
