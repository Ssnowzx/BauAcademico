# BaúAcadêmico

Sistema completo de gestão de comprovantes acadêmicos, provas/trabalhos e notícias desenvolvido com React + TypeScript + Supabase.

## ✨ Funcionalidades

### 📁 Gestão de Documentos Acadêmicos

- **APC (Atividades Práticas Curriculares)**: Upload com campos extras (Nome do Evento, Horas, Data do Evento)
- **ACE (Atividades Complementares de Ensino)**: Upload com os mesmos campos do APC
- **RECIBOS (Comprovantes de Mensalidade)**: Upload simples de comprovantes
- **PROVAS/TRABALHO**: Upload público de provas e trabalhos com campos Nota e Matéria
- **Visualização** completa com detalhes e cálculo automático de médias
- **Exclusão** segura de documentos
- **Persistência inteligente**: Totais calculados dinamicamente

### 📢 Sistema de Avisos

- **Painel administrativo** completo para criar/editar/excluir avisos
- **Upload de múltiplos arquivos** - PDFs, DOCs, TXTs, imagens
- **Interface drag & drop** para seleção de arquivos
- **Download otimizado** com botões individuais para cada arquivo
- **Gestão individual** - remoção e preview de arquivos selecionados

### 📰 Sistema de Notícias

- **Página pública** para visualizar notícias
- **Painel administrativo** para CRUD completo
- **Upload de imagens** com cache e retry automático
- **Cards responsivos** com modal detalhado

### 🔐 Autenticação

- **Acesso público** para visualização de documentos, avisos e notícias
- **Login administrativo** via Supabase Auth para gestão de conteúdo
- **Sistema híbrido** com localStorage para desenvolvimento

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Shadcn/ui + Tailwind CSS + Radix UI + Lucide React
- **Backend**: Supabase (Auth + Database + Storage)
- **Banco**: PostgreSQL com RLS
- **Storage**: Supabase Storage (buckets públicos)
- **Deploy**: Preparado para Vercel/Netlify

## 🚀 Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Conta no Supabase

### Instalação

1. **Clone o repositório**

   ```bash
   git clone <seu-repositorio>
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

   Execute as migrações no SQL Editor do Supabase:

   ```bash
   # Execute os arquivos na ordem:
   supabase/migrations/20250817211355_*.sql
   supabase/migrations/20250826*.sql
   supabase/migrations/20250830*.sql
   supabase/migrations/20250901000000_create_noticias_table.sql
   supabase/migrations/20250901140253_add_file_support_to_avisos.sql
   supabase/migrations/20250901143000_multiple_files_avisos.sql
   ```

5. **Configure o Storage**

   No painel do Supabase, crie buckets públicos:

   - `documents` - Para documentos acadêmicos
   - `avisos` - Para arquivos de avisos
   - `noticias` - Para imagens de notícias
   - `provas` - Para provas e trabalhos

6. **Inicie o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

7. **Acesse a aplicação**
   - Abra http://localhost:5173
   - Sistema funciona público para uploads
   - Use login admin para gerenciar avisos/notícias

## � Estrutura do Banco

### Tabelas Principais

- **`users`** - Usuários administrativos
- **`documents`** - Documentos acadêmicos (APC, ACE, RECIBOS)
- **`provas`** - Provas e trabalhos com notas e matérias
- **`avisos`** - Sistema de avisos com múltiplos arquivos
- **`noticias`** - Sistema de notícias

### Storage Buckets

- **`documents`** - Documentos acadêmicos
- **`avisos`** - Arquivos de avisos (múltiplos formatos)
- **`noticias`** - Imagens de notícias
- **`provas`** - Provas e trabalhos (público)

## 🎨 Design System

### Paleta de Cores (OKLCH)

- **Primary**: Roxo vibrante para elementos principais
- **Secondary**: Laranja para notícias
- **Accent**: Vermelho para avisos
- **Success**: Verde para ações positivas

### Componentes UI

- Cards com bordas customizadas (1px topo/esquerda + 6px direita/baixo)
- Botões consistentes com estados hover/active
- Toast notifications com duração adequada
- Modais responsivos para detalhes
- Interface drag & drop para uploads

## 📱 Funcionalidades Públicas

- ✅ Upload de provas/trabalhos sem restrições
- ✅ Visualização de avisos e arquivos para download
- ✅ Leitura de notícias
- ✅ Cálculo automático de médias de provas
- ✅ Interface responsiva mobile/tablet/desktop

## 🔧 Status do Projeto

✅ **PROJETO 100% FUNCIONAL v3.0**

- ✅ Sistema de provas/trabalhos público implementado
- ✅ Bucket `provas` configurado com policies abertas
- ✅ Upload e persistência funcionando perfeitamente
- ✅ Cálculo de médias automático por matéria
- ✅ Interface limpa e responsiva
- ✅ Múltiplos arquivos nos avisos
- ✅ Cache de imagens otimizado
- ✅ Código limpo sem arquivos temporários
- ✅ Build otimizado para produção

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

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

✅ **PROJETO 100% FUNCIONAL E OTIMIZADO v2.5**

- **🆕 MIGRAÇÃO COMPLETA PARA OKLCH** - Paleta de cores moderna e vibrante implementada
- **🆕 BORDAS CUSTOMIZADAS FUNCIONANDO** - Cards com bordas roxas: 1px (topo/esquerda) + 6px (direita/baixo)
- **🆕 TEMA ESCURO REMOVIDO** - Sistema otimizado apenas para tema claro
- **🆕 CSS LIMPO E INLINE** - Bordas aplicadas via estilos inline para máxima compatibilidade
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
5. **hours_log** - Histórico de inserções de horas por usuário/categoria (usado para calcular o total de horas)

### Migração SQL

Execute as migrações na pasta `supabase/migrations/`:

````bash
# Tabelas principais
20250817211355_*.sql
## 📚 Documentação Adicional

### Credenciais de Acesso

**Para Desenvolvimento:**
- Qualquer username/password funciona
- Sistema detecta automaticamente se é desenvolvimento

**Para Produção:**
- Crie conta através do sistema de signup
- Configure permissões de admin manualmente no banco

### Scripts NPM

```bash
npm run dev       # Servidor de desenvolvimento (localhost:5173)
npm run build     # Build para produção
npm run preview   # Preview da build de produção
npm run lint      # Verificação de código com ESLint
````

