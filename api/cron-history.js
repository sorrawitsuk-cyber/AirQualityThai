import { refreshHistoryCache } from './weather-history.js';

export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return res.status(500).json({ error: 'CRON_SECRET is not configured' });
  if (req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[cron-history] Starting historical weather cache refresh...');
    const data = await refreshHistoryCache();
    console.log(`[cron-history] Done - period: ${data.period?.startDate} to ${data.period?.endDate}`);
    return res.status(200).json({
      success: true,
      updatedAt: data.updatedAt,
      period: data.period,
      provinces: Object.keys(data.byProvince || {}).length,
    });
  } catch (err) {
    console.error('[cron-history] Failed:', err.message);
    return res.status(500).json({ success: false, error: err.message?.slice(0, 200) });
  }
}
