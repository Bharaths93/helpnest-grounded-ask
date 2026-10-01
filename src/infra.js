import 'dotenv/config';
import OpenAI from 'openai';
import pg from 'pg';
import Redis from 'ioredis';
import { createHash } from 'node:crypto';

for (const key of ['DATABASE_URL', 'REDIS_URL', 'OPENAI_API_KEY', 'GENERATION_MODEL']) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
export const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
export const generationModel = process.env.GENERATION_MODEL;
export const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
redis.on('error', error => console.error('Redis connection error:', error.message));
export const llm = new OpenAI({ timeout: 30000, maxRetries: 1 });

export async function embed(text) {
  const key = 'emb:' + embeddingModel + ':' + createHash('sha256').update(text).digest('hex');
  let cached;
  try { cached = await redis.get(key); } catch { /* Cache unavailable: continue. */ }
  if (cached) return JSON.parse(cached);
  const result = await llm.embeddings.create({ model: embeddingModel, input: text });
  const vector = result.data[0].embedding;
  try { await redis.set(key, JSON.stringify(vector)); } catch { /* Cache is optional. */ }
  return vector;
}
