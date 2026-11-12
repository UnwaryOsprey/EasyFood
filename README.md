# 🍽️ EasyFood

> Aplicação web para gerenciar restaurantes e cardápios, com autenticação JWT, upload de imagens otimizadas e envio de e-mails.

![Node.js](https://img.shields.io/badge/Node.js-v22-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-lightgrey?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)

Projeto da disciplina **Software Architecture & Design Patterns**.

## 📸 Funcionalidades

- **Autenticação**: cadastro, login e consulta do usuário logado (JWT).
- **Restaurantes**: cadastrar, listar, editar e excluir (somente o dono altera), com filtro por categoria e estatísticas.
- **Cardápio**: cadastrar, editar e excluir pratos (somente o dono do restaurante).
- **Imagens**: foto do restaurante, do prato e do perfil do usuário. Enviadas com Multer, otimizadas com Sharp (WebP, até 800 px) e servidas em `/uploads`.
- **E-mail**: o dono recebe uma confirmação ao cadastrar um restaurante (MailerSend). Se o envio falhar, o cadastro continua funcionando.

## 🏗️ Arquitetura

Monólito modular em camadas:

```
Rota → Middleware (JWT) → Controller → Service → Prisma → SQLite
```

Serviços reutilizáveis ficam em `src/modules/shared/` (e-mail, processamento de imagens e upload), usados por mais de um módulo.

```
EASYFOOD/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── lib/
│   │   └── prisma.js
│   ├── middlewares/
│   │   └── authMiddleware.js          # verifyJWT
│   └── modules/
│       ├── auth/                      # cadastro, login, /auth/me
│       ├── users/                     # foto de perfil
│       ├── restaurants/               # CRUD + foto do restaurante
│       ├── dishes/                    # cardápio + foto do prato
│       └── shared/
│           ├── email.service.js       # envio de e-mails (MailerSend)
│           ├── image.service.js       # otimiza e salva/apaga imagens
│           └── upload.middleware.js   # Multer (5 MB; jpeg/png/webp)
├── public/                            # frontend (HTML, CSS e JS puro)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/adr/                          # decisões arquiteturais
├── uploads/                           # imagens enviadas (fora do Git)
├── .env                               # segredos (fora do Git)
└── package.json
```

## 🚀 Como rodar

**Pré-requisitos:** Node.js 22 ou superior e npm.

```bash
git clone URL-DO-REPOSITORIO
cd easyfood
npm install
```

Crie o arquivo `.env` na raiz (veja a seção abaixo), depois prepare o banco e inicie:

```bash
npx prisma migrate dev
npx prisma generate
npm run dev
```

Acesse `http://localhost:3000`.

### Scripts

| Script | Descrição |
|---|---|
| `npm start` | Inicia o servidor |
| `npm run dev` | Inicia com reinício automático (`--watch`) |
| `npm run migrate` | Executa `prisma migrate dev` |

## 🔐 Variáveis de ambiente (`.env`)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="uma-chave-longa-e-secreta"
PORT=3000

# E-mail (MailerSend)
MAILERSEND_API_KEY="sua-chave"
EMAIL_FROM="noreply@seu-dominio.mlsender.net"
EMAIL_FROM_NAME="EasyFood"
```

> ⚠️ Nunca envie o `.env` para o GitHub. No plano gratuito/de teste do MailerSend, só o e-mail do dono da conta recebe mensagens.

## 📖 API

Rotas marcadas com 🔒 exigem `Authorization: Bearer {token}`.

### Autenticação e usuário
```
POST /auth/register
POST /auth/login
GET  /auth/me                       🔒  dados do usuário logado (inclui imageUrl)
POST /users/me/image                🔒  foto de perfil (multipart, campo "image")
```

### Restaurantes
```
GET    /restaurants                 lista restaurantes
GET    /my-restaurants              🔒  restaurantes do usuário
POST   /restaurants                 🔒  cria (envia e-mail de confirmação)
PUT    /restaurants/:id             🔒  edita (somente o dono)
DELETE /restaurants/:id             🔒  exclui (somente o dono)
POST   /restaurants/:id/image       🔒  foto do restaurante (somente o dono)
```

### Pratos
```
GET    /restaurants/:restaurantId/dishes   lista o cardápio (público)
POST   /restaurants/:restaurantId/dishes   🔒  cadastra prato (somente o dono)
PUT    /dishes/:dishId                     🔒  edita prato (somente o dono)
DELETE /dishes/:dishId                     🔒  exclui prato e foto (somente o dono)
POST   /dishes/:dishId/image               🔒  envia/troca a foto
DELETE /dishes/:dishId/image               🔒  remove só a foto
```

### Códigos de resposta mais comuns

| Código | Quando |
|---|---|
| 400 | Dados inválidos, arquivo que não é jpeg/png/webp ou campo `image` ausente |
| 401 | Token ausente ou inválido |
| 403 | Usuário autenticado, mas não é o dono do recurso |
| 404 | Restaurante, prato ou usuário não encontrado |
| 413 | Imagem maior que 5 MB |

### Exemplo: enviar foto de um prato (Postman)

`POST /dishes/2/image` → aba **Body → form-data** → chave `image` (tipo **File**) → Authorization **Bearer Token**.

Resposta: o prato com `imageUrl: "/uploads/dishes/<uuid>.webp"`, que abre direto no navegador.

## 🗄️ Banco de dados (Prisma + SQLite)

- **User**: id, name, email (único), password (hash bcrypt), imageUrl, createdAt
- **Restaurant**: id, name, category, description, address, phone, rating, imageUrl, userId (→ User)
- **Dish**: id, name, description, price (Decimal), imageUrl, restaurantId (→ Restaurant, exclusão em cascata)

Para visualizar os dados: `npx prisma studio`.

## 🔒 Segurança

- Senhas com bcrypt.
- JWT com expiração de 1 dia.
- Autorização por dono: editar, excluir e enviar imagens só para o dono do recurso (403 para os demais).
- Upload restrito a jpeg/png/webp, com limite de 5 MB. Nomes de arquivo gerados pelo servidor (UUID).
- Apagar imagem do disco só dentro da pasta `uploads/`.
- Frontend monta o HTML de forma segura, evitando XSS.
- Consultas protegidas pelo Prisma contra SQL Injection.

## 🧠 Decisões arquiteturais (ADRs)

Em `docs/adr/`:

- **ADR-001**: armazenar restaurantes em memória (ponto de partida)
- **ADR-002**: escolha do banco de dados
- **ADR-003**: persistência com SQLite
- **ADR-004**: autenticação com JWT
- **ADR-005**: arquitetura em camadas
- **ADR-006**: envio de e-mails com MailerSend
- **ADR-007**: processamento de imagens com Multer e Sharp (serviço compartilhado)

## 🐛 Problemas comuns

- **`Unknown field imageUrl`**: o Prisma não foi atualizado. Rode `npx prisma migrate dev` e `npx prisma generate` e reinicie o servidor.
- **`Cannot find package 'sharp'` ou `'multer'`**: rode `npm install`.
- **Site preso em "Preparando seu catálogo…"**: o servidor está com erro ou o token expirou. Veja o terminal e faça login de novo.
- **Alterei o `app.js` do site e nada mudou**: o servidor guarda `/assets` em cache por 1 hora. Troque o `?v=` no `index.html` e use Ctrl+Shift+R.
- **E-mail não chegou**: no MailerSend de teste, só o e-mail do dono da conta recebe. O cadastro do restaurante funciona mesmo se o e-mail falhar.

## 🚧 Próximos passos

- Recuperação de senha
- Testes automatizados
- Validação com Zod
- Paginação e busca
- Armazenamento de imagens em nuvem (S3 ou similar) em vez do disco local

## 👨‍💻 Autor

Cláudio Rodrigues — projeto acadêmico.
