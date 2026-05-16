# VoyageMind: Assistente Inteligente de Roteiros de Viagem com Integração de IA e Arquitetura Limpa

**Alunos:**
- Henrique da Mata
- Nicolas Alcantara
- Kaique Basílio

---

## 1. Resumo
O projeto **VoyageMind** propõe uma plataforma web moderna e acessível voltada para o planejamento de viagens. A aplicação funciona como um assistente de turismo inteligente (alimentado pela IA Generativa do Google Gemini) e um "passaporte digital" onde os usuários podem registrar, visualizar e acompanhar estatísticas de suas viagens. O desenvolvimento englobou práticas modernas de Engenharia de Software, incluindo testes automatizados com Jest, arquitetura em camadas (Clean Architecture), autenticação via JWT, documentação de API com Swagger e preocupações contínuas com acessibilidade (a11y) no front-end.

## 2. Introdução
Com o avanço da inteligência artificial, o planejamento de roteiros turísticos, antes uma tarefa trabalhosa e demorada, pode ser automatizado e personalizado. O VoyageMind nasce com o objetivo de solucionar essa dor, integrando um assistente virtual conversacional focado em turismo e um gerenciador pessoal de memórias ("Passaportes"). 

Além da proposta de valor em nível de produto, o projeto possui um foco estrito em excelência técnica, servindo como demonstração da aplicação prática de padrões de projeto (*Design Patterns*), separação de responsabilidades (Clean Architecture) e segurança da informação.

## 3. Tecnologias e Ferramentas Utilizadas
A solução foi construída utilizando uma stack unificada em JavaScript/TypeScript:
- **Front-end:** React.js construído com Vite, garantindo performance e carregamento rápido.
- **Back-end:** Node.js com Express.
- **Banco de Dados:** SQLite, manipulado através do ORM Prisma.
- **Testes:** Jest (Unit testing da camada de Use Cases).
- **Segurança:** JSON Web Tokens (JWT) e Bcrypt para hash de senhas.
- **Documentação de API:** Swagger (OpenAPI).
- **Inteligência Artificial:** API do Google Gemini (gemini-2.5-flash).
- **Deploy:** Configurações preparadas para Vercel (Front-end) e Render (Back-end via Docker e `render.yaml`).

## 4. Arquitetura do Sistema
O back-end do VoyageMind sofreu uma refatoração profunda, abandonando um modelo MVC tradicional para adotar os princípios da **Clean Architecture** (Arquitetura Limpa) de Robert C. Martin. A estrutura atual está dividida nas seguintes camadas:

1. **Camada de Domínio (`src/domain`):**
   - **Entities:** Representam os objetos centrais do negócio (`User`, `Passport`), isolados de qualquer framework.
   - **Repositories Interfaces:** Interfaces que ditam os contratos de persistência de dados (`IUserRepository`, `IPassportRepository`), permitindo inversão de dependência (DIP - *Dependency Inversion Principle*).

2. **Camada de Aplicação (`src/application`):**
   - **Use Cases:** Contêm as regras de negócio puras (ex: `AuthUseCases`, `PassportUseCases`). É nesta camada onde a lógica de validação complexa acontece. Nenhuma dependência externa, como o Express ou o Prisma, entra aqui.

3. **Camada de Infraestrutura (`src/infrastructure`):**
   - **Web (Controllers & Routes):** Acopla os Use Cases aos objetos `Request` e `Response` do Express.
   - **Database (Prisma Repositories):** A implementação concreta das interfaces de repositório interagindo fisicamente com o banco SQLite através do Prisma.

