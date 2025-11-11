import { getKV } from '../lib/services.js';
import { parseJsonBody, createApiHandler } from '../lib/http.js';

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;

  try {
    body = await parseJsonBody(req);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ error: error.message });
  }

  try {
    const kv = getKV();
    const { room = 'default', group, response } = body;
    
    if (!group || !response) {
      return res.status(400).json({ error: 'Missing group or response' });
    }

    const key = `room:${room}:state`;
    let state = await kv.get(key);
    
    if (!state) {
      return res.status(404).json({ error: 'Game not started' });
    }

    if (state.currentQuestion < 0 || state.currentQuestion > 3) {
      return res.status(400).json({ error: 'No active question' });
    }

    const questionKey = `q${state.currentQuestion}`;
    
    if (!state.responses[questionKey]) {
      state.responses[questionKey] = {};
    }

    state.responses[questionKey][group] = response;
    await kv.set(key, state);

    return res.status(200).json({ success: true, message: '✅ Resposta enviada' });
  } catch (error) {
    console.error('Error in /api/group:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default createApiHandler(handler);
