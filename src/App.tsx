import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { lazy, Suspense } from 'react';
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const CriarPauta = lazy(() =>
  import('./pages/CriarPauta').then((m) => ({ default: m.CriarPauta })),
);
const VisualizarPauta = lazy(() =>
  import('./pages/VisualizarPauta').then((m) => ({ default: m.VisualizarPauta })),
);
const Auth = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Auth })));
const Agenda = lazy(() => import('./pages/Agenda').then((m) => ({ default: m.Agenda })));
const Mensagens = lazy(() => import('./pages/Mensagens').then((m) => ({ default: m.Mensagens })));
const Relatorios = lazy(() =>
  import('./pages/Relatorios').then((m) => ({ default: m.Relatorios })),
);
const Equipe = lazy(() => import('./pages/Equipe').then((m) => ({ default: m.Equipe })));
const Configuracoes = lazy(() =>
  import('./pages/Configuracoes').then((m) => ({ default: m.Configuracoes })),
);
const Integracoes = lazy(() =>
  import('./pages/Integracoes').then((m) => ({ default: m.Integracoes })),
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
              <Route
                path="/criar-pauta"
                element={
                  <ProtectedRoute>
                    <CriarPauta />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <ProtectedRoute>
                    <Agenda />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mensagens"
                element={
                  <ProtectedRoute>
                    <Mensagens />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <ProtectedRoute>
                    <Relatorios />
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
              <Route
                path="/integracoes"
                element={
                  <ProtectedRoute>
                    <Integracoes />
                  </ProtectedRoute>
                }
              />
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
