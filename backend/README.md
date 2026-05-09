# VoyageMind Backend

Backend construído em Node.js e Express aplicando princípios da **Clean Architecture**.

## 👥 Integrantes
- Henrique da Mata
- Nicolas Alcantara
- Kaique Basílio

## 🌐 URL Pública
A API está hospedada no Render e acessível publicamente em:
[https://voyagemind-backend.onrender.com](https://voyagemind-backend.onrender.com)

## 🛠 Tecnologias Utilizadas
- **Node.js** com **Express**
- **TypeScript**
- **Prisma** (ORM) com **SQLite**
- **JWT** (JSON Web Tokens) e **Bcrypt** para autenticação/segurança
- **Jest** para testes unitários
- **Swagger** para documentação da API
- **Google Gemini API** para geração de roteiros

## 🚀 Como Rodar Localmente

1. Certifique-se de estar na pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. (Opcional) Gere o cliente Prisma e rode as migrações (se necessário, o banco default `dev.db` já está configurado):
   ```bash
   npx prisma generate
   ```
4. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🧪 Como Rodar os Testes

Este projeto conta com uma suíte de testes unitários construídos com **Jest**. Para rodar todos os testes (ex: `AuthUseCases.spec.ts`, `PassportUseCases.spec.ts`):

```bash
npm test
```

## 📚 Documentação da API (Swagger)

A API possui sua documentação interativa baseada no padrão OpenAPI.
Com o servidor rodando localmente, acesse a interface do Swagger no navegador em:

```
http://localhost:3333/api-docs
```
