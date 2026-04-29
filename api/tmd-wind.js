import { CACHE_TTL, readFirebaseCache, writeFirebaseCache, runWindAnalysis, buildFallbackData, withTimeout } from './_wind-core.js';

// L1: in-memory (per instance, fastest)
let _memCache = null;
let _memCacheAt = 0;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  // L1: in-memory cache (instant, no network)
  if (_memCache && Date.now() - _memCacheAt < CACHE_TTL) {
    res.setHeader('Cache-Control', 'public, s-maxage=10800, stale-while-revalidate=1800');
    return res.status(200).json(_memCache);
  }

  // L2: Firebase cache (shared across all serverless instances, persists cold starts)
  const fbData = await readFirebaseCache();
  if (fbData) {
    _memCache = fbData;
    _memCacheAt = Date.now();
    res.setHeader('Cache-Control', 'public, s-maxage=10800, stale-while-revalidate=1800');
    return res.status(200).json(fbData);
  }

  // L3: Gemini API — last resort if both caches miss (cron should prevent this)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallback = buildFallbackData(0);
    return res.status(200).json(fallback);
  }

  try {
    console.warn('[tmd-wind] Cache miss — calling Gemini (cron may not be running)');
    const data = await withTimeout(runWindAnalysis(apiKey), 28000);
    _memCache = data;
    _memCacheAt = Date.now();
    writeFirebaseCache(data); // fire-and-forget: warm up cache for other instances
    res.setHeader('Cache-Control', 'public, s-maxage=10800, stale-while-revalidate=1800');
    return res.status(200).json(data);
  } catch (err) {
    console.error('[tmd-wind] Gemini failed:', err.message?.slice(0, 200));
    const fallback = buildFallbackData(0);
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=120');
    return res.status(200).json(fallback);
  }
}
