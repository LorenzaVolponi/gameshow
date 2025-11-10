# Conselheiro vs Máquina

Sistema web interativo onde grupos competem com respostas geradas por IA (LLaMA 3.1-70b via Groq), e um júri vota sem saber qual é humana ou artificial.

## Visão Geral

Sistema de votação em tempo real com três perfis:
- **Host** (index.html): Controla as 5 rodadas (P1-P5), gera IA, embaralha respostas, revela resultados
- **Grupos G1-G9** (group.html): Enviam respostas em texto
- **Júri** (vote.html): Vota entre A ou B sem saber a origem

## Arquitetura Técnica

- **Frontend**: HTML5 + CSS + JavaScript puro (zero frameworks)
- **Backend**: Vercel Serverless Functions (Node.js 18+)
- **Database**: Vercel KV (Redis)
- **IA**: Groq API (LLaMA 3.1-70b-versatile)
- **Sync**: Polling HTTP (1.5s) - sem WebSocket

## Estrutura do Projeto

```
/
├── index.html           # Painel Host (TV/Desktop)
├── join.html           # Seleção de Grupo (G1-G9)
├── join-jury.html      # Seleção de Júri (J1-J12)
├── group.html          # Interface Grupos (Mobile)
├── vote.html           # Interface Júri (Mobile)
├── qr.html             # QR Codes dos Grupos
├── qr-jury.html        # QR Codes do Júri
├── api/
│   ├── state.js        # GET estado global
│   ├── update.js       # POST atualizar estado
│   ├── group.js        # POST resposta do grupo
│   ├── vote.js         # POST voto do júri
│   └── ia.js           # POST gerar resposta IA
├── lib/
│   └── services.js     # Abstração KV/Groq (dev/prod)
├── dev-express.js      # Servidor dev com mocks
├── package.json
├── vercel.json
└── .gitignore
```

## Estado Global (Vercel KV)

Chave: `room:${room}:state`

```json
{
  "round": 1-5,
  "question": "Pergunta atual",
  "ia": "Resposta gerada pela IA",
  "responses": { "G1": "...", "G2": "..." },
  "mapping": { "A": "IA", "B": "G3" },
  "votes": { "J1": "A", "J2": "B" },
  "reveal": "revealed"
}
```

## Fluxo de Jogo

### P1 a P5 (5 Rodadas)

1. **Host**: Inicia jogo → Define pergunta
2. **Grupos**: Enviam respostas via polling
3. **Host**: Gera resposta da IA (Groq LLaMA)
4. **Host**: Embaralha A/B (randomiza IA + 1 grupo humano)
5. **Júri**: Vota em A ou B
6. **Host**: Revela quem é IA vs Humano
7. **Host**: Avança para próxima rodada
8. Repete até P5 → Finaliza

## Configuração para Deploy

### Variáveis de Ambiente (Vercel)

```bash
GROQ_API_KEY=gsk_...
KV_REST_API_URL=https://...  # Auto-configurado pelo Vercel
KV_REST_API_TOKEN=...        # Auto-configurado pelo Vercel
```

### Deploy no Vercel

```bash
npm install -g vercel
vercel login
vercel
```

### Desenvolvimento Local (Replit)

```bash
npm install
vercel dev --listen 5000
```

## URLs de Acesso

### Painel Principal
- **Host**: `https://seu-dominio.vercel.app/`

### Acesso via QR Code (Recomendado)
1. Host acessa: `https://seu-dominio.vercel.app/qr.html` (Gera QR codes dos grupos)
2. Host acessa: `https://seu-dominio.vercel.app/qr-jury.html` (Gera QR codes do júri)
3. Participantes escaneiam o QR code
4. Selecionam seu número (G1-G9 ou J1-J12)
5. São automaticamente redirecionados para suas interfaces

### Acesso Direto (Alternativo)
- **Seleção Grupo**: `https://seu-dominio.vercel.app/join.html`
- **Seleção Júri**: `https://seu-dominio.vercel.app/join-jury.html`
- **Grupo direto**: `https://seu-dominio.vercel.app/group.html?group=G1` (G1 a G9)
- **Júri direto**: `https://seu-dominio.vercel.app/vote.html?jury=J1` (J1 a J12)

## APIs Serverless

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/state` | GET | Retorna estado atual da sala |
| `/api/update` | POST | Atualiza campos do estado |
| `/api/group` | POST | Grupo envia resposta |
| `/api/vote` | POST | Júri registra voto A/B |
| `/api/ia` | POST | Gera resposta IA via Groq |

## Prompt da IA (Groq)

**System Prompt:**
```
Responda sem linguagem humana, sem expressões emocionais, sem coloquialismos. 
Use tópicos estratégicos e técnicos.
```

**Modelo:** `llama-3.1-70b-versatile`

## Alterações Recentes

- 2025-11-10: **Sistema completo de QR codes**
  - Páginas join.html e join-jury.html para seleção de grupos/júri
  - Páginas qr.html e qr-jury.html para geração de QR codes
  - Validação robusta com localStorage e redirecionamento automático
  - Suporte para G1-G9 (grupos) e J1-J12 (júri)
- 2025-11-10: **Servidor dev Express com mocks**
  - dev-express.js para desenvolvimento local sem Vercel CLI
  - lib/services.js abstrai KV/Groq para funcionar em dev e prod
  - Mocks simulados de Vercel KV e Groq API
- 2025-11-10: Criação inicial do sistema completo
  - Implementação de polling HTTP (1500ms)
  - Integração Groq API para geração de respostas IA
  - Sistema de embaralhamento randomizado A/B
  - Controle de 5 rodadas sequenciais P1-P5

## Preferências do Usuário

- Código minimalista e limpo
- Zero frameworks no frontend
- Foco em estabilidade e clareza
- Deploy no Vercel
