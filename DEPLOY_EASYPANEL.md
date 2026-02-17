# 🚀 Deploy no EasyPanel - Guia Completo

## 📋 O Que Você Precisa Fazer

### **Opção 1: Upload Direto (Mais Simples) ✅ RECOMENDADO**

1. **Prepare o arquivo ZIP:**
   - Vá na pasta do projeto local: `c:\Users\Carolaine\Downloads\SISTEMAS\cortes-main`
   - Crie um arquivo **ZIP** com TODO o conteúdo da pasta `dist/`
   - Nome sugerido: `cortes-build.zip`

2. **No EasyPanel:**
   - Vá na aba **"Fonte"**
   - Clique em **"Upload"**
   - Arraste o arquivo `cortes-build.zip`
   - Aguarde o upload completar

3. **Configure o Build:**
   - Em **"Construção"** (já vejo que está em "Nixpacks")
   - **Clique em "Buildpacks"** ou mantenha "Nixpacks"

4. **IMPORTANTE - Configuração SPA:**
   - Vá em **"Configurações"** (ícone de engrenagem no topo)
   - Procure por **"Rewrites"** ou **"Redirects"**
   - Adicione esta regra:
     ```
     /* → /index.html (200)
     ```

5. **Implantar:**
   - Clique no botão **"Implantar"** (verde no topo)
   - Aguarde o deploy completar

---

### **Opção 2: Usando Git (Se conectar ao GitHub/GitLab)**

1. **Faça commit e push das alterações:**
   ```bash
   git add .
   git commit -m "Fix: Correções de persistência e modais customizados"
   git push origin main
   ```

2. **No EasyPanel:**
   - Aba **"Fonte"** → Selecione **"Github"**
   - Conecte seu repositório
   - Branch: `main` (ou `master`)
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Configure Rewrite (SPA):**
   - Ainda precisará configurar o redirect `/* → /index.html`

---

## 🔧 SOLUÇÃO DO 404 - Arquivo de Configuração

### **Criar arquivo `_redirects` (Netlify-style)**

O EasyPanel geralmente suporta o arquivo `_redirects`. Eu já criei em:
`public/_redirects`

**Conteúdo:**
```
/*    /index.html   200
```

**Certifique-se que este arquivo está em `public/_redirects`** ✅ (já está!)

---

## 🐳 ALTERNATIVA: Dockerfile (Se quiser controle total)

Se o EasyPanel permitir Dockerfile customizado:

1. **Crie arquivo `Dockerfile.easypanel` na raiz do projeto:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure nginx for SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **No EasyPanel:**
   - Aba **"Construção"** → Selecione **"Dockerfile"**
   - Aponte para `Dockerfile.easypanel`
   - Clique em **"Implantar"**

---

## ✅ Checklist Final

### Antes de Implantar:
- [ ] Arquivo `_redirects` existe em `public/` ✅ (já criado!)
- [ ] Arquivo `vercel.json` existe na raiz ✅ (já criado!)
- [ ] Build local funciona: `npm run build` ✅ (feito!)
- [ ] Pasta `dist/` contém `index.html` e `assets/` ✅

### Após Implantar no EasyPanel:
- [ ] Deploy completou sem erros
- [ ] Site carrega na URL do EasyPanel
- [ ] **TESTE**: Navegue para `/faccoes` e dê F5
- [ ] **TESTE**: Crie um usuário → deve aparecer
- [ ] **TESTE**: Edite uma meta → deve salvar

---

## 🔍 Verificar Configuração no EasyPanel

### **1. Variáveis de Ambiente**
Vá em **"Ambiente"** e certifique-se que estas variáveis estão configuradas:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

### **2. Porta**
- EasyPanel geralmente usa porta **3000** ou **80**
- Verifique se está configurado corretamente

### **3. Health Check**
- Caminho: `/` (raiz)
- Deve retornar 200 OK

---

## 🆘 Se o 404 Persistir no EasyPanel

### **Solução 1: Configuração de Rewrites**
1. Vá em **Configurações** → **Rewrites/Redirects**
2. Adicione:
   - Source: `/*`
   - Destination: `/index.html`
   - Status: `200`

### **Solução 2: Variável de Ambiente para SPA**
Algumas plataformas reconhecem esta variável:
```
SPA=true
```

### **Solução 3: Build Command Customizado**
Se usar Nixpacks ou Buildpacks:
```bash
npm run build && echo '/* /index.html 200' > dist/_redirects
```

---

## 📞 Próximos Passos AGORA

1. **Zipar a pasta `dist/`** do build que acabamos de fazer
2. **Upload no EasyPanel** (aba Fonte → Upload)
3. **Configurar rewrite** para `/* → /index.html`
4. **Clicar em Implantar**
5. **Testar o F5** em `/faccoes`

---

## 🎯 O Importante

**EasyPanel geralmente reconhece automaticamente SPAs**, mas você precisa:
1. ✅ Build correto (já feito - pasta `dist/`)
2. ✅ Arquivo `_redirects` ou `vercel.json` (já criados!)
3. ✅ Configuração de rewrite no painel (você faz agora)

Me diga se precisa de ajuda em algum passo específico! 🚀
