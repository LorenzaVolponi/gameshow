# Conselheiro vs Máquina

Sistema web interativo onde grupos (G1-G9) competem com respostas geradas por IA (LLaMA 3.1-70b via Groq). O jogo usa 4 perguntas pré-definidas e revela quais respostas são humanas vs artificiais.

## Visão Geral

Sistema de respostas em tempo real com dois perfis:
- **Host** (index.html): Configura 4 perguntas, navega entre elas, gera IA (opcional), revela resultados
- **Grupos G1-G9** (group.html): Enviam respostas baseadas em contexto do QR code, com opção de gerar com IA

## Arquitetura Técnica

- **Frontend**: HTML5 + CSS + JavaScript puro (zero frameworks)
- **Backend**: Vercel Serverless Functions (Node.js 18+)
- **Database**: Vercel KV (Redis)
- **IA**: Groq API (LLaMA 3.1-70b-versatile)
- **Sync**: Polling HTTP (500ms) - sem WebSocket

## Estrutura do Projeto

```
/
├── index.html           # Painel Host (TV/Desktop)
├── join.html           # Seleção de Grupo (G1-G9)
├── group.html          # Interface Grupos (Mobile)
├── qr.html             # QR Codes dos Grupos
├── api/
│   ├── state.js        # GET estado global
│   ├── update.js       # POST atualizar estado
│   ├── group.js        # POST resposta do grupo
│   └── ia.js           # POST gerar resposta IA (com contexto)
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
  "questions": ["Q1", "Q2", "Q3", "Q4"],
  "currentQuestion": 0,
  "responses": {
    "q0": {"G1": "...", "G2": "...", "IA": "..."},
    "q1": {"G3": "...", "IA": "..."},
    "q2": {},
    "q3": {}
  },
  "revealed": {
    "q0": true,
    "q1": false,
    "q2": false,
    "q3": false
  }
}
```

## Fluxo de Jogo

### Configuração + 4 Perguntas

1. **Host**: Configura 4 perguntas ANTES de iniciar o jogo
2. **Host**: Inicia jogo → vai para Pergunta 1 (currentQuestion=0)
3. **Grupos**: Veem pergunta + contexto específico do QR code
4. **Grupos**: Opção A: Escrever resposta manual
5. **Grupos**: Opção B: Gerar resposta COM IA (usa contexto + pergunta)
6. **Grupos**: Enviam resposta (manual ou editada após IA)
7. **Host**: (Opcional) Gera resposta da IA como concorrente
8. **Host**: Revela quais respostas são IA vs Humano (SEM votos)
9. **Host**: Avança para Pergunta 2
10. Repete até Pergunta 4 → Finaliza

## Contextos dos Grupos (QR Code)

Cada grupo tem um contexto específico que influencia suas respostas:

- **G1**: Consultor de TI especializado em transformação digital para pequenas empresas
- **G2**: Gerente de recursos humanos de uma startup em crescimento com 50 funcionários
- **G3**: Diretor financeiro de uma empresa de médio porte do setor de varejo
- **G4**: Profissional de marketing digital trabalhando em uma agência criativa
- **G5**: Engenheiro de software líder técnico em uma empresa de tecnologia
- **G6**: Empreendedor que acabou de lançar um negócio no setor de alimentos
- **G7**: Coordenador de logística em uma empresa de e-commerce
- **G8**: Professor universitário de administração e gestão de negócios
- **G9**: Analista de dados trabalhando no setor de saúde

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
2. Participantes escaneiam o QR code
3. Selecionam seu número (G1-G9)
4. São automaticamente redirecionados para suas interfaces

### Acesso Direto (Alternativo)
- **Seleção Grupo**: `https://seu-dominio.vercel.app/join.html`
- **Grupo direto**: `https://seu-dominio.vercel.app/group.html?group=G1` (G1 a G9)

## APIs Serverless

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/state` | GET | Retorna estado atual da sala |
| `/api/update` | POST | Atualiza campos do estado (deep merge para responses) |
| `/api/group` | POST | Grupo envia resposta para pergunta atual |
| `/api/ia` | POST | Gera resposta IA via Groq (com contexto opcional) |

### Exemplo: Gerar IA com Contexto

```javascript
// Grupo gera resposta COM IA (não salva no estado global)
POST /api/ia
{
  "room": "default",
  "question": "Como melhorar produtividade?",
  "context": "Você é um consultor de TI...",
  "saveToState": false  // Retorna apenas a resposta
}

// Host gera IA como concorrente (salva no estado global)
POST /api/ia
{
  "room": "default",
  "question": "Como melhorar produtividade?",
  "saveToState": true  // Salva em responses[qX].IA
}
```

## Prompt da IA (Groq)

**System Prompt:**
```
Responda sem linguagem humana, sem expressões emocionais, sem coloquialismos. 
Use tópicos estratégicos e técnicos.
```

**User Prompt (com contexto):**
```
{pergunta}

Contexto: {contexto_do_grupo}
```

**Modelo:** `llama-3.1-70b-versatile`

## Alterações Recentes

- 2025-11-11: **✅ REESTRUTURAÇÃO COMPLETA DO SISTEMA**
  - **Mudança de 5 rodadas dinâmicas para 4 perguntas pré-definidas**
  - **Remoção completa do sistema de votação**: sem júri, sem mapping, sem votos
  - **Novo estado global**: questions[], currentQuestion, responses.qX, revealed.qX
  - **Contexto do QR code**: cada grupo tem contexto específico
  - **Botão "Gerar com IA"**: grupos podem gerar respostas assistidas por IA
  - **APIs refatoradas**: state.js, update.js (deep merge), group.js, ia.js (contexto)
  - **Frontend completo**: index.html (config + navegação), group.html (contexto + IA)
  - **Defensive guards**: proteção contra estado malformado
  - **Migração automática**: estado legado convertido automaticamente
  - **Validado pelo arquiteto**: TODOS os componentes aprovados
  - **Testado end-to-end**: fluxo completo funcionando perfeitamente

- 2025-11-11: **✅ CORREÇÕES CRÍTICAS - Sistema totalmente otimizado**
  - **Travamento de digitação RESOLVIDO**: typing guards com lastServerResponse
  - **Proteção de draft completa**: edições não enviadas preservadas durante polling
  - **Mudança de rodada corrigida**: textarea sempre limpo em nova rodada
  - **Interface do host reorganizada**: 
    - IA e respostas humanas unificadas em "Respostas da Rodada"
    - Contador de caracteres (0/500) com feedback visual vermelho > 90%
    - Controles visíveis após reload mid-round
  - **Polling inteligente**: pausa apenas durante digitação real, não no focus
  - **Validado pelo arquiteto**: TODAS as correções aprovadas

- 2025-11-10: **✅ Sistema completo e testado - PRONTO PARA PRODUÇÃO**
  - Correção de bugs no celular: scroll, overflow, margin, textarea
  - Melhorias na interface do host: design limpo, sections coloridas, spacing melhorado
  - Correção completa do reveal: percentual de votos, total de votos, badges IA/Humano
  - Melhorias no júri: response cards, word-wrap, loading states
  - Otimização de sincronização: polling 500ms, retry automático, feedback visual
  - Validado pelo arquiteto: todos os requisitos atendidos

## Preferências do Usuário

- Código minimalista e limpo
- Zero frameworks no frontend
- Foco em estabilidade e clareza
- Deploy no Vercel