### Estrutura de Arquivos

```
src/
├── components/ui/        # Componentes shadcn/ui
├── contexts/             # Contextos React (Auth, Theme)
├── hooks/               # Custom hooks
├── integrations/        # Serviços Supabase
├── lib/                 # Utilitários (date-utils, utils)
├── pages/               # Páginas da aplicação
└── App.tsx              # Componente principal
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 Deploy em Produção

### Preparação

1. **Configure as variáveis de ambiente** no seu provedor
2. **Execute as migrações** no Supabase em produção
3. **Configure os buckets** como públicos
4. **Teste a aplicação** em staging

### Provedores Recomendados

- **Vercel**: Deploy automático com GitHub
- **Netlify**: Configuração simples e CDN global
- **Supabase**: Hosting integrado com backend

### Build e Performance

- **Tamanho**: ~165KB gzipped
- **Build time**: ~1.4s
- **Dependencies**: Apenas essenciais
- **Tree shaking**: Otimizado automaticamente

## ⚡ Performance e Otimizações

### Carregamento de Imagens

- **Cache inteligente**: Evita recarregar imagens desnecessariamente
- **Retry automático**: Tenta novamente em caso de falha
- **Placeholder**: Imagem padrão para erros de carregamento
- **Lazy loading**: Componentes carregados sob demanda

### Experiência do Usuário

- **Toast notifications**: Feedback visual adequado (4s duração)
- **Loading states**: Spinners para operações assíncronas
- **Error boundaries**: Tratamento robusto de erros
- **Responsive design**: Mobile-first, tablet e desktop

## 🔧 Solução de Problemas

### Problemas Comuns

**Upload falha:**

- Verificar configuração do bucket no Supabase
- Conferir se bucket está público
- Sistema tem fallback para base64

**Autenticação não funciona:**

- Verificar variáveis de ambiente
- Sistema funciona sem Supabase em desenvolvimento

**Imagens não carregam:**

- Verificar URLs do Storage
- Sistema usa cache e retry automático

### Debug

**Logs do Console:**

- Informações de upload e download
- Status de autenticação
- Erros de API

**Network Tab:**

- Verificar requisições para Supabase
- Conferir códigos de status HTTP

## � Próximas Funcionalidades

### Roadmap

- [ ] **OCR Integration**: Extração automática de texto
- [ ] **Analytics Dashboard**: Estatísticas de uso
- [ ] **Push Notifications**: Alertas para novos avisos
- [ ] **Mobile App**: React Native ou PWA
- [ ] **Advanced Search**: Busca por conteúdo e metadados

### Melhorias de UX

- [ ] **Filtros avançados**: Por data, categoria, tipo
- [ ] **Bulk operations**: Seleção múltipla para exclusão
- [ ] **Preview modal**: Visualizar documentos sem download
- [ ] **Compression**: Otimização automática de imagens

## 📝 Changelog Resumido

### v3.0 (Atual)

- ✅ Sistema de provas/trabalhos público
- ✅ Cálculo automático de médias
- ✅ Bucket específico configurado
- ✅ Código limpo sem arquivos temporários

### v2.5

- ✅ Migração completa para paleta OKLCH
- ✅ Bordas customizadas funcionando
- ✅ Tema escuro removido

### v2.3

- ✅ Upload de múltiplos arquivos
- ✅ Interface drag & drop
- ✅ Gestão individual de arquivos

---

**Desenvolvido com ❤️ usando React + TypeScript + Supabase**

> Sistema completo de gestão acadêmica com interface moderna e funcionalidades robustas.

- [ ] **Paleta Oklch**: Usar apenas cores do `:root`, não adicionar outras
- [ ] **Tema escuro**: NÃO reativar, sistema usa apenas tema claro
- [ ] **Data utils**: Usar `/src/lib/date-utils.ts`, não importar `date-fns` diretamente
- [ ] **CSS limpo**: Evitar duplicações, usar variáveis CSS
- [ ] **TypeScript**: Manter tipagem completa, resolver erros de build
- [ ] **Performance**: Build deve ficar ~165KB gzipped
- [ ] **Compatibilidade**: Testar bordas em Chrome, Firefox, Safari

## 🎨 Sistema de Tema e Cores (IMPORTANTE PARA DEVS)

### Paleta Oklch Implementada

O sistema usa **exclusivamente** a paleta Oklch fornecida em `/src/index.css`:

```css
:root {
  --background: oklch(0.9399 0.0203 345.6985);
  --foreground: oklch(0.4712 0 0);
  --card: oklch(0.9498 0.05 86.8891);
  --primary: oklch(0.6006 0.2425 293.8885);
  --secondary: oklch(0.8095 0.0694 198.1863);
  --border: oklch(0.65 0.28 303.9);
  /* ... mais cores */
}
```

### ⚠️ Bordas Customizadas dos Cards

**ATENÇÃO:** As bordas dos cards são aplicadas via **estilos inline** nos componentes:

- **Dashboard.tsx**: Cards com bordas roxas customizadas
- **AdminPage.tsx**: Cards com bordas roxas customizadas

```tsx
// Exemplo de implementação das bordas
<Card
  style={{
    borderTop: '1px solid oklch(0.65 0.28 303.9)',
    borderLeft: '1px solid oklch(0.65 0.28 303.9)',
    borderRight: '6px solid oklch(0.65 0.28 303.9)',
    borderBottom: '6px solid oklch(0.65 0.28 303.9)',
    borderRadius: '0.75rem',
    boxShadow: '0 6px 16px color-mix(in oklch, oklch(0.65 0.28 303.9), transparent 65%)'
  }}
