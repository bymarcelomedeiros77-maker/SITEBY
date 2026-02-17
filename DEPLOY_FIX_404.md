# 🔧 Corrigindo Erro 404 no Refresh (F5)

## ❌ Problema

Quando você recarrega a página (F5) em qualquer rota que não seja a raiz (`/`), o sistema retorna **404 Not Found**.

**Exemplo:**
- Você navega para `/faccoes` → Funciona ✅
- Você dá F5 → **404 Not Found** ❌

## 🎯 Causa

Aplicações React (SPA - Single Page Application) gerenciam as rotas no **cliente** (navegador). Quando você:
1. Navega internamente → React Router funciona
2. Dá F5 → Navegador pede `/faccoes` do **servidor**
3. Servidor não encontra arquivo `faccoes` → 404

## ✅ Solução

Configure o servidor para **redirecionar todas as rotas para `index.html`**, permitindo que o React Router gerencie a navegação.

---

## 📋 Instruções por Tipo de Servidor

### 🟦 Nginx (Seu Caso)

O arquivo `nginx.conf` **JÁ ESTÁ CORRETO** ✅

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**⚠️ IMPORTANTE: Você precisa aplicar essa configuração no servidor!**

#### Passos:

1. **Copiar o arquivo para o servidor:**
   ```bash
   # No seu servidor
   sudo cp /caminho/do/projeto/nginx.conf /etc/nginx/sites-available/cortes
   ```

2. **Criar link simbólico:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/cortes /etc/nginx/sites-enabled/
   ```

3. **Testar configuração:**
   ```bash
   sudo nginx -t
   ```

4. **Recarregar Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

5. **Fazer novo deploy do build:**
   ```bash
   npm run build
   # Copiar pasta dist/ para /usr/share/nginx/html/
   ```

---

### 🟩 Vercel

Arquivo `vercel.json` criado ✅

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Deploy:**
```bash
vercel --prod
```

---

### 🟧 Netlify

Arquivo `public/_redirects` criado ✅

```
/*    /index.html   200
```

**Deploy:**
- Commit e push para o repositório conectado ao Netlify
- Ou use `netlify deploy --prod`

---

## 🚀 Checklist de Deploy

- [ ] Build atualizado (`npm run build`)
- [ ] Configuração do servidor aplicada
- [ ] Nginx recarregado (se usando nginx)
- [ ] Arquivos da pasta `dist/` copiados para o servidor
- [ ] Testar F5 em `/faccoes`, `/cortes`, `/performance`

---

## 🧪 Como Testar

1. Faça login no sistema
2. Navegue para **Facções** (`/faccoes`)
3. Aperte **F5**
4. **Deve carregar a página normalmente** ✅

---

## 📞 Próximos Passos

**SE O PROBLEMA PERSISTIR:**

1. Verifique se o arquivo `nginx.conf` está sendo usado:
   ```bash
   sudo nginx -T | grep try_files
   ```

2. Verifique os logs do nginx:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. Confirme que a pasta `dist/` foi copiada corretamente:
   ```bash
   ls -la /usr/share/nginx/html/
   ```

4. Limpe o cache do navegador (Ctrl+Shift+Delete)
