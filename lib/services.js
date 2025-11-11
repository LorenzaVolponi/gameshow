import { kv } from '@vercel/kv';
import Groq from 'groq-sdk';

let groqInstance = null;
let inMemoryKV = null;
let groqFallback = null;
let hasWarnedMissingKV = false;
let hasWarnedMissingGroqKey = false;

const hasKvConfig = Boolean(
  (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.KV_URL && process.env.KV_REST_API_TOKEN)
);

function cloneValue(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function createInMemoryKV() {
  const store = new Map();

  return {
    async get(key) {
      if (!store.has(key)) {
        return null;
      }
      return cloneValue(store.get(key));
    },
    async set(key, value) {
      store.set(key, cloneValue(value));
      return 'OK';
    },
    async del(key) {
      return store.delete(key) ? 1 : 0;
    },
    async delete(key) {
      return store.delete(key) ? 1 : 0;
    },
    async clear() {
      store.clear();
      return 'OK';
    }
  };
}

function getInMemoryKV() {
  if (!inMemoryKV) {
    inMemoryKV = createInMemoryKV();
    if (!hasWarnedMissingKV && process.env.NODE_ENV !== 'test') {
      hasWarnedMissingKV = true;
      console.warn(
        '[services] Using in-memory KV fallback. Set up Vercel KV to persist data across requests.'
      );
    }
  }

  return inMemoryKV;
}

function createGroqFallback() {
  const responses = [
    'Aplique uma análise prática do cenário atual e defina metas realistas. Ajustes graduais com acompanhamento quinzenal costumam gerar ganhos consistentes sem sobrecarregar a equipe.',
    'Foque em iniciativas com impacto direto nos indicadores principais. Projetos menores, com entregas mensais, dão visibilidade rápida e facilitam correções quando necessário.',
    'Mapeie os gargalos do processo e promova melhorias incrementais. Equipes que adotam ciclos curtos de feedback conseguem elevar a eficiência em torno de 20% em três meses.'
  ];

  if (!hasWarnedMissingGroqKey && process.env.NODE_ENV !== 'test') {
    hasWarnedMissingGroqKey = true;
    console.warn(
      '[services] GROQ_API_KEY ausente. Gerando respostas locais simuladas até que a chave seja configurada.'
    );
  }

  return {
    chat: {
      completions: {
        async create() {
          const choice = responses[Math.floor(Math.random() * responses.length)];
          return { choices: [{ message: { content: choice } }] };
        }
      }
    }
  };
}

export function getKV() {
  if (globalThis.mockKV) {
    return globalThis.mockKV;
  }

  if (hasKvConfig) {
    return kv;
  }

  return getInMemoryKV();
}

export function getGroq() {
  if (globalThis.mockGroq) {
    return globalThis.mockGroq;
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (apiKey) {
    if (!groqInstance) {
      groqInstance = new Groq({
        apiKey
      });
    }
    return groqInstance;
  }

  if (!groqFallback) {
    groqFallback = createGroqFallback();
  }

  return groqFallback;
}
