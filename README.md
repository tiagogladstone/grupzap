# Grupzap

SaaS de gestão de grupos WhatsApp com automação e analytics.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL + Auth)
- **WhatsApp API:** UAZAPI
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (páginas e rotas)
│   ├── (auth)/             # Rotas de autenticação
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   └── page.tsx            # Landing page
├── components/
│   ├── auth/               # Componentes de autenticação
│   └── landing/            # Componentes da landing page
├── hooks/                  # React hooks customizados
├── lib/
│   ├── supabase/           # Cliente Supabase
│   └── uazapi/             # Cliente UAZAPI
└── types/                  # TypeScript types
```

## 🚀 Setup Local

### Pré-requisitos

- Node.js 18+
- pnpm (recomendado) ou npm

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/grupzap.git
cd grupzap

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Rode o servidor de desenvolvimento
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia servidor de desenvolvimento |
| `pnpm build` | Gera build de produção |
| `pnpm start` | Roda build de produção |
| `pnpm lint` | Executa ESLint |

## 🔐 Variáveis de Ambiente

Veja `.env.example` para a lista completa. Variáveis necessárias:

- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anon do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave service role (backend)
- `UAZAPI_BASE_URL` - URL base da API UAZAPI
- `UAZAPI_TOKEN` - Token de autenticação UAZAPI

## 📚 Documentação

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [UAZAPI Docs](https://doc.uazapi.com/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

## 📄 Licença

Proprietário - Todos os direitos reservados.
