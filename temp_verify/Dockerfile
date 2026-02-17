# Usar imagem leve do Nginx
FROM nginx:alpine

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a nossa configuração customizada (que tem o proxy da Vesti)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos do build (pasta dist) para o diretório do Nginx
COPY dist /usr/share/nginx/html

# Expõe a porta 80
EXPOSE 80

# Inicia o servidor
CMD ["nginx", "-g", "daemon off;"]
