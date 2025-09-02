# BaúAcadêmico

Sistema completo de gestão de comprovantes acadêmicos e notícias desenvolvido com React + TypeScript + Supabase.

## Resumo

- **Sistema completamente refatorado e funcional** - Visual moderno, responsivo e otimizado
- Upload e gestão de documentos acadêmicos com categorização inteligente
- **Sistema completo de avisos e notícias** - Upload de imagens e **múltiplos arquivos** (PDF, DOC, TXT)
- **Sistema de download de múltiplos arquivos** - Usuários podem baixar qualquer arquivo anexado aos avisos
- **Interface aprimorada para múltiplos arquivos** - Seleção múltipla, drag & drop, preview e remoção individual
- Autenticação híbrida (Supabase Auth + localStorage) com fallbacks robustos
- Interface totalmente responsiva (mobile/tablet/desktop)
- **Toast notifications configurados** - Feedback visual adequado com duração correta

## Funcionalidades Implementadas

### 📁 Gestão de Documentos

- **APC (Atividades Práticas Curriculares)**: Upload com campos extras (Nome do Evento, Horas, Data do Evento)
- **ACE (Atividades Complementares de Ensino)**: Upload com campos extras (Nome do Evento, Horas, Data do Evento)
- **RECIBOS (Comprovantes de Mensalidade)**: Upload simples de imagem
- **Visualização** completa com detalhes dos eventos e datas
- **Exclusão** segura de documentos
- **Upload** com fallback para base64 em caso de falha no storage

### 👤 Sistema de Usuários

- Login/SignUp com autenticação Supabase para admins
- Sistema híbrido com localStorage para usuários comuns
- Controle de permissões (admin/usuário comum)
- Sessão persistente através de localStorage
- Logout completo limpando todas as sessões

### 📢 Sistema de Avisos (v2.3 - MÚLTIPLOS ARQUIVOS)

- **Painel administrativo** completo para criar/editar/excluir avisos
- **Upload de imagens** para avisos com cache e retry automático
- **🆕 Upload de múltiplos arquivos** - Selecione quantos PDFs, TXT, DOC, DOCX quiser
- **🆕 Interface de seleção múltipla** - Drag & drop, seleção com Ctrl/Cmd, preview individual
- **🆕 Gerenciamento individual** - Remover arquivos específicos, botão "Limpar todos"
- **Sistema de download otimizado** - Botões estilizados na paleta vermelha para cada arquivo
- **Compatibilidade total** - Suporte tanto para múltiplos quanto arquivo único (legado)
- **Fallback base64** - Sistema continua funcionando mesmo com problemas no storage
- **Validação robusta** - Limite de 10MB por arquivo, tipos permitidos, validação em tempo real
- **Interface responsiva** - Cards modernos com informações de cada arquivo
- **Visualização pública** - Seção destacada mostrando todos os arquivos disponíveis para download
- **🆕 Estrutura JSONB** - Array de arquivos otimizado no banco de dados
- **🆕 Migração automática** - Converte arquivos únicos existentes para o novo formato

### 📰 Sistema de Notícias

- **Página pública** para visualizar notícias com cards modernos
- **Painel administrativo** para CRUD completo de notícias
- **Upload de imagens** com cache, retry e placeholder para erros
- **Cache inteligente** - Evita recarregar imagens desnecessariamente
- **Cards responsivos** - Layout compacto com modal detalhado
- **Acesso público** para leitura, apenas admin pode escrever
- **Design consistente** - Paleta laranja para notícias

## Status do Projeto

✅ **PROJETO 100% FUNCIONAL E OTIMIZADO v2.3**

