import { getKV, getGroq } from '../lib/services.js';
import { parseJsonBody } from '../lib/http.js';

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

  let body;

  try {
    body = await parseJsonBody(req);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ error: error.message });
  }

  try {
    const kv = getKV();
    const groq = getGroq();
    const { room = 'default', question, context, saveToState = true } = body;
    
    if (!question) {
      return res.status(400).json({ error: 'Missing question' });
    }

    let userPrompt = question;
    if (context) {
      userPrompt = `${question}\n\nContexto: ${context}`;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um profissional experiente respondendo de forma natural e conversacional. Use números específicos, percentuais e dados concretos quando relevante (ex: "aumentar em 25%", "nos últimos 3 anos", "cerca de 40% das empresas"). Inclua exemplos práticos e argumentos bem fundamentados baseados no contexto. Escreva em parágrafos fluidos como um humano escreveria, sem listas ou bullet points. Mantenha tom profissional mas acessível. Seja conciso: máximo 350 caracteres.'
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.8,
      max_tokens: 400
    });

    const iaResponse = completion.choices[0]?.message?.content || '';

    if (saveToState) {
      const key = `room:${room}:state`;
      let state = await kv.get(key);
      
      if (!state) {
        console.warn('State not found, cannot save IA response');
      } else if (state.currentQuestion >= 0 && state.currentQuestion <= 3) {
        const questionKey = `q${state.currentQuestion}`;
        if (!state.responses[questionKey]) {
          state.responses[questionKey] = {};
        }
        state.responses[questionKey].IA = iaResponse;
        await kv.set(key, state);
      } else {
        console.warn('Invalid currentQuestion, cannot save IA response');
      }
    }

    return res.status(200).json({ success: true, ia: iaResponse });
  } catch (error) {
    console.error('Error in /api/ia:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
