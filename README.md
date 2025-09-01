# BaúAcadêmico

Sistema completo de gestão de comprovantes acadêmicos e notícias desenvolvido com React + TypeScript + Supabase.

## Resumo

- **Sistema completamente refatorado** - Visual futurista, responsivo e moderno
- Upload e gestão de documentos acadêmicos com categorização inteligente
- Sistema de avisos e notícias com painel administrativo
- Autenticação híbrida (Supabase Auth + localStorage)
- Interface totalmente responsiva (mobile/tablet/desktop)
- Branding atualizado com nova identidade visual

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

### 📢 Sistema de Avisos

- Painel administrativo para criar/editar/excluir avisos
- Upload de imagens para avisos
- Visualização pública de comunicados
- Interface responsiva para gestão

### 📰 Sistema de Notícias (NOVO)

- Página pública para visualizar notícias
- Painel administrativo para CRUD de notícias
- Upload de imagens para notícias
- Acesso público para leitura, apenas admin pode escrever
- Card dedicado no Dashboard

## Status do Projeto

✅ **PROJETO REFATORADO E ATUALIZADO**

- Todos os recursos funcionais e testados
- Visual futurista com paleta azul/roxo moderna
- Headers e layouts responsivos em todas as páginas
- Branding atualizado (logo, metadados, README)
- Sistema de notícias implementado
- Código limpo - removidos arquivos e componentes não utilizados
- Fallbacks robustos para desenvolvimento e produção

## Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Shadcn/ui + Tailwind CSS + Radix UI
- **Backend**: Supabase (Auth + Database + Storage)
- **Banco**: PostgreSQL
- **Storage**: Supabase Storage (buckets públicos)
- **Deploy**: Preparado para Vercel/Netlify

## Status Atual

✅ **Refatoração Visual Completa**: Sistema com visual futurista e responsivo  
✅ **Sistema de Notícias**: Página pública + admin implementado  
✅ **Upload de Documentos**: Funcionando com fallback para base64  
✅ **Autenticação Híbrida**: Supabase Auth + localStorage  
✅ **Código Limpo**: Arquivos e componentes não utilizados removidos  
⚠️ **Próximos Passos**: Reabilitar RLS e políticas de segurança (opcional)

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

### Migrações Necessárias

Execute no SQL Editor do Supabase:

```sql
-- 1. Tabelas principais (users, documents, avisos)
-- Execute: supabase/migrations/20250817211355_*.sql

-- 2. Tabela de notícias
-- Execute: supabase/migrations/20250901000000_create_noticias_table.sql
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

### Tabela `avisos`

- `id` (UUID) - Chave primária
- `title` (TEXT) - Título do aviso
- `description` (TEXT) - Descrição
- `image_url` (TEXT) - URL da imagem (opcional)
- `created_at` (TIMESTAMP) - Data de criação

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
- **Notificações**: Sonner
- **Ícones**: Lucide React

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

### Funcionalidades

- ✅ Upload de documentos com campos dinâmicos
- ✅ Sistema de avisos com imagens
- ✅ Sistema de notícias completo
- ✅ Autenticação híbrida funcional
- ✅ Persistência de sessão

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

### v2.0.0 (Atual) - Refatoração Completa

- ✅ Visual futurista com nova paleta de cores
- ✅ Sistema de notícias implementado
- ✅ Headers e layouts responsivos
- ✅ Código limpo - removidos arquivos não utilizados
- ✅ Branding atualizado (logo, metadados)
- ✅ Autenticação híbrida funcional
- ✅ Upload com fallback para base64

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

**BaúAcadêmico v2.0** - Sistema completo de gestão acadêmica com visual futurista! 🚀📚

_Desenvolvido com React + TypeScript + Supabase_
