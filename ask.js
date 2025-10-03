// /api/ask.js - Serverless endpoint for Q&A with snapshot
// Runtime pinned for Vercel's current platform
export const config = { runtime: 'nodejs20.x' }; 
// Set env var on Vercel: OPENAI_API_KEY

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
    const { question, snapshot } = req.body || {};
    const sys = `You are a transmission/engine diagnostics assistant for a professional mechanic.
Use concise, actionable language. If data is missing, say what to log next.`;
    const user = `Question: ${question}
Snapshot: ${JSON.stringify(snapshot || {}, null, 2)}`;

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
    const answer = data.choices?.[0]?.message?.content || '';
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
