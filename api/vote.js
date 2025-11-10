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
    const { room = 'default', juryId, vote } = req.body;
    
    if (!juryId || !vote || (vote !== 'A' && vote !== 'B')) {
      return res.status(400).json({ error: 'Invalid vote' });
    }

    const key = `room:${room}:state`;
    let state = await kv.get(key);
    
    if (!state) {
      return res.status(404).json({ error: 'Game not started' });
    }

    if (!state.votes) {
      state.votes = {};
    }

    state.votes[juryId] = vote;
    await kv.set(key, state);

    return res.status(200).json({ success: true, message: '✅ Voto registrado' });
  } catch (error) {
    console.error('Error in /api/vote:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