- **🆕 Múltiplos arquivos funcionando** - Selecione e anexe quantos arquivos quiser por aviso
- **🆕 Interface de drag & drop** - Arraste múltiplos arquivos diretamente para a área
- **🆕 Preview e gerenciamento** - Visualize arquivos selecionados, remova individualmente
- **Upload de arquivos funcionando** - Avisos suportam múltiplos arquivos para download
- **Interface de múltiplos arquivos** - Seleção, preview e gerenciamento individual
- **Sistema de cache implementado** - Performance otimizada para imagens
- **Toast notifications corrigidos** - Duração adequada (4s) com botão de fechar
- **Interface moderna** - Cards compactos, modais detalhados, design responsivo
- **Fallbacks robustos** - Base64 quando storage falha, placeholder para erros
- **Código limpo** - Arquivos temporários removidos, apenas código essencial
- **Componentes reutilizáveis** - PageHeader, EmptyState, utilitários de data
- **Validação completa** - Formatos de arquivo, tamanho máximo, error handling
- **Build otimizado** - 165KB gzipped, sem erros TypeScript

## Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Shadcn/ui + Tailwind CSS + Radix UI
- **Backend**: Supabase (Auth + Database + Storage)
- **Banco**: PostgreSQL
- **Storage**: Supabase Storage (buckets públicos)
- **Deploy**: Preparado para Vercel/Netlify

## Status Atual

✅ **Sistema de Arquivos**: Upload de imagens e documentos funcionando perfeitamente
✅ **Download de Arquivos**: Botões estilizados para download direto nos avisos
✅ **Cache de Performance**: Imagens com cache, retry automático e placeholders
✅ **Toast Corrigido**: Notificações com duração adequada e botão de fechar
✅ **Interface Moderna**: Cards compactos, modals detalhados, design responsivo
✅ **Código Limpo**: Arquivos temporários removidos, apenas código essencial
✅ **Build Otimizado**: 164KB gzipped, pronto para produção
⚠️ **Storage RLS**: Configurado com política permissiva (pode ser restringida)

## Configuração do Banco de Dados

### Tabelas Criadas

1. **users** - Usuários do sistema
2. **documents** - Documentos acadêmicos
3. **avisos** - Sistema de avisos
4. **noticias** - Sistema de notícias (NOVO)

### Migração SQL

Execute as migrações na pasta `supabase/migrations/`:

```bash
# Tabelas principais
20250817211355_*.sql

# Tabela de notícias
20250901000000_create_noticias_table.sql

# Suporte a arquivos nos avisos (NOVA)
20250901140253_add_file_support_to_avisos.sql

# Múltiplos arquivos nos avisos (NOVA v2.2)
20250901143000_multiple_files_avisos.sql
```

### Storage

Buckets configurados como públicos:

- `documents` - Para documentos acadêmicos
- `avisos` - Para imagens de avisos
- `noticias` - Para imagens de notícias

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Conta no Supabase

### Instalação

1. **Clone o repositório**

   ```bash
   git clone https://github.com/Ssnowzx/Agenda0103N.git
   cd proof-chest
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   Crie um arquivo `.env` com as credenciais do Supabase:

   ```env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_aqui
   ```

4. **Configure o banco de dados**

   - Acesse seu projeto no Supabase
   - Vá para SQL Editor
   - Execute as migrações da pasta `supabase/migrations/`
   - **🆕 OBRIGATÓRIO**: Execute a migração de múltiplos arquivos:
     ```sql
     -- Execute o arquivo: supabase/migrations/20250901143000_multiple_files_avisos.sql
     -- OU execute diretamente:
     ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;
     ```
   - Configure os buckets de storage como públicos

5. **Inicie o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

6. **Acesse a aplicação**
   - Abra http://localhost:5173
   - Sistema funciona mesmo sem Supabase (modo desenvolvimento)

## Arquitetura do Sistema

### Autenticação Híbrida

- **Admin**: Usa Supabase Auth (login/signup seguro)
- **Usuários**: Sistema local com localStorage (desenvolvimento)
- **Sessão**: Persistente via localStorage para todos os usuários
- **Fallback**: Funciona offline para desenvolvimento

### Upload de Documentos

- **Primary**: Supabase Storage (buckets públicos)
- **Fallback**: Base64 encoding se storage falhar
- **Categorias**: APC, ACE, RECIBOS com campos dinâmicos

5. **Acesse a aplicação**
   - Abra http://localhost:5173
   - Use as credenciais: **admin** / **admin123**

## Configuração do Supabase

### Migrações Necessárias (ATUALIZADA v2.2)

Execute no SQL Editor do Supabase:

```sql
-- 1. Tabelas principais (users, documents, avisos)
-- Execute: supabase/migrations/20250817211355_*.sql

