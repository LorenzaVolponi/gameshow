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
    const { room = 'default', updates } = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const key = `room:${room}:state`;
    let state = await kv.get(key);
    
    if (!state) {
      state = {
        round: 0,
        question: '',
        ia: '',
        responses: {},
        mapping: {},
        votes: {},
        reveal: ''
      };
    }

    state = { ...state, ...updates };
    await kv.set(key, state);

    return res.status(200).json({ success: true, state });
  } catch (error) {
    console.error('Error in /api/update:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
