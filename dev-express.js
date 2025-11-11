import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const mockKV = new Map();

const mockGroq = {
  chat: {
    completions: {
      create: async ({ messages }) => {
        const question = messages.find(m => m.role === 'user')?.content || '';
        const responses = [
          `Na minha experiência, o ideal é focar em automação de processos repetitivos. Isso pode aumentar a produtividade em até 30% nos primeiros 6 meses. Recomendo começar mapeando as tarefas que consomem mais tempo e implementar ferramentas específicas para cada uma.`,
          `Acredito que investir em capacitação da equipe traz retorno significativo. Estudos mostram que empresas que destinam pelo menos 5% do orçamento para treinamento veem um aumento de 20% no engajamento. É fundamental criar uma cultura de aprendizado contínuo.`,
          `Uma abordagem prática seria implementar metodologias ágeis. Cerca de 70% das empresas que adotaram Scrum reportaram melhoria na entrega de projetos. O segredo está em adaptar o framework à realidade da sua equipe, sem seguir regras rígidas.`
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        return {
          choices: [{
            message: {
              content: randomResponse
            }
          }]
        };
      }
    }
  }
};

const kvMock = {
  get: async (key) => {
    return mockKV.get(key) || null;
  },
  set: async (key, value) => {
    mockKV.set(key, value);
    return 'OK';
  }
};

async function adaptHandler(handlerPath, req, res) {
  try {
    const module = await import(handlerPath);
    const handler = module.default;

    const mockReq = {
      method: req.method,
      query: req.query,
      body: req.body,
      headers: req.headers
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => res.status(code).json(data),
        end: () => res.status(code).end()
      }),
      setHeader: (name, value) => res.setHeader(name, value),
      json: (data) => res.json(data),
      end: () => res.end()
    };

    global.mockKV = kvMock;
    global.mockGroq = mockGroq;

    await handler(mockReq, mockRes);
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({ error: error.message });
  }
}

app.all('/api/state', async (req, res) => {
  await adaptHandler('./api/state.js', req, res);
});

app.all('/api/update', async (req, res) => {
  await adaptHandler('./api/update.js', req, res);
});

app.all('/api/group', async (req, res) => {
  await adaptHandler('./api/group.js', req, res);
});

app.all('/api/ia', async (req, res) => {
  await adaptHandler('./api/ia.js', req, res);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Dev server running on http://0.0.0.0:${PORT}`);
  console.log(`\n📺 Host: http://localhost:${PORT}/`);
  console.log(`👥 Grupos: http://localhost:${PORT}/group.html?group=G1`);
  console.log(`\n📝 Using mock Vercel KV and Groq API\n`);
});