-- 2. Tabela de notícias
-- Execute: supabase/migrations/20250901000000_create_noticias_table.sql

-- 3. Suporte a arquivos nos avisos
-- Execute: supabase/migrations/20250901140253_add_file_support_to_avisos.sql

-- 4. Múltiplos arquivos nos avisos (NOVO)
-- Execute: supabase/migrations/20250901143000_multiple_files_avisos.sql

-- OU execute diretamente:
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;

-- Migrar dados existentes (opcional - preserva arquivos já enviados):
UPDATE public.avisos
SET files = CASE
  WHEN file_url IS NOT NULL THEN
    jsonb_build_array(
      jsonb_build_object(
        'url', file_url,
        'name', COALESCE(file_name, 'arquivo'),
        'type', COALESCE(file_type, 'application/pdf'),
        'size', COALESCE(file_size, 0)
      )
    )
  ELSE '[]'::jsonb
END
WHERE files = '[]'::jsonb;
```

### Storage Buckets

Configure os buckets como **públicos** no Dashboard do Supabase:

1. `documents` - Para documentos acadêmicos
2. `avisos` - Para imagens de avisos
3. `noticias` - Para imagens de notícias

### Políticas RLS (Opcional)

O sistema funciona com RLS desabilitado para simplicidade. Para reabilitar:

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura pública, escrita apenas admin
-- (Ver migrações SQL para políticas completas)
```

## Estrutura do Banco

### Tabela `users`

- `id` (UUID) - Chave primária
- `username` (TEXT) - Nome de usuário único
- `password` (TEXT) - Hash da senha (bcrypt)
- `is_admin` (BOOLEAN) - Flag de administrador

### Tabela `documents`

- `id` (UUID) - Chave primária
- `user_id` (UUID) - Referência ao usuário
- `category` (TEXT) - Categoria: APC, ACE, RECIBO, RECIBOS
- `image_url` (TEXT) - URL da imagem no storage
- `extracted_text` (TEXT) - Texto extraído (OCR futuro)
- `evento` (TEXT) - Nome do evento (APC/ACE)
- `horas` (INTEGER) - Quantidade de horas (APC/ACE)
- `data_evento` (DATE) - Data do evento (APC/ACE)

### Tabela `avisos` (v2.3 - MÚLTIPLOS ARQUIVOS)

- `id` (UUID) - Chave primária
- `title` (TEXT) - Título do aviso
- `description` (TEXT) - Descrição
- `image_url` (TEXT) - URL da imagem (opcional)
- **🆕 `files` (JSONB)** - Array de arquivos com estrutura `{url, name, type, size}` **[NOVO v2.3]**
- `file_url` (TEXT) - URL do arquivo (legado, compatibilidade)
- `file_name` (TEXT) - Nome do arquivo (legado, compatibilidade)
- `file_type` (TEXT) - Tipo MIME do arquivo (legado, compatibilidade)
- `file_size` (INTEGER) - Tamanho em bytes (legado, compatibilidade)
- `created_at` (TIMESTAMP) - Data de criação

**Exemplo da estrutura `files` JSONB:**

