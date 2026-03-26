# Sistema Funilaria

Aplicação web para gestão de **ordens de serviço** em funilaria: painel de OS, cadastro, edição, fotos, relatórios e exportação em PDF.

## Estrutura do repositório

Monorepo com duas pastas principais:

| Pasta      | Descrição                                      |
| ---------- | ---------------------------------------------- |
| `backend/` | API REST em **NestJS** + **TypeORM** + SQLite |
| `frontend/`| Interface em **React 19** + **Vite** + **Tailwind CSS** |

## Tecnologias

- **Backend:** NestJS 11, TypeORM, SQLite, Multer (upload de fotos), PDFKit / ExcelJS (relatórios e exportações)
- **Frontend:** React 19, React Router, Recharts, Vite 8, Tailwind CSS 4

## Pré-requisitos

- [Node.js](https://nodejs.org/) (recomendado: LTS atual)
- npm (vem com o Node)

## Como rodar em desenvolvimento

### 1. Backend

```bash
cd backend
npm install
npm run start:dev
```

A API sobe em **http://localhost:3000** (ou na porta definida pela variável `PORT`).

- Banco SQLite: arquivo `backend/database.sqlite` (criado na primeira execução; está no `.gitignore`).
- Fotos: servidas em `/uploads/` a partir da pasta `backend/uploads/` (conteúdo ignorado pelo Git, exceto `.gitkeep`).

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O Vite costuma usar **http://localhost:5173**. O frontend chama a API em `http://localhost:3000` por padrão.

### Variáveis de ambiente (frontend)

Opcional: criar `frontend/.env` com a URL da API se não for o padrão:

```env
VITE_API_URL=http://localhost:3000
```

## Scripts úteis

**Backend** (`backend/`)

- `npm run start:dev` — API com reload
- `npm run build` — compila para `dist/`
- `npm run start:prod` — executa `dist/main` (após `build`)
- `npm run test` — testes unitários

**Frontend** (`frontend/`)

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — pré-visualiza o build

## Funcionalidades (visão geral)

- **Dashboard** (`/`) — listagem e filtros de ordens de serviço, resumo, alteração de status
- **Nova ordem** (`/nova`) — cadastro de OS (cliente, veículo, serviços, etc.)
- **Relatórios** (`/relatorios`) — painel com gráficos e exportações
- **Fotos** por ordem (upload e listagem via API)
- **Exportação PDF** e relatórios via endpoints em `ordens-servico` (consulte o controller no backend para parâmetros)

A API principal está sob o prefixo **`/ordens-servico`** (CRUD, resumo, fotos, exportações).

## Documentação adicional

- `backend/README.md` — texto padrão do template NestJS (instalação e testes do framework)
- `frontend/README.md` — informações do template Vite + React

## Licença

Os pacotes `backend` e `frontend` estão marcados como privados no `package.json`. Ajuste a licença conforme o uso do seu projeto.
