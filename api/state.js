import { getKV } from '../lib/services.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const kv = getKV();
    const { room = 'default' } = req.query;
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
      await kv.set(key, state);
    }

    return res.status(200).json(state);
  } catch (error) {
    console.error('Error in /api/state:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
