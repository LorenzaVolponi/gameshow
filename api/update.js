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
        questions: ['', '', '', ''],
        currentQuestion: -1,
        responses: {
          q0: {},
          q1: {},
          q2: {},
          q3: {}
        },
        revealed: {
          q0: false,
          q1: false,
          q2: false,
          q3: false
        }
      };
    }

    Object.keys(updates).forEach(updateKey => {
      if (updateKey === 'responses' && typeof updates[updateKey] === 'object') {
        Object.keys(updates.responses).forEach(qKey => {
          const updateValue = updates.responses[qKey];
          if (Object.keys(updateValue).length === 0) {
            state.responses[qKey] = {};
          } else {
            if (!state.responses[qKey]) {
              state.responses[qKey] = {};
            }
            state.responses[qKey] = {
              ...state.responses[qKey],
              ...updateValue
            };
          }
        });
      } else if (updateKey === 'revealed' && typeof updates[updateKey] === 'object') {
        state.revealed = { ...state.revealed, ...updates[updateKey] };
      } else {
        state[updateKey] = updates[updateKey];
      }
    });
    
    await kv.set(key, state);

    return res.status(200).json({ success: true, state });
  } catch (error) {
    console.error('Error in /api/update:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
