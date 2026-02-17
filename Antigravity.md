# Antigravity.md - n8n Workflow Builder

> Este arquivo configura o comportamento da IA para criar workflows n8n de alta qualidade neste projeto.

---

## 🎯 OBJETIVO PRINCIPAL

Assistir na criação, validação e gerenciamento de workflows n8n usando o **n8n-MCP** e **n8n-skills**. Este projeto está configurado para trabalhar com automações n8n integradas ao sistema.

---

## 🔧 CONFIGURAÇÃO DO AMBIENTE

### Recursos Disponíveis

Este projeto tem acesso a:

1. **n8n-MCP Server**: Bridge entre n8n e IA com acesso a:
   - 📚 1.084 nodes n8n (537 core + 547 community)
   - ⚡ 63.6% cobertura de operações
   - 📄 87% cobertura de documentação oficial
   - 🎯 2.709 templates de workflow
   - 🤖 265 variantes de ferramentas AI

2. **n8n-skills**: 7 skills complementares para workflows production-ready:
   - n8n Expression Syntax
   - n8n MCP Tools Expert (MÁXIMA PRIORIDADE)
   - n8n Workflow Patterns
   - n8n Validation Expert
   - n8n Node Configuration
   - n8n Code JavaScript
   - n8n Code Python

### Informações Importantes

- **Repositório MCP**: https://github.com/czlonkowski/n8n-mcp
- **Repositório Skills**: https://github.com/czlonkowski/n8n-skills
- **Setup Antigravity**: https://github.com/czlonkowski/n8n-mcp/blob/main/docs/ANTIGRAVITY_SETUP.md

---

## ⚠️ REGRAS DE SEGURANÇA (CRÍTICO)

> 🚨 **NUNCA edite workflows de produção diretamente com IA!**

**Sempre:**
- 🔄 Faça uma cópia do workflow antes de usar ferramentas IA
- 🧪 Teste em ambiente de desenvolvimento primeiro
- 💾 Exporte backups de workflows importantes
- ⚡ Valide mudanças antes de deployar para produção

**Resultados de IA podem ser imprevisíveis. Proteja seu trabalho!**

---

## 📡 FERRAMENTAS MCP DISPONÍVEIS

### Core Tools (7 ferramentas principais)

#### 1. `tools_documentation`
- **Uso**: Obter documentação de qualquer ferramenta MCP
- **Quando usar**: COMECE AQUI! Sempre que precisar entender uma ferramenta

#### 2. `search_nodes`
- **Uso**: Busca full-text em todos os nodes
- **Parâmetros importantes**:
  - `source: 'community'|'verified'` - Para nodes da comunidade
  - `includeExamples: true` - Incluir configurações de exemplo

#### 3. `get_node`
- **Uso**: Informações unificadas sobre um node
- **Modos disponíveis**:
  - **Info** (padrão): `detail: 'minimal'|'standard'|'full'`, `includeExamples: true`
  - **Docs**: `mode: 'docs'` - Documentação em markdown
  - **Property search**: `mode: 'search_properties'`, `propertyQuery: 'auth'`
  - **Versions**: `mode: 'versions'|'compare'|'breaking'|'migrations'`

#### 4. `validate_node`
- **Uso**: Validação unificada de node
- **Modos**:
  - `mode: 'minimal'` - Checagem rápida de campos requeridos (<100ms)
  - `mode: 'full'` - Validação completa com profiles (minimal, runtime, ai-friendly, strict)

#### 5. `validate_workflow`
- **Uso**: Validação completa de workflow, incluindo AI Agent

#### 6. `search_templates`
- **Uso**: Busca unificada de templates
- **Modos de busca**:
  - `searchMode: 'keyword'` (padrão) - Busca por texto com query
  - `searchMode: 'by_nodes'` - Encontrar templates usando nodeTypes específicos
  - `searchMode: 'by_task'` - Templates curados para tarefas comuns
  - `searchMode: 'by_metadata'` - Filtrar por complexity, requiredService, targetAudience

#### 7. `get_template`
- **Uso**: Obter JSON completo do workflow
- **Modos**: `nodes_only`, `structure`, `full`

### n8n Management Tools (13 ferramentas - Requer configuração API)

> **Nota**: Essas ferramentas requerem `N8N_API_URL` e `N8N_API_KEY` configurados.

#### Workflow Management

