# 🚀 Guia de Deploy no Vercel

Deploy do sistema "Conselheiro vs Máquina" na plataforma Vercel.

---

## 📋 Pré-requisitos

Antes de fazer o deploy, certifique-se de ter:

1. **Conta Vercel** (gratuita): https://vercel.com/signup
2. **Vercel CLI** instalado (opcional, mas recomendado):
   ```bash
   npm install -g vercel
   ```
3. **Chave API Groq** (LLaMA 3.1-70b):
   - Criar conta gratuita: https://console.groq.com/
   - Gerar API key em "API Keys"
   - Guardar a chave `gsk_...` com segurança

---

## 🔧 Configuração Inicial

### 1. Preparar o Projeto

Certifique-se de que os seguintes arquivos estão presentes:

```
/
├── index.html
├── join.html
├── group.html
├── qr.html
├── api/
│   ├── state.js
│   ├── update.js
│   ├── group.js
│   └── ia.js
├── lib/
│   └── services.js
├── package.json
├── vercel.json
└── .gitignore
```

### 2. Verificar `vercel.json`

O arquivo `vercel.json` já está configurado para Serverless Functions:

```json
{
  "functions": {
    "api/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

---

## 🚀 Opção 1: Deploy via Vercel CLI (Recomendado)

### Passo 1: Login no Vercel

```bash
vercel login
```

### Passo 2: Deploy Inicial

No diretório do projeto, execute:

```bash
vercel
```

Responda às perguntas:

- **Set up and deploy?** → Yes
- **Which scope?** → Sua conta pessoal ou team
- **Link to existing project?** → No (primeira vez)
- **What's your project's name?** → `conselheiro-vs-maquina` (ou outro nome)
- **In which directory is your code located?** → `./` (Enter)

### Passo 3: Configurar Vercel KV (Banco de Dados)

1. Acesse o dashboard: https://vercel.com/dashboard
2. Selecione seu projeto `conselheiro-vs-maquina`
3. Vá em **Storage** → **Create Database** → **KV**
4. Nome: `conselheiro-kv` (ou outro)
5. Clique em **Create**
6. Conecte ao projeto quando solicitado

**Importante:** O Vercel automaticamente configura as variáveis:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### Passo 4: Adicionar Variável GROQ_API_KEY

No dashboard do projeto:

1. Vá em **Settings** → **Environment Variables**
2. Clique em **Add**:
   - **Name:** `GROQ_API_KEY`
   - **Value:** `gsk_...` (sua chave Groq)
   - **Environments:** Production, Preview, Development (marcar todos)
3. Clique em **Save**

### Passo 5: Deploy Final

```bash
vercel --prod
```

Seu app estará disponível em:
```
https://conselheiro-vs-maquina.vercel.app
```

---

## 🌐 Opção 2: Deploy via Dashboard Vercel

### Passo 1: Importar Projeto

1. Acesse: https://vercel.com/new
2. Conecte seu GitHub/GitLab/Bitbucket (ou use "Import Third-Party Git Repository")
3. Selecione o repositório do projeto
4. Clique em **Import**

### Passo 2: Configurar Build Settings

Vercel detecta automaticamente Node.js. Deixe as configurações padrão:

- **Framework Preset:** Other
- **Build Command:** (vazio)
- **Output Directory:** (vazio)
- **Install Command:** `npm install`

### Passo 3: Adicionar Environment Variables

Antes de fazer deploy, clique em **Environment Variables**:

1. Adicione `GROQ_API_KEY`:
   - **Name:** `GROQ_API_KEY`
   - **Value:** `gsk_...`
   - **Environments:** Production, Preview, Development

2. Clique em **Deploy**

### Passo 4: Criar Vercel KV

Após o deploy inicial:

1. Vá em **Storage** → **Create Database** → **KV**
2. Nome: `conselheiro-kv`
3. Conecte ao projeto
4. Vercel adicionará automaticamente `KV_REST_API_URL` e `KV_REST_API_TOKEN`

### Passo 5: Redeploy

Com o KV configurado, refaça o deploy:

1. Vá em **Deployments**
2. Selecione o deploy mais recente
3. Clique nos 3 pontinhos → **Redeploy**

---

## ✅ Verificação Pós-Deploy

### 1. Testar URLs Principais

Acesse no navegador:

```
✅ Host Panel: https://seu-dominio.vercel.app/
✅ Seleção Grupo: https://seu-dominio.vercel.app/join.html
✅ QR Codes: https://seu-dominio.vercel.app/qr.html
✅ Grupo direto: https://seu-dominio.vercel.app/group.html?group=G1
```

### 2. Testar Fluxo Completo

1. **Host:** Configurar 4 perguntas + Iniciar Jogo
2. **Grupo (mobile):** Escanear QR ou acessar `group.html?group=G1`
3. **Grupo:** Enviar resposta ou gerar com IA
4. **Host:** Gerar resposta da IA (opcional)
5. **Host:** Revelar resultados
6. **Host:** Avançar para próxima pergunta

### 3. Verificar Logs

No dashboard Vercel:

1. Vá em **Deployments** → Último deploy → **Function Logs**
2. Execute ações no app
3. Verifique se não há erros (500, 404, etc)

---

## 🔍 Troubleshooting

### Erro: "IA generation failed"

**Causa:** `GROQ_API_KEY` não configurada ou inválida.

**Solução:**
1. Vá em **Settings** → **Environment Variables**
2. Verifique se `GROQ_API_KEY` existe e está correta
3. Regenere a chave no console Groq se necessário
4. Redeploy o projeto

### Erro: "Failed to fetch state"

**Causa:** Vercel KV não configurado.

**Solução:**
1. Vá em **Storage** → Verifique se o KV existe
2. Se não, crie um novo: **Create Database** → **KV**
3. Conecte ao projeto
4. Redeploy

### Erro: "405 Method Not Allowed"

**Causa:** Requisições POST não estão chegando às Serverless Functions.

**Solução:**
1. Verifique se `vercel.json` está configurado corretamente
2. Certifique-se de que os arquivos estão em `/api/*.js`
3. Redeploy

### Respostas não aparecem

**Causa:** Polling não está funcionando ou CORS bloqueado.

**Solução:**
1. Abra DevTools (F12) → Console
2. Verifique erros de CORS ou fetch
3. Certifique-se de que `api/state.js` retorna CORS headers corretos
4. Teste manualmente: `https://seu-dominio.vercel.app/api/state?room=default`

### Mobile: Barra inferior não aparece

**Causa:** Jogo não foi iniciado ou viewport >768px.

**Solução:**
1. Certifique-se de que o jogo foi iniciado (Pergunta 1 ativa)
2. Verifique viewport: deve ser ≤768px
3. Força redimensionamento: abra DevTools → Device Toolbar (Ctrl+Shift+M)

---

## 🎨 Customizações Pós-Deploy

### Adicionar Domínio Customizado

1. Vá em **Settings** → **Domains**
2. Clique em **Add**
3. Digite seu domínio (ex: `conselheiro.seusite.com`)
4. Siga instruções de DNS (CNAME ou A record)

### Habilitar Analytics

1. Vá em **Analytics** → **Enable**
2. Vercel mostrará visitas, performance, e erros em tempo real

### Configurar Limites de Groq

Groq oferece plano gratuito com limites:

- **Requisições/minuto:** 30
- **Tokens/dia:** 14,400

Para production, considere:
- Upgrade para plano pago Groq: https://console.groq.com/settings/billing
- Implementar cache de respostas IA no Vercel KV (feature futura)

---

## 📊 Monitoramento

### Vercel Dashboard

- **Real-time Logs:** Veja requisições e erros em tempo real
- **Function Metrics:** CPU, memória, duração de execução
- **Error Tracking:** Erros 500 com stack traces

### Groq Dashboard

- **Usage:** https://console.groq.com/settings/usage
- Monitore tokens consumidos e requisições

---

## 🔐 Segurança

### Checklist de Segurança

- ✅ `GROQ_API_KEY` está em Environment Variables (não hardcoded)
- ✅ `.env` está no `.gitignore` (não commitado)
- ✅ Vercel KV usa autenticação via tokens (REST API)
- ✅ CORS configurado apenas para domínios necessários
- ✅ Não há secrets expostos em logs ou frontend

### Rotar Secrets

Se suspeitar de vazamento:

1. **Groq:** Console → API Keys → Revoke → Create new key
2. **Vercel KV:** Storage → Settings → Regenerate token
3. Atualize variáveis no Vercel → Redeploy

---

## 📱 Testes Mobile

### iOS (Safari)

1. Acesse `https://seu-dominio.vercel.app/qr.html` no desktop
2. Escaneie QR code com Camera app
3. Safari abrirá automaticamente `group.html?group=G1&context=...`
4. Teste fluxo completo: gerar IA, enviar resposta, navegação

### Android (Chrome)

1. Escaneie QR code com app de câmera nativa
2. Chrome abrirá o link
3. Teste responsividade: botões ≥48px, barra inferior visível

### Simulação Desktop

1. Abra DevTools (F12)
2. Ctrl+Shift+M (Device Toolbar)
3. Selecione "iPhone SE" (375×667)
4. Teste: accordion collapse, bottom bar, touch targets

---

## 🚨 Suporte

### Links Úteis

- **Vercel Docs:** https://vercel.com/docs
- **Vercel KV Docs:** https://vercel.com/docs/storage/vercel-kv
- **Groq Docs:** https://console.groq.com/docs/quickstart
- **Replit.md:** `./replit.md` (arquitetura do projeto)

### Contato

- **Vercel Support:** https://vercel.com/support
- **Groq Community:** https://discord.gg/groq

---

**✅ Deploy concluído! Seu sistema está no ar e pronto para uso.**