>
```

**Por que estilos inline?**

- CSS externo era sobrescrito pelo Tailwind
- Especificidade máxima garantida
- Solução testada e funcional

### 🚫 Tema Escuro Removido

- **Sistema de Tema**: Completamente removido (desnecessário)
- **CSS**: Todas as classes `.dark` foram removidas
- **Componentes**: Sistema de tema foi deletado
- **Tailwind**: `darkMode` removido do config
- **Tema fixo**: Aplicação usa apenas tema claro

### 📁 Arquivos Principais

- **`/src/index.css`**: Contém toda a paleta Oklch e estilos base
- **`/src/contexts/AuthContext.tsx`**: Context de autenticação
- **`/tailwind.config.ts`**: Configuração sem darkMode
- **`/src/App.tsx`**: App principal sem sistema de tema

## 🔧 Guia para Desenvolvedores

### Estrutura de Arquivos Importantes

```
src/
├── index.css                 # 🎨 PALETA OKLCH + Estilos base
├── contexts/
│   ├── AuthContext.tsx       # Context de autenticação
│   └── auth-shared.ts        # Tipos compartilhados de auth
├── pages/
│   ├── Dashboard.tsx         # 🔲 Cards com bordas inline
│   └── AdminPage.tsx         # 🔲 Cards com bordas inline
├── components/ui/
│   └── card.tsx             # Componente base dos cards
└── lib/
    └── date-utils.ts        # Utilitários de data centralizados
```

### ⚠️ Notas Importantes para Modificações

1. **Bordas dos Cards**:

   - NÃO remover estilos inline dos cards
   - CSS externo não funciona devido ao Tailwind
   - Manter especificação: 1px (topo/esquerda) + 6px (direita/baixo)

2. **Cores**:

   - Usar APENAS valores Oklch do `:root`
   - NÃO adicionar tema escuro
   - NÃO modificar paleta sem consenso

3. **CSS**:

   - `/src/index.css` é o arquivo principal
   - Evitar duplicação de regras
   - Usar variáveis CSS quando possível

4. **Data/Formatação**:
   - Usar `/src/lib/date-utils.ts` para datas
   - NÃO importar `date-fns` diretamente
   - Função `formatarData()` padronizada

### 🧪 Como Testar Bordas

Se as bordas dos cards não aparecerem:

1. ✅ Verificar estilos inline nos componentes
2. ✅ Confirmar valores Oklch no navegador
3. ✅ Testar em diferentes browsers
4. ❌ NÃO tentar resolver via CSS externo

### 📦 Dependências Principais

- React 18 + TypeScript + Vite
- Tailwind CSS (configurado sem darkMode)
- Shadcn/ui + Radix UI
- Supabase (Auth + Database + Storage)
- Date-fns (centralizado em date-utils)

##  Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🔗 Links Úteis

- [Supabase Docs](https://supabase.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React Documentation](https://react.dev)

---

**BaúAcadêmico** - Sistema de gestão acadêmica moderno e responsivo 🎓