## 5. Principais Funcionalidades (Features)
- **Assistente de Viagens IA:** Um chat integrado capaz de gerar roteiros completos com base em orçamentos, destinos e dias disponíveis, incluindo um "Modo Cego" (Blind Mode) para destinos surpresa.
- **CRUD de Passaportes:** O usuário autenticado pode criar um card representativo de sua viagem, guardando memórias através de título, descrição, tags e data de desbloqueio.
- **Atualização de Perfil:** (Feature Adicional) Edição de nome do usuário logado.
- **Dashboard de Estatísticas:** (Feature Adicional) Um painel visual que compila a quantidade de passaportes criados pelo usuário e um mapa de frequência das tags (ex: Praia, Aventura, Mistério).
- **Exclusão de Conta:** (Feature Adicional) Possibilidade do usuário deletar sua conta permanentemente. O banco garante a exclusão em cascata (Cascade Delete) de todos os dados e passaportes vinculados.

## 6. Implementações Técnicas e Requisitos Acadêmicos Atendidos

### 6.1. Testes Automatizados
A aplicação garante a resiliência do sistema através do **Jest**. Foram construídos *Mocks* das interfaces de repositório para testar a camada de `UseCases` de forma unitária e sem necessidade de conexão com o banco de dados.

### 6.2. Autenticação (JWT)
O sistema bloqueia rotas sensíveis utilizando Middlewares do Express que verificam o *Token JWT* injetado no cabeçalho (Header) `Authorization: Bearer <token>`. O JWT armazena o ID e o email do usuário na sua *payload* encriptada pela variável de ambiente `JWT_SECRET`.

### 6.3. Acessibilidade (A11y) no Front-end
Para garantir a universalidade da plataforma, foram adotadas as seguintes boas práticas:
- Tags semânticas (`<main>`, `<article>`, `<section>`, `<nav>`).
- Utilização de `aria-labels` em ícones, botões svg sem texto interno, e navegações de menu.
- Utilização de `aria-hidden="true"` para elementos puramente estéticos, invisibilizando-os para leitores de tela e reduzindo o ruído na navegação assistida.
- Suporte a navegação por teclado (Tab) mapeada adequadamente.

### 6.4. Configurações de Deploy (URL Pública)
Para levar a aplicação a um ambiente de produção (*Cloud*), os seguintes artefatos foram construídos:
- **Dockerfile e `render.yaml`:** Uma imagem containerizada do back-end em Node Alpine associada a um arquivo declarativo do Render.com. O arquivo yaml já especifica alocação de "Disk" (disco persistente) para não corromper o arquivo `.db` do SQLite em reinicializações efêmeras.
- **`vercel.json`:** Resolve o problema comum de Single Page Applications (SPA) em servidores estáticos, redirecionando todas as buscas de rotas para o `index.html`.

### 6.5. Documentação da API com Swagger
A rota `/api-docs` oferece uma interface gráfica alimentada pelo arquivo estático `swagger.json`. Ela mapeia detalhadamente os contratos de entrada (Payloads/Schemas) e de saída (Responses) dos principais microsserviços do módulo de Autenticação e Passaportes, explicitando também os esquemas de segurança requeridos (Bearer Authentication).

## 7. Conclusão
O projeto **VoyageMind** obteve êxito ao entregar não somente uma plataforma funcional com forte apelo visual, mas também por possuir um "motor" robusto. A adoção da Arquitetura Limpa proporcionou alta coesão e baixo acoplamento ao código, permitindo a fácil acoplagem de testes automatizados com Jest. Além disso, as adequações de acessibilidade e os preparos para deploy evidenciam a maturidade do processo de desenvolvimento, contemplando o ciclo de vida completo do software.

## 8. Telas da Aplicação

Abaixo estão os mockups e capturas de tela das principais funcionalidades e fluxos da aplicação:

### Landing Page
![Tela da Landing Page](./docs/images/landing-page.png)

### Login / Cadastro
![Tela de Login e Cadastro](./docs/images/login.png)

### Explore (Chat com IA)
![Tela do Assistente de IA](./docs/images/explore-chat.png)

### Passaportes (CRUD)
![Tela de Gerenciamento de Passaportes](./docs/images/passaportes.png)

### Perfil do Usuário
![Tela de Perfil do Usuário](./docs/images/perfil-usuario.png)
