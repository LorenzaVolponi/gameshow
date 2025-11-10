import { getKV } from '../lib/services.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const kv = getKV();
    const { room = 'default', group, response } = req.body;
    
    if (!group || !response) {
      return res.status(400).json({ error: 'Missing group or response' });
    }

    const key = `room:${room}:state`;
    let state = await kv.get(key);
    
    if (!state) {
      return res.status(404).json({ error: 'Game not started' });
    }

    if (!state.responses) {
      state.responses = {};
    }

    state.responses[group] = response;
    await kv.set(key, state);

    return res.status(200).json({ success: true, message: '✅ Resposta enviada' });
  } catch (error) {
    console.error('Error in /api/group:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
