# 🚀 Deploy de Build Pré-Compilado

Este guia explica como fazer o deploy subindo os arquivos já compilados (pasta `dist`), ideal para quando o servidor tem pouca memória para rodar o build ou requer assets estáticos.

## 📦 O Que Enviar

Para que o deploy funcione com o `Dockerfile` atual (que copia a pasta `dist` para o Nginx), você deve criar um arquivo `.zip` contendo **APENAS** estes itens na raiz do zip:

1.  📂 **`dist`** (A pasta gerada pelo comando `npm run build`)
2.  📄 **`Dockerfile`**
3.  📄 **`nginx.conf`**

> **Importante:** Não envie a pasta `node_modules` ou `src`. O zip deve conter os arquivos finais.

## 🛠️ Passo a Passo

1.  **Build Local**: Execute `npm run build` no seu computador.
2.  **Compactar**: Zipe a pasta `dist`, `Dockerfile` e `nginx.conf`.
3.  **Upload**:
    *   Vá no painel do servidor (ex: EasyPanel, Coolify).
    *   Aba **Fonte** (Source) -> **Upload**.
    *   Arraste o arquivo `.zip`.
4.  **Configuração de Build**:
    *   Garanta que o método de construção (Build Method) esteja selecionado como **Dockerfile**.
    *   Caminho do Dockerfile: `Dockerfile` (ou deixe em branco).

## ✅ Arquivo Pronto

Foi gerado automaticamente na raiz do projeto o arquivo:
**`deploy-this-file.zip`**

Este arquivo já contém exatamente o que você precisa subir. Basta arrastar e soltar no servidor.
