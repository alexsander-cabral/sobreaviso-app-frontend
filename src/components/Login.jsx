// src/components/Login.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import useAuth from '@/store/auth';

// =========================================
// 🔐 Helper: Criar JWT Fake válido (24h)
// =========================================
function createFakeJwt(hours = 24) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));

  const exp = Math.floor(Date.now() / 1000) + hours * 3600;
  const iat = Math.floor(Date.now() / 1000);

  const payload = btoa(JSON.stringify({
    sub: "1",
    name: "Administrador Local",
    email: "admin@localhost",
    iat,
    exp
  }));

  // assinatura falsa (não importa para o front)
  const signature = "localdevsignature";

  return `${header}.${payload}.${signature}`;
}

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const doLogin = useAuth((s) => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // =========================================
      // 🔐 LOGIN LOCAL – admin / 123
      // =========================================
      if (email === "admin" && password === "123") {

        const fakeJwt = createFakeJwt();

        const fakeSession = {
          user: {
            id: 1,
            name: "Administrador Local",
            email: "admin@localhost",
            role: "admin",
          },
          token: fakeJwt,
          refreshToken: "local-refresh-token"
        };

        doLogin(fakeSession);

        toast({
          title: "Login realizado!",
          description: `Bem-vindo, Administrador Local`
        });

        setLoading(false);
        return;
      }

      // ======================================================
      // 🔄 LOGIN REAL VIA API (produção)
      // ======================================================
      const session = await api.post('/auth/login', { email, password });
      doLogin(session);

      toast({
        title: 'Login realizado!',
        description: `Bem-vindo, ${session.user.name}!`,
      });

    } catch (err) {
      toast({
        title: 'Erro no login',
        description: err?.message || 'Email ou senha incorretos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-600 via-blue-600 to-sky-400 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Área Administrativa</h2>
          <p className="text-gray-600">Faça login para gerenciar as escalas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
            <LogIn className="w-5 h-5 mr-2" />
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