- **`n8n_create_workflow`**: Criar novos workflows com nodes e conexões
- **`n8n_get_workflow`**: Recuperação unificada de workflow
  - `mode: 'full'` (padrão) - JSON completo do workflow
  - `mode: 'details'` - Incluir estatísticas de execução
  - `mode: 'structure'` - Apenas topologia de nodes e conexões
  - `mode: 'minimal'` - Apenas ID, nome, status ativo
  
- **`n8n_update_full_workflow`**: Atualizar workflow inteiro (substituição completa)
- **`n8n_update_partial_workflow`**: Atualizar workflow usando operações diff
- **`n8n_delete_workflow`**: Deletar workflows permanentemente
- **`n8n_list_workflows`**: Listar workflows com filtros e paginação
- **`n8n_validate_workflow`**: Validar workflows no n8n por ID
- **`n8n_autofix_workflow`**: Corrigir automaticamente erros comuns
- **`n8n_workflow_versions`**: Gerenciar histórico de versões e rollback
- **`n8n_deploy_template`**: Deploy de templates do n8n.io direto na sua instância com auto-fix

#### Execution Management

- **`n8n_test_workflow`**: Testar/disparar execução de workflow
  - Auto-detecta tipo de trigger (webhook, form, chat)
  - Suporta dados customizados, headers e métodos HTTP para webhooks
  - Chat triggers suportam message e sessionId para conversações

- **`n8n_executions`**: Gerenciamento unificado de execuções
  - `action: 'list'` - Listar execuções com filtro de status
  - `action: 'get'` - Obter detalhes de execução por ID
  - `action: 'delete'` - Deletar registros de execução

#### System Tools

- **`n8n_health_check`**: Checar conectividade da API n8n e recursos

---

## 🎯 WORKFLOW DE TRABALHO

### 1️⃣ Fase de Descoberta (SEMPRE INICIAR AQUI)

Quando o usuário solicitar criação de workflow:

```markdown
1. **Entender o objetivo**:
   - Qual é o objetivo do workflow?
   - Quais dados serão processados?
   - Qual é o trigger esperado?
   - Quais integrações são necessárias?

2. **Buscar referências**:
   - Use `search_templates` para encontrar workflows similares
   - Use `search_nodes` para encontrar nodes relevantes
   - Verifique exemplos existentes com `includeExamples: true`

3. **Validar entendimento**:
   - Confirme com o usuário antes de criar
   - Apresente o padrão de workflow que será usado
```

### 2️⃣ Fase de Construção

```markdown
1. **Selecionar Padrão**:
   Escolha um dos 5 padrões arquiteturais:
   - Webhook Processing (para receber dados externos)
   - HTTP API Pattern (para consumir APIs)
   - Database Pattern (para interagir com bancos)
   - AI Workflow Pattern (para processar com IA)
   - Scheduled Pattern (para tarefas agendadas)

2. **Configurar Nodes**:
   - Use `get_node` com `mode: 'docs'` para entender configuração
   - Siga dependências de propriedades (ex: sendBody → contentType)
   - Use exemplos reais quando disponível

3. **Criar Workflow**:
   - Use `n8n_create_workflow` para criar
   - Ou use `n8n_deploy_template` para deployar template existente
```

### 3️⃣ Fase de Validação (OBRIGATÓRIO)

```markdown
1. **Validação Mínima**:
   - Use `validate_workflow` antes de qualquer deploy
   - Use `validate_node` com `mode: 'minimal'` para checagem rápida

2. **Validação Completa**:
   - Use `validate_node` com `mode: 'full'` e profile apropriado:
     - `minimal`: Checagem básica
     - `runtime`: Verificações de execução
     - `ai-friendly`: Recomendado para workflows criados por IA
     - `strict`: Validação rigorosa para produção

3. **Auto-correção**:
   - Use `n8n_autofix_workflow` para corrigir erros comuns automaticamente
```

### 4️⃣ Fase de Teste

```markdown
1. **Teste Local**:
   - Use `n8n_test_workflow` para testar execução
   - Verifique logs com `n8n_executions` action: 'get'

2. **Iteração**:
   - Se houver erros, use `n8n_update_partial_workflow` para ajustes
   - Re-valide após cada mudança
```

---

## 📚 PADRÕES DE WORKFLOW

### 1. Webhook Processing Pattern

**Quando usar**: Receber dados de sistemas externos via webhook.

**Estrutura típica**:
```
Webhook → [Processar dados] → [Validação] → [Ação] → [Resposta]
```

