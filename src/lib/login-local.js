import { api } from '@/lib/api';
import useAuth from '@/store/auth';
import { toast } from '@/components/ui/use-toast';

/**
 * Realiza login local com email e senha
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<Object>} Sessão do usuário
 */
export async function loginLocal(email, password) {
  try {
    // Chama o endpoint de login local no backend
    const session = await api.post('/auth/local-login', {
      email,
      password,
    });

    // Atualiza o estado global de autenticação
    useAuth.getState().login(session);

    toast({
      title: 'Login realizado com sucesso!',
      description: `Bem-vindo, ${session.user?.name || 'Usuário'}!`
    });

    return session;

  } catch (err) {
    const status = err?.status;
    const message = err?.message;

    if (status === 401) {
      toast({
        title: 'Credenciais inválidas',
        description: 'Email ou senha incorretos.',
        variant: 'destructive',
      });
    } else if (status === 404) {
      toast({
        title: 'Usuário não encontrado',
        description: 'Não existe usuário cadastrado com este email.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Falha no login',
        description: message || 'Erro ao fazer login local.',
        variant: 'destructive',
      });
    }

    throw err;
  }
}

/**
 * Cria um JWT falso para desenvolvimento/testes
 * @param {number} hours - Número de horas de validade
 * @returns {string} Token JWT falso
 */
export function createFakeJwt(hours = 24) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + (hours * 3600);
  const iat = Math.floor(Date.now() / 1000);

  const payload = btoa(JSON.stringify({
    sub: "1",
    name: "Administrador Local",
    email: "admin@localhost",
    iat,
    exp
  }));

  const signature = "localdevsignature";

  return `${header}.${payload}.${signature}`;
}

/**
 * Login de desenvolvimento (apenas localhost)
 * @param {string} username
 * @param {string} password
 * @returns {Object|null} Sessão local ou null se não for dev
 */
export function tryDevLogin(username, password) {
  const isDev = import.meta.env.DEV || window.location.hostname === "localhost";

  if (!isDev) return null;
  if (username !== "admin" || password !== "123") return null;

  const jwt = createFakeJwt();

  return {
    user: {
      id: 1,
      name: "Administrador Local",
      email: "admin@localhost",
      role: "admin",
    },
    token: jwt,
    refreshToken: "local-refresh-token"
  };
}
