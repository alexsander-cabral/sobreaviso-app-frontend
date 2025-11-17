// src/pages/Login.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, Calendar, User, Building2 } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { loginLocal, tryDevLogin } from '@/lib/login-local';
import { loginWithActiveDirectory } from '@/lib/login-ad';
import useAuth from '@/store/auth';

const Login = () => {
  // Estados para Login Local
  const [localEmail, setLocalEmail] = useState('');
  const [localPassword, setLocalPassword] = useState('');

  // Estados para Login AD
  const [adUsername, setAdUsername] = useState('');
  const [adPassword, setAdPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('local');

  const navigate  = useNavigate();
  const location  = useLocation();
  const [searchParams] = useSearchParams();

  const user    = useAuth(s => s.user);
  const doLogin = useAuth(s => s.login);
  const hydrate = useAuth(s => s.hydrate);

  // Carrega sessão se existir
  useEffect(() => { hydrate?.(); }, []);

  // Se já tiver logado, forward automático
  useEffect(() => {
    if (user) {
      const fromState  = location.state?.from?.pathname;
      const fromQuery  = searchParams.get('redirect');
      const fallback   = '/admin/on-duty';
      navigate(fromState || fromQuery || fallback, { replace: true });
    }
  }, [user, location.state, searchParams, navigate]);

  // Handler para Login Local
  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Tenta login de desenvolvimento primeiro
      const devSession = tryDevLogin(localEmail, localPassword);
      if (devSession) {
        doLogin(devSession);
        toast({
          title: 'Login Local (Dev)',
          description: 'Bem-vindo, Administrador Local!',
        });
        return;
      }

      // Login local real via API
      await loginLocal(localEmail, localPassword);

    } catch (err) {
      // Erros já são tratados dentro de loginLocal
      console.error('Erro no login local:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler para Login AD
  const handleAdLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await loginWithActiveDirectory(adUsername, adPassword);
    } catch (err) {
      // Erros já são tratados dentro de loginWithActiveDirectory
      console.error('Erro no login AD:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-600 via-blue-600 to-sky-400 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md"
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

        <Tabs value={loginType} onValueChange={setLoginType} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="local" className="gap-2">
              <User className="w-4 h-4" />
              Login Local
            </TabsTrigger>
            <TabsTrigger value="ad" className="gap-2">
              <Building2 className="w-4 h-4" />
              Active Directory
            </TabsTrigger>
          </TabsList>

          {/* Tab: Login Local */}
          <TabsContent value="local">
            <form onSubmit={handleLocalLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="local-email">Email</Label>
                <Input
                  id="local-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={localEmail}
                  onChange={(e) => setLocalEmail(e.target.value)}
                  required
                  className="h-12"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="local-password">Senha</Label>
                <Input
                  id="local-password"
                  type="password"
                  placeholder="••••••••"
                  value={localPassword}
                  onChange={(e) => setLocalPassword(e.target.value)}
                  required
                  className="h-12"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-lg" size="lg" disabled={loading}>
                <LogIn className="w-5 h-5 mr-2" />
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                <strong>Login Local</strong><br />
                Use suas credenciais locais do sistema.
              </p>
            </div>
          </TabsContent>

          {/* Tab: Login Active Directory */}
          <TabsContent value="ad">
            <form onSubmit={handleAdLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ad-username">Usuário de Rede</Label>
                <Input
                  id="ad-username"
                  type="text"
                  placeholder="usuário de rede"
                  value={adUsername}
                  onChange={(e) => setAdUsername(e.target.value)}
                  required
                  className="h-12"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad-password">Senha</Label>
                <Input
                  id="ad-password"
                  type="password"
                  placeholder="••••••••"
                  value={adPassword}
                  onChange={(e) => setAdPassword(e.target.value)}
                  required
                  className="h-12"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-lg" size="lg" disabled={loading}>
                <LogIn className="w-5 h-5 mr-2" />
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                <strong>Active Directory</strong><br />
                Use suas credenciais de rede EBSERH.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center mt-6">
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-slate-600 hover:text-slate-900">
            <Link to="/" title="Ver plantonistas">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Ver Plantonistas
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