```json
[
  {
    "url": "https://supabase.co/storage/avisos/arquivo1.pdf",
    "name": "Regulamento.pdf",
    "type": "application/pdf",
    "size": 1024000
  },
  {
    "url": "data:application/pdf;base64,JVBERi0xLjQK...",
    "name": "Edital.pdf",
    "type": "application/pdf",
    "size": 512000
  }
]
```

### Tabela `noticias` (NOVA)

- `id` (UUID) - Chave primária
- `title` (TEXT) - Título da notícia
- `description` (TEXT) - Descrição/conteúdo
- `image_url` (TEXT) - URL da imagem (opcional)
- `created_at` (TIMESTAMP) - Data de criação

## Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: Supabase (Auth + Database + Storage)
- **Autenticação**: Supabase Auth + bcrypt
- **Formulários**: React Hook Form + Zod
- **Notificações**: Sonner (configurado com duração 4s e botão fechar)
- **Ícones**: Lucide React
- **Performance**: Cache de imagens, lazy loading, retry automático

## Scripts Disponíveis

```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build para produção
npm run preview   # Preview da build
npm run lint      # Linting com ESLint
```

## Credenciais de Teste

**Modo Desenvolvimento (sem Supabase):**

- Qualquer username/password funciona
- Admin automático para teste

**Modo Produção (com Supabase):**

- Crie conta através do sistema
- Admin requer configuração manual no banco

## Características do Projeto

### Visual e UX

- ✅ Design futurista com paleta azul/roxo
- ✅ Interface totalmente responsiva
- ✅ Headers adaptáveis (mobile/tablet/desktop)
- ✅ Botões e inputs com contraste adequado
- ✅ Logo e branding atualizados

### Código e Arquitetura

- ✅ Código limpo - removidos 34+ componentes não utilizados
- ✅ Arquivos temporários e de debug removidos
- ✅ Sistema de fallbacks robusto
- ✅ TypeScript com tipagem completa
- ✅ Estrutura modular e escalável

### Funcionalidades Completas

- ✅ **Upload de documentos** com campos dinâmicos (APC, ACE, RECIBOS)
- ✅ **Sistema de avisos** com imagens e arquivos para download
- ✅ **Sistema de notícias** com cache de imagens e interface moderna
- ✅ **Download de arquivos** - PDF, DOC, TXT com botões estilizados
- ✅ **Autenticação híbrida** funcional com fallbacks robustos
- ✅ **Cache inteligente** - Performance otimizada para imagens
- ✅ **Toast sistema** - Notificações com duração adequada
- ✅ **Error handling** - Placeholders e retry automático

## Como Usar o Sistema de Múltiplos Arquivos

### 📤 Para Administradores (Upload)

1. **Acesse o painel administrativo** (`/admin`)
2. **No formulário de avisos**, você verá uma área de upload de múltiplos arquivos
3. **Selecione arquivos de 3 formas:**

   - **Clique na área** e selecione múltiplos arquivos (use Ctrl/Cmd + clique)
   - **Arraste e solte** múltiplos arquivos na área visual
   - **Combine ambos** - selecione alguns, depois arraste mais

4. **Gerencie os arquivos selecionados:**

   - **Preview em tempo real** - Veja nome e tamanho de cada arquivo
   - **Remoção individual** - Clique no "X" para remover arquivos específicos
   - **Limpar todos** - Botão para remover todos os arquivos selecionados

5. **Validação automática:**
   - **Tipos aceitos:** PDF, TXT, DOC, DOCX
   - **Tamanho máximo:** 10MB por arquivo
   - **Feedback instantâneo** sobre arquivos inválidos

### 📥 Para Usuários (Download)

1. **Acesse a página de avisos** (`/avisos`)
2. **Nos cards de avisos**, você verá:

   - **Lista de arquivos** anexados ao aviso
   - **Botão de download** individual para cada arquivo
   - **Nome e tipo** de cada arquivo disponível

3. **Download simples:**
   - **Clique no botão de download** do arquivo desejado
   - **Download direto** - Seja do Supabase Storage ou base64

