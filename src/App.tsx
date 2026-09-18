import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { lazy, Suspense } from 'react';
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const VisualizarPauta = lazy(() =>
  import('./pages/VisualizarPauta').then((m) => ({ default: m.VisualizarPauta })),
);
const Auth = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Auth })));
const Equipe = lazy(() => import('./pages/Equipe').then((m) => ({ default: m.Equipe })));
const Configuracoes = lazy(() =>
  import('./pages/Configuracoes').then((m) => ({ default: m.Configuracoes })),
);
const TrocarSenha = lazy(() =>
  import('./pages/TrocarSenha').then((m) => ({ default: m.TrocarSenha })),
);
const AprovacaoPublica = lazy(() =>
  import('./pages/AprovacaoPublica').then((m) => ({ default: m.AprovacaoPublica })),
);
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Carregando...</div>}>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth" element={<Auth />} />
              {/* Exige login, mas é a única tela que aceita a senha inicial —
                  senão o redirecionamento apontaria para ela mesma. */}
              <Route
                path="/trocar-senha"
                element={
                  <ProtectedRoute permiteSenhaProvisoria>
                    <TrocarSenha />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipe"
                element={
                  <ProtectedRoute>
                    <Equipe />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute>
                    <Configuracoes />
                  </ProtectedRoute>
                }
              />
              {/* A tela do cliente. Sem login: o token do link é a credencial, e
                  cada função do banco confere o token antes de devolver algo. */}
              <Route path="/aprovacao/:token" element={<AprovacaoPublica />} />

              {/* Interna, apesar do nome. Estava fora do ProtectedRoute, marcada
                  como "rota pública para clientes" — mas lê `pautas` direto, e o
                  anônimo recebe "permission denied for table pautas". Para quem
                  não tem login ela nunca abriu nada. Quem aprova é /aprovacao. */}
              <Route
                path="/pauta/:id"
                element={
                  <ProtectedRoute>
                    <VisualizarPauta />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
