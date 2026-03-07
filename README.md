# VoyageMind

Este repositório contém o projeto **VoyageMind**, um aplicativo full-stack com **React + TypeScript + Vite** no frontend e **Node + Express + Prisma** no backend.

Este README explica como configurar e executar o projeto em outra máquina.

---

## 🚀 Pré-requisitos

- **Node.js** (recomendado v18+)
- **npm** (vem junto com o Node)
- (Opcional) **Git** para clonar o repositório

---

## 🧰 Clonar o repositório

```bash
git clone https://github.com/damata09/VoyageMind.git
cd VoyageMind
```

---

## 🔧 Instalar dependências

O projeto possui duas pastas com dependências: a raiz (frontend) e `backend`.

### 1) Frontend

```bash
npm install
```

### 2) Backend

```bash
cd backend
npm install
cd ..
```

---

## 🏃‍♂️ Executar o projeto localmente

### 1) Iniciar a API (backend)

A partir da raiz do repositório:

```bash
cd backend
npm run dev
```

Isso inicia o servidor backend (geralmente em `http://localhost:4000`).

### 2) Iniciar o app frontend

Em um terminal separado, a partir da raiz do repositório:

```bash
npm run dev
```

O frontend (Vite) normalmente roda em `http://localhost:5173`.

---

## 🧩 Variáveis de ambiente

Se o backend precisar de variáveis de ambiente, crie um arquivo `.env` dentro de `backend/`.

Exemplo (crie `backend/.env`):

```env
DATABASE_URL="file:./dev.db"
```

> ⚠️ Não publique segredos (tokens, chaves, credenciais) no repositório público.

---

## ✅ Build para produção

### Frontend

```bash
npm run build
```

### Backend

No desenvolvimento, rode `npm run dev` (não é necessário build).

---

## 🧪 Observações

- O projeto usa **Prisma** para acesso ao banco de dados. O arquivo de banco padrão está em `backend/dev.db`.
- Você pode ajustar a porta ou outras configurações do backend em `backend/src/index.ts`.

---

Se quiser, posso adicionar também:

- instruções para rodar migrações Prisma (`npx prisma migrate dev`)
- um fluxo de CI (GitHub Actions) para deploy automático
- screenshots ou uma seção "Como começar" passo a passo.