### 🔧 Recursos Técnicos

- **Fallback automático:** Se o upload para o Supabase falhar, o sistema salva em base64
- **Compatibilidade:** Avisos antigos com arquivo único continuam funcionando
- **Performance:** Sistema otimizado para múltiplos arquivos grandes
- **Logs de debug:** Console mostra o progresso de upload de cada arquivo

## Deployment

### Build para Produção

```bash
npm run build
```

### Variáveis de Ambiente

Configure no seu provedor de deploy:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica_aqui
```

### Deploy Recomendado

- **Vercel**: Ideal para React + Vite
- **Netlify**: Alternativa confiável
- **Supabase**: Para fullstack

## Próximos Passos (Opcional)

1. **Segurança**: Reabilitar RLS e políticas do Supabase
2. **Features**: OCR para extração de texto dos documentos
3. **Analytics**: Dashboard com estatísticas de uso
4. **Notificações**: Push notifications para avisos
5. **Mobile App**: React Native ou PWA

## Histórico de Mudanças

### v2.3.0 (Atual) - Múltiplos Arquivos Avançados

- ✅ **🆕 Seleção múltipla de arquivos** - Selecione quantos PDFs, TXT, DOC, DOCX quiser de uma vez
- ✅ **🆕 Interface drag & drop** - Arraste múltiplos arquivos diretamente para a área de upload
- ✅ **🆕 Preview individual** - Visualize cada arquivo selecionado com nome e tamanho
- ✅ **🆕 Remoção seletiva** - Remova arquivos específicos ou limpe todos de uma vez
- ✅ **🆕 Estrutura JSONB otimizada** - Array de arquivos no banco com metadata completa
- ✅ **🆕 Migração automática** - Converte arquivos únicos existentes para o novo formato
- ✅ **🆕 Compatibilidade total** - Sistema funciona com avisos antigos (arquivo único)
- ✅ **🆕 Validação em tempo real** - Feedback instantâneo sobre arquivos inválidos
- ✅ **🆕 Interface aprimorada** - Área de upload visual, instruções claras
- ✅ **🆕 Logs otimizados** - Debug limpo, apenas informações essenciais

### v2.2.0 - Base Múltiplos Arquivos

- ✅ **Múltiplos arquivos por aviso** - Base do sistema implementada
- ✅ **Interface básica** - Seleção múltipla funcional
- ✅ **Estrutura JSONB** - Preparação do banco de dados
- ✅ **Compatibilidade** - Sistema funciona com avisos antigos

### v2.1.0 - Sistema de Arquivos Completo

- ✅ **Upload de arquivos nos avisos** - PDF, TXT, DOC, DOCX (até 10MB)
- ✅ **Download system** - Botões estilizados para arquivos anexados
- ✅ **Cache de imagens** - Performance otimizada com retry automático
- ✅ **Toast corrigido** - Duração de 4s com botão de fechar
- ✅ **Interface moderna** - Cards compactos com modals detalhados
- ✅ **Componentes reutilizáveis** - PageHeader, EmptyState, DateUtils
- ✅ **Build otimizado** - 164KB gzipped, tempo de build 1.4s
- ✅ **Código limpo** - Arquivos temporários removidos

### v2.0.0 - Refatoração Completa

- ✅ Visual futurista com nova paleta de cores
- ✅ Sistema de notícias implementado
- ✅ Headers e layouts responsivos
- ✅ Branding atualizado (logo, metadados)
- ✅ Autenticação híbrida funcional

### v1.0.0 - Versão Base

- Sistema de documentos APC/ACE/RECIBOS
- Sistema de avisos
- Autenticação básica
- Interface inicial

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**BaúAcadêmico v2.3** - Sistema completo com múltiplos arquivos avançados! 🚀📚

_Desenvolvido com React + TypeScript + Supabase | Interface drag & drop e seleção múltipla funcionando perfeitamente_
