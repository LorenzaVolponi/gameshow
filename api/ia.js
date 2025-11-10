import { getKV, getGroq } from '../lib/services.js';

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
    const groq = getGroq();
    const { room = 'default', question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Missing question' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Responda sem linguagem humana, sem expressões emocionais, sem coloquialismos. Use tópicos estratégicos e técnicos.'
        },
        {
          role: 'user',
          content: question
        }
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 500
    });

    const iaResponse = completion.choices[0]?.message?.content || '';

    const key = `room:${room}:state`;
    let state = await kv.get(key);
    
    if (state) {
      state.ia = iaResponse;
      await kv.set(key, state);
    }

    return res.status(200).json({ success: true, ia: iaResponse });
  } catch (error) {
    console.error('Error in /api/ia:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
