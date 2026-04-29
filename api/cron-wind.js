import { runWindAnalysis, writeFirebaseCache } from './_wind-core.js';

export default async function handler(req, res) {
  // Vercel cron injects Authorization: Bearer <CRON_SECRET>
  const expected = process.env.CRON_SECRET;
  if (expected && req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    console.log('[cron-wind] Starting scheduled wind analysis...');
    const data = await runWindAnalysis(apiKey);
    await writeFirebaseCache(data);
    console.log(`[cron-wind] Done — model: ${data.model}, tmdAvailable: ${data.tmdAvailable}`);
    return res.status(200).json({ success: true, model: data.model, cachedAt: data.cachedAt });
  } catch (err) {
    console.error('[cron-wind] Failed:', err.message);
    return res.status(500).json({ success: false, error: err.message?.slice(0, 200) });
  }
}
