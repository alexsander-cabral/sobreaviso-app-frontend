# Sistema de Autenticação

Este documento descreve o sistema de autenticação implementado no aplicativo.

## Visão Geral

O aplicativo suporta dois métodos de autenticação:

1. **Login Local** - Para usuários com credenciais locais armazenadas no banco de dados
2. **Active Directory (AD)** - Para usuários da rede EBSERH

## Arquitetura

### Arquivos Principais

- `src/pages/LoginPage.jsx` - Interface de login com tabs para escolher o método
- `src/lib/login-local.js` - Lógica de login local
- `src/lib/login-ad.js` - Lógica de login via Active Directory
- `src/lib/auth.js` - Gerenciamento de tokens JWT
- `src/store/auth.js` - Estado global de autenticação (Zustand)
- `src/lib/api.js` - Cliente API com refresh automático de tokens

### Fluxo de Autenticação

#### Login Local

1. Usuário preenche email e senha na tab "Login Local"
2. Sistema verifica se é login de desenvolvimento (admin/123)
3. Se não for dev, chama endpoint `POST /api/auth/local-login`
4. Backend valida credenciais e retorna JWT
5. Token é salvo no localStorage e estado Zustand é atualizado
6. Usuário é redirecionado para `/admin/on-duty`

#### Login Active Directory

1. Usuário preenche usuário de rede e senha na tab "Active Directory"
2. Sistema autentica via API externa do AD (`https://sistemas.huwc.ufc.br/auth/`)
3. Valida se usuário está em OU permitida (HUWC, MEAC, UFC)
4. Registra/atualiza usuário no backend via `POST /api/auth/ad-login`
5. Token JWT é retornado e salvo
6. Usuário é redirecionado para `/admin/on-duty`

### Login de Desenvolvimento

Para facilitar o desenvolvimento, existe um login local fake:

- **Email/Usuário**: `admin`
- **Senha**: `123`
- Funciona apenas em `localhost` ou modo `DEV`
- Gera um JWT falso com assinatura `localdevsignature`

## Endpoints Backend Necessários

### Login Local
```
POST /api/auth/local-login
Body: { email: string, password: string }
Response: { user: User, token: string, refreshToken: string }
```

### Login AD
```
POST /api/auth/ad-login
Body: { username: string, dn: string, email: string, name: string }
Response: { user: User, token: string, refreshToken: string }
```

### Refresh Token
```
POST /api/auth/refresh
Body: { refreshToken: string }
Response: { token: string, refreshToken: string }
```

### Validar Usuário
```
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { user: User }
```

## Gerenciamento de Tokens

- **Armazenamento**: localStorage
  - `auth_token` - JWT de acesso
  - `refresh_token` - Token de renovação
  - `auth_user` - Dados do usuário serializado

- **Renovação Automática**:
  - Tokens são renovados automaticamente 60 segundos antes de expirar
  - Quando requisição retorna 401, tenta renovar e reexecutar

- **Expiração**:
  - Sistema verifica expiração antes de cada requisição
  - Redireciona para login se token expirado e refresh falhar

## Interface de Login

A página de login (`/login`) possui:

- **Tabs**: Permite escolher entre "Login Local" e "Active Directory"
- **Formulários Separados**: Cada método tem seu próprio formulário
- **Validação**: Campos obrigatórios e tipos adequados (email, password)
- **Feedback Visual**: Loading states e mensagens de erro via toast
- **Redirecionamento**: Após login, redireciona para página solicitada ou `/admin/on-duty`

## Proteção de Rotas

O componente `RequireAuth` protege rotas administrativas:

```jsx
<Route path="/admin/*" element={<RequireAuth><AdminLayout /></RequireAuth>} />
```

- Verifica se usuário está autenticado
- Em produção, valida token com `GET /api/auth/me`
- Em dev com token fake, pula validação
- Redireciona para `/login` se não autenticado

## Roles e Permissões

O sistema suporta diferentes níveis de acesso:

- `admin` / `general_admin` - Acesso completo ao sistema
- `team_admin` - Acesso limitado (apenas gerenciamento de pessoas)

Verificação no `AdminLayout.jsx`:
- Menu condicional baseado em role
- Páginas protegidas por verificação de permissão

## Considerações de Segurança

1. **Senhas**: Nunca armazenadas em plain text no frontend
2. **JWT**: Assinatura verificada no backend
3. **HTTPS**: Recomendado para produção
4. **Refresh Tokens**: Devem ter vida útil limitada
5. **OU Validation**: Login AD valida organização do usuário
6. **CORS**: Configurar adequadamente no backend

## Desenvolvimento

### Testar Login Local

```bash
# 1. Iniciar backend em http://localhost:4000
# 2. Criar usuário local no banco de dados
# 3. Acessar http://localhost:3001/login
# 4. Escolher tab "Login Local"
# 5. Usar credenciais criadas
```

### Testar Login AD

```bash
# 1. Configurar VITE_AUTH_API_BASE_URL no .env
# 2. Acessar http://localhost:3001/login
# 3. Escolher tab "Active Directory"
# 4. Usar credenciais de rede EBSERH
```

### Testar Login Fake (Dev)

```bash
# 1. Acessar http://localhost:3001/login
# 2. Em qualquer tab, usar:
#    - Email/Usuário: admin
#    - Senha: 123
```

## Variáveis de Ambiente

```env
# Development (.env.development)
VITE_AUTH_API_BASE_URL=https://sistemas.huwc.ufc.br/auth/
VITE_API_URL=http://localhost:4000/api

# Production (.env.production)
VITE_AUTH_API_BASE_URL=https://sistemas.huwc.ufc.br/auth/
VITE_API_URL=https://prod.huwc.ufc.br/api-escalas
```

## Troubleshooting

### "Sessão expirada"
- Token JWT expirou e refresh falhou
- Fazer login novamente

### "Usuário não encontrado"
- Login AD bem-sucedido mas usuário não cadastrado no sistema
- Administrador deve cadastrar usuário

### "Credenciais inválidas"
- Email/senha incorretos no login local
- Verificar credenciais

### "OU não permitida"
- Usuário AD não está em organização válida
- Apenas HUWC, MEAC, UFC são permitidas

## Migração

Se você está migrando do sistema antigo:

1. Usuários AD continuam funcionando normalmente
2. Para adicionar login local:
   - Implementar endpoint `/api/auth/local-login` no backend
   - Criar tabela de usuários locais
   - Hash de senhas com bcrypt
   - Retornar JWT compatível com sistema atual

## Referências

- [JWT](https://jwt.io/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Router v6](https://reactrouter.com/)
- [Radix UI Tabs](https://www.radix-ui.com/docs/primitives/components/tabs)
