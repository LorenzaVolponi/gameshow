import { kv } from '@vercel/kv';
import Groq from 'groq-sdk';

let groqInstance = null;

export function getKV() {
  if (globalThis.mockKV) {
    return globalThis.mockKV;
  }
  return kv;
}

export function getGroq() {
  if (globalThis.mockGroq) {
    return globalThis.mockGroq;
  }
  
  if (!groqInstance) {
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY || ''
    });
  }
  
  return groqInstance;
}
