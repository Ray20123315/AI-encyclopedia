import { openaiProvider } from './openai.js';
import { anthropicProvider } from './anthropic.js';
import { deepseekProvider } from './deepseek.js';
import { qwenProvider } from './qwen.js';
import { doubaoProvider } from './doubao.js';

export const PROVIDERS = [openaiProvider, anthropicProvider, deepseekProvider, qwenProvider, doubaoProvider];
