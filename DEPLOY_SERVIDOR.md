# 🚀 Deploy Completo - Passo a Passo

## 📋 Checklist Antes de Começar

- [ ] Acesso SSH ao servidor
- [ ] Pasta `dist/` gerada localmente (✅ já feito)
- [ ] Arquivo `nginx.conf` pronto (✅ já feito)

---

## 1️⃣ PASSO 1: Fazer Upload dos Arquivos

### Opção A: Usando FTP/SFTP (Recomendado se você usa FileZilla, WinSCP, etc)

1. Conecte-se ao servidor via FTP/SFTP
2. Navegue até a pasta do site: `/var/www/html/` (ou `/usr/share/nginx/html/`)
3. **IMPORTANTE**: Faça backup da pasta atual primeiro!
   - Renomeie a pasta atual para `html_backup_antigo`
4. Faça upload de **TODA** a pasta `dist/` para o servidor
5. Renomeie `dist/` para o nome correto (provavelmente `html` ou deixe como está)

### Opção B: Usando SCP (Linha de Comando)

```bash
# Substitua 'usuario' e 'servidor.com' pelos seus dados
scp -r dist/* usuario@cortes.bymarcelomedeiros.com.br:/var/www/html/
```

---

## 2️⃣ PASSO 2: Aplicar Configuração do Nginx

### **CRÍTICO: Este é o passo que corrige o erro 404!**

1. **Conecte-se ao servidor via SSH:**
   ```bash
   ssh usuario@cortes.bymarcelomedeiros.com.br
   ```

2. **Verifique configuração atual do nginx:**
   ```bash
   cat /etc/nginx/sites-enabled/default
   # ou
   cat /etc/nginx/nginx.conf
   ```

3. **Edite a configuração do site:**
   ```bash
   sudo nano /etc/nginx/sites-available/cortes
   ```

4. **Cole esta configuração:**
   ```nginx
   server {
       listen 80;
       server_name cortes.bymarcelomedeiros.com.br;

       root /var/www/html;
       index index.html;

       # Gzip compression
       gzip on;
       gzip_min_length 1000;
       gzip_proxied expired no-cache no-store private auth;
       gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;

       # 🔥 ESTA LINHA É A MAIS IMPORTANTE - CORRIGE O 404!
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache static assets
       location /assets/ {
           expires 1y;
           add_header Cache-Control "public, no-transform";
       }
   }
   ```

5. **Salve e saia:**
   - Pressione `Ctrl + X`
   - Digite `Y` (sim)
   - Pressione `Enter`

6. **Teste a configuração:**
   ```bash
   sudo nginx -t
   ```
   
   **Você DEVE ver:**
   ```
   nginx: configuration file /etc/nginx/nginx.conf test is successful
   ```

7. **Aplique a configuração:**
   ```bash
   sudo systemctl reload nginx
   ```

---

## 3️⃣ PASSO 3: Verificar Permissões

```bash
# Garanta que o nginx pode ler os arquivos
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
```

---

## 4️⃣ PASSO 4: Limpar Cache do Navegador

1. No navegador, pressione **Ctrl + Shift + Delete**
2. Selecione **"Todo o período"**
3. Marque:
   - ✅ Imagens e arquivos em cache
   - ✅ Cookies e outros dados de sites
4. Clique em **"Limpar dados"**

---

## 5️⃣ PASSO 5: Testar

1. Acesse: `https://cortes.bymarcelomedeiros.com.br`
2. Faça login
3. Navegue para **Facções** (`/faccoes`)
4. Aperte **F5** (recarregar)
5. ✅ **DEVE FUNCIONAR!** (Não mais 404)

---

## 🔍 Se Ainda Der Problema

### Verificar Logs do Nginx:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Verificar se arquivos foram copiados:
```bash
ls -la /var/www/html/
```

**Você DEVE ver:**
- `index.html` (5.37 KB)
- Pasta `assets/` com arquivos `.js` e `.css`
- `manifest.json`

### Verificar qual configuração nginx está ativa:
```bash
sudo nginx -T | grep "try_files"
```

**Você DEVE ver:**
```
try_files $uri $uri/ /index.html;
```

---

## 📞 Comandos Rápidos de Referência

```bash
# Conectar ao servidor
ssh usuario@cortes.bymarcelomedeiros.com.br

# Editar nginx
sudo nano /etc/nginx/sites-available/cortes

# Testar nginx
sudo nginx -t

# Recarregar nginx
sudo systemctl reload nginx

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Ver logs de acesso
sudo tail -f /var/log/nginx/access.log

# Verificar status nginx
sudo systemctl status nginx

# Reiniciar nginx (se reload não funcionar)
sudo systemctl restart nginx
```

---

## ⚠️ Observações Importantes

1. **Caminho da pasta pode variar:**
   - Pode ser `/var/www/html/`
   - Ou `/usr/share/nginx/html/`
   - Ou `/home/usuario/public_html/`
   
2. **SEMPRE faça backup antes de alterar:**
   ```bash
   sudo cp -r /var/www/html /var/www/html_backup_$(date +%Y%m%d)
   ```

3. **Se você usa painel de controle (cPanel, Plesk, etc):**
   - Verifique se há interface gráfica para configurar o nginx
   - O caminho dos arquivos pode ser diferente

---

## ✅ Resultado Esperado

Após seguir todos os passos:

- ✅ Site carrega na raiz (`/`)
- ✅ F5 em qualquer página **NÃO** dá 404
- ✅ Navegação interna funciona
- ✅ Dados salvam corretamente (usuários, metas, facções)
