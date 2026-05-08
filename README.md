# SoundStore

Plataforma de e-commerce de instrumentos musicais desenvolvida como projeto final do curso técnico de programação. O projeto é composto por três partes: uma API backend, um site web e uma app móvel.

---

## Estrutura do Projeto

```
Projeto Final/
├── projeto-final-backend/   # API REST em ASP.NET Core 8
├── projeto-final-frontend/  # Site web em React 19 + Vite
└── projeto-final-mobile/    # App móvel em React Native + Expo
```

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Base de dados | SQL Server |
| API | ASP.NET Core 8 (C#) |
| Site web | React 19 + Vite |
| App móvel | React Native + Expo |
| Autenticação | JWT + Google OAuth 2.0 |
| Email | Gmail SMTP |
| Logging | Serilog |

---

## Funcionalidades

### Site Web
- Catálogo de produtos com categorias, subcategorias, pesquisa e filtros por marca e preço
- Carrossel de destaques e produtos em promoção
- Página de detalhe de produto com galeria de imagens
- Carrinho de compras com sincronização para a conta do utilizador
- Checkout com morada de entrega
- Registo com confirmação de email
- Login com email/password ou Google
- Autenticação de dois fatores (2FA) por email
- Recuperação de password por email
- Perfil de utilizador (editar dados, alterar password, ativar/desativar 2FA)
- Histórico de encomendas com preços no momento da compra
- Modo escuro
- Chatbot de apoio

### Painel de Administração
- Gestão de utilizadores (criar, editar, eliminar)
- Gestão de produtos (criar, editar, eliminar, imagens, stock, desconto)
- Gestão de categorias e subcategorias
- Gestão de marcas
- Gestão de encomendas (alterar estado, cancelar com reposição de stock)
- Logs de atividade do administrador

### App Móvel
- Catálogo com categorias, pesquisa e filtros por marca e preço
- Filtros persistentes ao mudar de categoria
- Carrinho de compras com merge automático ao fazer login
- Histórico de encomendas
- Login com email/password
- Notificações push (requer dispositivo físico)

---

## Pré-requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server Express](https://www.microsoft.com/sql-server)
- [Expo CLI](https://expo.dev/) e Android Studio (para o emulador)

---

## Como Executar

### 1. Base de Dados

Cria a base de dados `ProjetoFinal_ATEC` no SQL Server e executa os scripts de criação de tabelas.

A connection string está em `projeto-final-backend/appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=.\\sqlexpress;Database=ProjetoFinal_ATEC;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

### 2. Backend

```bash
cd projeto-final-backend
dotnet run
```

A API fica disponível em `http://localhost:5074`.

### 3. Frontend Web

```bash
cd projeto-final-frontend
npm install
npm run dev
```

O site fica disponível em `http://localhost:5173`.

### 4. App Móvel

```bash
cd projeto-final-mobile
npm install
npx expo run:android
```

> Para notificações push é necessário dispositivo físico. O emulador não suporta o serviço FCM da Google.

---

## Arquitetura

```
Browser / App Móvel
        │
        │ HTTP (JSON)
        ▼
API ASP.NET Core 8  ──► SQL Server
        │
        ├── JWT (autenticação)
        ├── Google OAuth 2.0
        └── Gmail SMTP (confirmação de email, 2FA)
```

### Backend — Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Registo de utilizador |
| GET | `/api/auth/confirm-email` | Confirmação de email |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/verify-2fa` | Verificação 2FA |
| POST | `/api/auth/google-login` | Login com Google |
| POST | `/api/auth/forgot-password` | Recuperação de password |
| POST | `/api/auth/reset-password` | Redefinição de password |
| POST | `/api/auth/change-password` | Alteração de password |
| GET | `/api/auth/me` | Dados do utilizador autenticado |
| PUT | `/api/auth/profile` | Atualizar perfil |
| POST | `/api/auth/toggle-2fa` | Ativar/desativar 2FA |
| GET | `/api/produtos` | Lista de produtos |
| GET | `/api/produtos/{id}` | Detalhe de produto |
| POST | `/api/produtos` | Criar produto (admin) |
| PUT | `/api/produtos/{id}` | Editar produto (admin) |
| DELETE | `/api/produtos/{id}` | Eliminar produto (admin) |
| GET | `/api/categorias` | Lista de categorias |
| POST | `/api/categorias` | Criar categoria (admin) |
| PUT | `/api/categorias/{id}` | Editar categoria (admin) |
| DELETE | `/api/categorias/{id}` | Eliminar categoria (admin) |
| GET | `/api/marcas` | Lista de marcas |
| POST | `/api/marcas` | Criar marca (admin) |
| PUT | `/api/marcas/{id}` | Editar marca (admin) |
| DELETE | `/api/marcas/{id}` | Eliminar marca (admin) |
| GET/POST | `/api/carrinho` | Carrinho do utilizador |
| DELETE | `/api/carrinho/{id}` | Remover item do carrinho |
| POST | `/api/encomendas` | Criar encomenda |
| GET | `/api/encomendas` | Encomendas do utilizador |
| GET | `/api/encomendas/admin` | Todas as encomendas (admin) |
| PUT | `/api/encomendas/{id}/estado` | Atualizar estado (admin) |
| POST | `/api/encomendas/{id}/cancelar` | Cancelar encomenda (admin) |
| GET | `/api/users` | Lista de utilizadores (admin) |
| POST | `/api/users` | Criar utilizador (admin) |
| PUT | `/api/users/{id}` | Editar utilizador (admin) |
| DELETE | `/api/users/{id}` | Eliminar utilizador (admin) |
| GET | `/api/logs` | Logs de atividade (admin) |

---

## Segurança

- Passwords com hash via ASP.NET Core Identity (PBKDF2)
- Autenticação por JWT com expiração de 2 horas
- 2FA obrigatório para administradores
- Tokens de confirmação de email e reset de password de uso único
- Validação de stock no servidor antes de confirmar encomendas
- Transações SQL para garantir consistência dos dados
- Preço unitário guardado no momento da compra para preservar o histórico

---

## Tipos de Conta

| Tipo | Valor | Permissões |
|---|---|---|
| Utilizador | 0 | Catálogo, carrinho, encomendas, perfil |
| Administrador | 1 | Acesso total + painel de administração |

---

## Desenvolvido por

**Thiago** — Projeto Final ATEC 2026
