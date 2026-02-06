FROM node:18-alpine
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Instalar serve globalmente
RUN npm install -g serve

# Expor porta 80
EXPOSE 80

# Comando para servir a aplicação com SPA fallback automático
CMD ["serve", "-s", "dist", "-l", "80"]
