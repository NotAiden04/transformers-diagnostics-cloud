// /api/analyze.js - Snapshot summaries for live feed
export const config = { runtime: 'nodejs20.x' };

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { snapshot } = req.body || {};
    const sys = `You are an on-vehicle telemetry analyst for a pro tech. 
Given a single snapshot {rpm, speed_kph, coolant_c}, return a one- or two-sentence summary with any cautions.`;
    const user = `Snapshot: ${JSON.stringify(snapshot || {}, null, 2)}`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user }
        ]
      })
    });
    if (!r.ok) {
      const txt = await r.text();
      return res.status(500).json({ error: 'LLM error', detail: txt });
    }
    const data = await r.json();
    const summary = data.choices?.[0]?.message?.content || '';
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ summary });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