**Gotchas importantes**:
- Dados do webhook estão em `$json.body`, não em `$json`
- Sempre retorne uma resposta ao webhook

### 2. HTTP API Pattern

**Quando usar**: Consumir APIs externas.

**Estrutura típica**:
```
Trigger → [HTTP Request] → [Processar resposta] → [Ação]
```

### 3. Database Pattern

**Quando usar**: Interagir com bancos de dados.

**Estrutura típica**:
```
Trigger → [Query DB] → [Processar dados] → [Update/Insert DB]
```

### 4. AI Workflow Pattern

**Quando usar**: Processar com modelos de IA.

**Estrutura típica**:
```
Trigger → [Preparar prompt] → [AI Agent/Model] → [Processar resposta] → [Ação]
```

**Nota**: Workflows AI Agent têm 8 tipos de conexão específicos.

### 5. Scheduled Pattern

**Quando usar**: Tarefas agendadas/recorrentes.

**Estrutura típica**:
```
Schedule Trigger → [Buscar dados] → [Processar] → [Ação]
```

---

## 💡 MELHORES PRÁTICAS

### Expressions n8n

1. **Variáveis Core**:
   - `$json` - Dados do item atual
   - `$node` - Dados de outros nodes
   - `$now` - Data/hora atual
   - `$env` - Variáveis de ambiente

2. **Gotcha Crítico**:
   - ⚠️ Dados de webhook estão em `$json.body`, não em `$json`

3. **Quando NÃO usar expressions**:
   - Para lógica complexa → Use Code nodes (JavaScript/Python)

### Code Nodes (JavaScript)

1. **Padrões de acesso a dados**:
   ```javascript
   $input.all()    // Todos os items
   $input.first()  // Primeiro item
   $input.item     // Item atual (em loops)
   ```

2. **Formato de retorno correto**:
   ```javascript
   return [{json: {...}}];  // ✅ Correto
   return {...};             // ❌ Errado
   ```

3. **Funções Built-in**:
   - `$helpers.httpRequest()` - Para requisições HTTP
   - `DateTime` - Manipulação de datas
   - `$jmespath()` - Queries em JSON

### Code Nodes (Python)

⚠️ **Importante**: Use JavaScript para 95% dos casos!

**Limitação crítica**: Sem bibliotecas externas (requests, pandas, numpy)

**Quando usar Python**:
- Processamento de texto com regex nativo
- Manipulação de dados com standard library
- Cálculos matemáticos simples

---

## 🔍 TROUBLESHOOTING

### Erro de Validação

1. Use `validate_workflow` ou `validate_node` com `mode: 'full'`
2. Leia o erro retornado
3. Use `n8n_autofix_workflow` para correção automática
4. Se persistir, ajuste manualmente com `n8n_update_partial_workflow`

### Workflow não executa

1. Verifique trigger está configurado corretamente
2. Use `n8n_test_workflow` para teste manual
3. Cheque logs com `n8n_executions` action: 'list'
4. Valide conexões entre nodes

### Node não funciona como esperado

1. Use `get_node` com `mode: 'docs'` para ler documentação
2. Verifique exemplos com `includeExamples: true`
3. Busque templates similares com `search_templates` por nodes

---

## 📋 CHECKLIST DE CRIAÇÃO DE WORKFLOW

Antes de entregar um workflow ao usuário:

- [ ] Objetivo do workflow está claro
- [ ] Padrão arquitetural foi selecionado
- [ ] Nodes foram configurados corretamente
- [ ] Validação `validate_workflow` passou
- [ ] Workflow foi testado com `n8n_test_workflow`
- [ ] Documentação foi fornecida ao usuário
- [ ] Backup foi recomendado (se modificando workflow existente)

---

## 🎓 RECURSOS ADICIONAIS

- [n8n-mcp GitHub](https://github.com/czlonkowski/n8n-mcp)
- [n8n-skills GitHub](https://github.com/czlonkowski/n8n-skills)
- [Documentação oficial n8n](https://docs.n8n.io)
- [Templates n8n](https://n8n.io/workflows)

---

## 🤝 INTEGRAÇÃO COM PROJETO

Este arquivo trabalha em conjunto com:
- **GEMINI.md**: Regras globais do projeto
- **Skills do projeto**: Clean code, testing, etc.
- **n8n-MCP**: Servidor MCP configurado
- **n8n-skills**: Skills específicas de n8n

**Prioridade de Regras**: GEMINI.md > Antigravity.md > n8n-skills

---

**Última atualização**: 2026-02-05
